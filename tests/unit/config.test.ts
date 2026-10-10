import { describe, expect, it } from 'vitest';
import { loadConfig, validateFreshdeskHost } from '../../src/config.js';
import { ConnectorError } from '../../src/errors.js';

describe('loadConfig', () => {
  it('loads mock mode without credentials', () => {
    const config = loadConfig({ FRESHDESK_MODE: 'mock', LOG_LEVEL: 'info' });
    expect(config.mode).toBe('mock');
    expect(config.apiKey).toBeUndefined();
  });

  it('requires base URL and API key in live mode', () => {
    expect(() => loadConfig({ FRESHDESK_MODE: 'live' })).toThrow(ConnectorError);
  });

  it('enforces HTTPS and allowed Freshdesk host', () => {
    const config = loadConfig({
      FRESHDESK_MODE: 'live',
      FRESHDESK_BASE_URL: 'https://acme.freshdesk.com',
      FRESHDESK_API_KEY: 'test-key',
    });
    expect(config.baseUrl).toBe('https://acme.freshdesk.com');
  });

  it('rejects arbitrary hosts (SSRF guard)', () => {
    expect(() =>
      loadConfig({
        FRESHDESK_MODE: 'live',
        FRESHDESK_BASE_URL: 'https://evil.example.com',
        FRESHDESK_API_KEY: 'test-key',
      }),
    ).toThrow(/Freshdesk-hosted domain/);
  });

  it('rejects non-HTTPS base URL', () => {
    expect(() =>
      loadConfig({
        FRESHDESK_MODE: 'live',
        FRESHDESK_BASE_URL: 'http://acme.freshdesk.com',
        FRESHDESK_API_KEY: 'test-key',
      }),
    ).toThrow(/HTTPS/);
  });
});

describe('validateFreshdeskHost', () => {
  it('allows myfreshworks.com', () => {
    expect(() => validateFreshdeskHost(new URL('https://tenant.myfreshworks.com'))).not.toThrow();
  });
});
