import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../../src/config.js';
import { ConnectorError } from '../../src/errors.js';
import { createLiveFreshdeskClient } from '../../src/freshdesk/client.js';
import { Logger } from '../../src/logging.js';

function mockFetch(handlers: Record<string, () => Response>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    for (const [pattern, handler] of Object.entries(handlers)) {
      if (url.includes(pattern)) return handler();
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;
}

describe('live Freshdesk client (mocked HTTP)', () => {
  const config = loadConfig({
    FRESHDESK_MODE: 'live',
    FRESHDESK_BASE_URL: 'https://acme.freshdesk.com',
    FRESHDESK_API_KEY: 'test-api-key',
    MAX_RETRIES: 2,
    REQUEST_TIMEOUT_MS: 5000,
  });
  const logger = new Logger('error');

  it('maps 401 to auth error', async () => {
    const fetchImpl = mockFetch({
      '/api/v2/tickets/1': () => new Response('{}', { status: 401 }),
    });
    const client = createLiveFreshdeskClient(config, logger, fetchImpl);
    await expect(client.getTicket(1)).rejects.toMatchObject({ code: 'AUTH_ERROR' });
  });

  it('maps 404 to not found', async () => {
    const fetchImpl = mockFetch({
      '/api/v2/tickets/1': () => new Response('{}', { status: 404 }),
    });
    const client = createLiveFreshdeskClient(config, logger, fetchImpl);
    await expect(client.getTicket(1)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('retries 429 with retry-after header', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return new Response('{}', { status: 429, headers: { 'retry-after': '0' } });
      }
      return new Response(
        JSON.stringify({
          id: 9,
          subject: 'ok',
          status: 2,
          priority: 1,
          requester_id: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const client = createLiveFreshdeskClient(config, logger, fetchImpl);
    const ticket = await client.getTicket(9);
    expect(ticket.id).toBe(9);
    expect(calls).toBe(2);
  });

  it('handles malformed JSON', async () => {
    const fetchImpl = mockFetch({
      '/api/v2/tickets/2': () => new Response('not-json', { status: 200 }),
    });
    const client = createLiveFreshdeskClient(config, logger, fetchImpl);
    await expect(client.getTicket(2)).rejects.toMatchObject({ code: 'PARSE_ERROR' });
  });

  it('does not send authorization in thrown agent errors', async () => {
    const fetchImpl = mockFetch({
      '/api/v2/tickets/3': () => new Response('{}', { status: 403 }),
    });
    const client = createLiveFreshdeskClient(config, logger, fetchImpl);
    try {
      await client.getTicket(3);
    } catch (error) {
      expect(error).toBeInstanceOf(ConnectorError);
      expect(String(error)).not.toContain('test-api-key');
    }
  });
});
