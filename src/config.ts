import { z } from 'zod';
import { ConnectorError } from './errors.js';

const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

const envSchema = z.object({
  FRESHDESK_MODE: z.enum(['mock', 'live']).default('mock'),
  FRESHDESK_BASE_URL: z.string().optional(),
  FRESHDESK_API_KEY: z.string().optional(),
  LOG_LEVEL: logLevelSchema.default('info'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(10_000),
  MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  MAX_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(100),
});

export type AppConfig = {
  mode: 'mock' | 'live';
  baseUrl?: string;
  apiKey?: string;
  logLevel: z.infer<typeof logLevelSchema>;
  requestTimeoutMs: number;
  maxRetries: number;
  maxPageSize: number;
};

const ALLOWED_FRESHDESK_HOST_SUFFIXES = ['.freshdesk.com', '.myfreshworks.com'];

export function validateFreshdeskHost(url: URL): void {
  const host = url.hostname.toLowerCase();
  const allowed = ALLOWED_FRESHDESK_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  );
  if (!allowed) {
    throw new ConnectorError(
      'FRESHDESK_BASE_URL must point to a Freshdesk-hosted domain (*.freshdesk.com or *.myfreshworks.com).',
      { code: 'CONFIG_ERROR', retryable: false },
    );
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ConnectorError(`Invalid configuration: ${message}`, {
      code: 'CONFIG_ERROR',
      retryable: false,
    });
  }

  const data = parsed.data;
  if (data.FRESHDESK_MODE === 'live') {
    if (!data.FRESHDESK_BASE_URL?.trim()) {
      throw new ConnectorError('FRESHDESK_BASE_URL is required in live mode.', {
        code: 'CONFIG_ERROR',
        retryable: false,
      });
    }
    if (!data.FRESHDESK_API_KEY?.trim()) {
      throw new ConnectorError('FRESHDESK_API_KEY is required in live mode.', {
        code: 'CONFIG_ERROR',
        retryable: false,
      });
    }
    let url: URL;
    try {
      url = new URL(data.FRESHDESK_BASE_URL.trim());
    } catch {
      throw new ConnectorError('FRESHDESK_BASE_URL must be a valid URL.', {
        code: 'CONFIG_ERROR',
        retryable: false,
      });
    }
    if (url.protocol !== 'https:') {
      throw new ConnectorError('FRESHDESK_BASE_URL must use HTTPS in live mode.', {
        code: 'CONFIG_ERROR',
        retryable: false,
      });
    }
    validateFreshdeskHost(url);
    const normalized = url.origin;
    return {
      mode: 'live',
      baseUrl: normalized,
      apiKey: data.FRESHDESK_API_KEY.trim(),
      logLevel: data.LOG_LEVEL,
      requestTimeoutMs: data.REQUEST_TIMEOUT_MS,
      maxRetries: data.MAX_RETRIES,
      maxPageSize: data.MAX_PAGE_SIZE,
    };
  }

  return {
    mode: 'mock',
    logLevel: data.LOG_LEVEL,
    requestTimeoutMs: data.REQUEST_TIMEOUT_MS,
    maxRetries: data.MAX_RETRIES,
    maxPageSize: data.MAX_PAGE_SIZE,
  };
}
