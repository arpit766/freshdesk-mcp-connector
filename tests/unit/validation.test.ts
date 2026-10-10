import { describe, expect, it } from 'vitest';
import {
  buildSearchQuery,
  formatFreshdeskSearchQuery,
  validateSearchQuery,
} from '../../src/security/validation.js';

describe('search validation helpers', () => {
  it('validates non-empty bounded query', () => {
    expect(validateSearchQuery('refund')).toBe('refund');
    expect(() => validateSearchQuery('')).toThrow();
  });

  it('builds compound Freshdesk search expression', () => {
    const expr = buildSearchQuery('webhook', { status: 2, priority: 3 });
    expect(expr).toBe('webhook AND status:2 AND priority:3');
    expect(formatFreshdeskSearchQuery(expr)).toBe('"webhook AND status:2 AND priority:3"');
  });
});
