import type { AppConfig } from '../config.js';
import { ConnectorError, mapHttpStatusToError } from '../errors.js';
import type { Logger } from '../logging.js';
import { createRequestId } from '../logging.js';
import { RateLimiter } from '../resilience/rate-limiter.js';
import { DEFAULT_RETRY_POLICY, withRetry } from '../resilience/retry.js';
import { redactHeaders } from '../security/redaction.js';

export type FetchFn = typeof fetch;

export interface HttpRequestOptions {
  path: string;
  query?: Record<string, string | number | undefined>;
  context: string;
}

export class FreshdeskHttp {
  private readonly limiter: RateLimiter;

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly fetchImpl: FetchFn = fetch,
    limiter?: RateLimiter,
  ) {
    // ~3 requests/sec burst bucket (client-side throttle only)
    this.limiter = limiter ?? new RateLimiter(10, 10 / 1000);
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    if (!this.config.baseUrl) {
      throw new ConnectorError('Freshdesk base URL is not configured.', {
        code: 'CONFIG_ERROR',
        retryable: false,
      });
    }
    const url = new URL(`${this.config.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private authHeader(): string {
    if (!this.config.apiKey) {
      throw new ConnectorError('Freshdesk API key is not configured.', {
        code: 'CONFIG_ERROR',
        retryable: false,
      });
    }
    const token = Buffer.from(`${this.config.apiKey}:X`).toString('base64');
    return `Basic ${token}`;
  }

  async getJson<T>(options: HttpRequestOptions): Promise<T> {
    const requestId = createRequestId();
    const url = this.buildUrl(options.path, options.query);
    const policy = {
      ...DEFAULT_RETRY_POLICY,
      maxRetries: this.config.maxRetries,
    };

    return withRetry(
      async (attempt) => {
        await this.limiter.acquire();
        const started = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

        try {
          const response = await this.fetchImpl(url, {
            method: 'GET',
            headers: {
              Authorization: this.authHeader(),
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          const durationMs = Date.now() - started;
          this.logger.info('freshdesk_http_response', {
            operation: options.context,
            requestId,
            durationMs,
            httpStatus: response.status,
            retryCount: attempt,
            success: response.ok,
          });

          if (!response.ok) {
            const err = mapHttpStatusToError(response.status, options.context);
            if (response.status === 429) {
              const retryAfter = response.headers.get('retry-after');
              const retryAfterMs = retryAfter ? parseRetryAfter(retryAfter) : undefined;
              throw new ConnectorError(err.message, {
                code: 'RATE_LIMITED',
                statusCode: 429,
                retryable: true,
                details: { retryAfterMs },
              });
            }
            throw err;
          }

          const text = await response.text();
          try {
            return JSON.parse(text) as T;
          } catch (parseError) {
            throw new ConnectorError('Malformed JSON response from Freshdesk.', {
              code: 'PARSE_ERROR',
              retryable: false,
              cause: parseError,
            });
          }
        } catch (error) {
          if (error instanceof ConnectorError) {
            throw error;
          }
          if (error instanceof Error && error.name === 'AbortError') {
            throw new ConnectorError('Freshdesk request timed out.', {
              code: 'TIMEOUT',
              retryable: true,
              cause: error,
            });
          }
          this.logger.error('freshdesk_http_error', {
            operation: options.context,
            requestId,
            retryCount: attempt,
            headers: redactHeaders({ Authorization: 'present' }),
          });
          throw error;
        } finally {
          clearTimeout(timeout);
        }
      },
      {
        policy,
        getRetryAfterMs: (error) => {
          if (error instanceof ConnectorError && error.details?.retryAfterMs !== undefined) {
            const val = error.details.retryAfterMs;
            return typeof val === 'number' ? val : undefined;
          }
          return undefined;
        },
      },
    );
  }
}

function parseRetryAfter(value: string): number | undefined {
  const seconds = Number(value);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  return undefined;
}
