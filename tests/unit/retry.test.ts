import { describe, expect, it, vi } from 'vitest';
import { ConnectorError } from '../../src/errors.js';
import { computeBackoffDelay, withRetry } from '../../src/resilience/retry.js';

describe('retry', () => {
  it('computes backoff with retry-after preference', () => {
    const delay = computeBackoffDelay(
      {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        maxTotalDurationMs: 5000,
        jitterRatio: 0,
      },
      { attempt: 2, retryAfterMs: 250 },
    );
    expect(delay).toBe(250);
  });

  it('retries retryable errors then succeeds', async () => {
    const sleep = vi.fn(async () => undefined);
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) {
          throw new ConnectorError('rate limited', { code: 'RATE_LIMITED', retryable: true });
        }
        return 'ok';
      },
      {
        policy: {
          maxRetries: 3,
          baseDelayMs: 10,
          maxDelayMs: 20,
          maxTotalDurationMs: 1000,
          jitterRatio: 0,
        },
        sleep,
      },
    );
    expect(result).toBe('ok');
    expect(calls).toBe(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('does not retry validation errors', async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw new ConnectorError('bad request', { code: 'VALIDATION_ERROR', retryable: false });
        },
        {
          policy: {
            maxRetries: 3,
            baseDelayMs: 10,
            maxDelayMs: 20,
            maxTotalDurationMs: 1000,
            jitterRatio: 0,
          },
          sleep: async () => undefined,
        },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(calls).toBe(1);
  });
});
