import { ConnectorError } from '../errors.js';

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  maxTotalDurationMs: number;
  jitterRatio: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  baseDelayMs: 300,
  maxDelayMs: 8_000,
  maxTotalDurationMs: 30_000,
  jitterRatio: 0.25,
};

export interface RetryContext {
  attempt: number;
  retryAfterMs?: number;
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ConnectorError) {
    return error.retryable;
  }
  if (error instanceof Error) {
    const name = error.name;
    if (name === 'AbortError' || name === 'TimeoutError') return true;
    if (error.message.includes('ECONNRESET') || error.message.includes('ENOTFOUND')) {
      return true;
    }
  }
  return false;
}

export function computeBackoffDelay(policy: RetryPolicy, ctx: RetryContext): number {
  if (ctx.retryAfterMs !== undefined && ctx.retryAfterMs > 0) {
    return Math.min(ctx.retryAfterMs, policy.maxDelayMs);
  }
  const exp = policy.baseDelayMs * 2 ** ctx.attempt;
  const capped = Math.min(exp, policy.maxDelayMs);
  const jitter = capped * policy.jitterRatio * Math.random();
  return Math.floor(capped + jitter);
}

export interface SleepFn {
  (ms: number): Promise<void>;
}

export const defaultSleep: SleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: {
    policy: RetryPolicy;
    sleep?: SleepFn;
    now?: () => number;
    isRetryable?: (error: unknown) => boolean;
    getRetryAfterMs?: (error: unknown) => number | undefined;
  },
): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? (() => Date.now());
  const isRetryable = options.isRetryable ?? isRetryableError;
  const getRetryAfterMs = options.getRetryAfterMs ?? (() => undefined);

  const start = now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.policy.maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= options.policy.maxRetries || !isRetryable(error)) {
        break;
      }
      const elapsed = now() - start;
      const delay = computeBackoffDelay(options.policy, {
        attempt,
        retryAfterMs: getRetryAfterMs(error),
      });
      if (elapsed + delay > options.policy.maxTotalDurationMs) {
        break;
      }
      await sleep(delay);
    }
  }

  if (lastError instanceof ConnectorError) {
    throw lastError;
  }
  if (lastError instanceof Error) {
    throw new ConnectorError(lastError.message, {
      code: 'NETWORK_ERROR',
      retryable: false,
      cause: lastError,
    });
  }
  throw new ConnectorError('Request failed after retries.', {
    code: 'UPSTREAM_ERROR',
    retryable: false,
    cause: lastError,
  });
}
