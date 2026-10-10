import { describe, expect, it } from 'vitest';
import { redactForLogs, redactHeaders, redactString } from '../../src/security/redaction.js';

describe('redaction', () => {
  it('redacts emails and phones in strings', () => {
    const out = redactString('Contact user@example.com or 9876543210');
    expect(out).not.toContain('user@example.com');
    expect(out).toContain('[REDACTED_EMAIL]');
  });

  it('redacts sensitive keys in objects', () => {
    const out = redactForLogs({ api_key: 'secret', subject: 'hello' }) as Record<string, string>;
    expect(out.api_key).toBe('[REDACTED]');
    expect(out.subject).toBe('hello');
  });

  it('redacts authorization headers', () => {
    const headers = redactHeaders({ Authorization: 'Basic abc', Accept: 'application/json' });
    expect(headers.Authorization).toBe('[REDACTED]');
    expect(headers.Accept).toBe('application/json');
  });
});
