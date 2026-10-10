import { describe, expect, it } from 'vitest';
import {
  getTicketInputSchema,
  listTicketsInputSchema,
  searchTicketsInputSchema,
} from '../../src/freshdesk/schemas.js';

describe('input schemas', () => {
  it('validates list tickets pagination bounds', () => {
    expect(() => listTicketsInputSchema.parse({ page: 0 })).toThrow();
    expect(() => listTicketsInputSchema.parse({ page_size: 101 })).toThrow();
    const ok = listTicketsInputSchema.parse({ page: 1, page_size: 30, status: 2 });
    expect(ok.page).toBe(1);
  });

  it('validates get ticket id', () => {
    expect(() => getTicketInputSchema.parse({ ticket_id: 0 })).toThrow();
    expect(getTicketInputSchema.parse({ ticket_id: 10 }).ticket_id).toBe(10);
  });

  it('validates search query length', () => {
    expect(() => searchTicketsInputSchema.parse({ query: '' })).toThrow();
    expect(() => searchTicketsInputSchema.parse({ query: 'x'.repeat(201) })).toThrow();
  });

  it('rejects unsupported status values', () => {
    expect(() => listTicketsInputSchema.parse({ status: 99 })).toThrow();
  });
});
