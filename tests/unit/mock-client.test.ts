import { describe, expect, it } from 'vitest';
import { ConnectorError } from '../../src/errors.js';
import { TICKET_PRIORITY, TICKET_STATUS } from '../../src/freshdesk/types.js';
import { createMockFreshdeskClient } from '../../src/mock/mock-client.js';

describe('mock Freshdesk client', () => {
  const client = createMockFreshdeskClient();

  it('lists tickets with pagination', async () => {
    const page1 = await client.listTickets({}, { page: 1, pageSize: 5 });
    expect(page1.tickets).toHaveLength(5);
    expect(page1.pagination.hasMore).toBe(true);

    const page4 = await client.listTickets({}, { page: 4, pageSize: 5 });
    expect(page4.tickets.length).toBeGreaterThan(0);
  });

  it('filters by status and priority', async () => {
    const open = await client.listTickets(
      { status: TICKET_STATUS.open },
      { page: 1, pageSize: 50 },
    );
    expect(open.tickets.every((t) => t.status === TICKET_STATUS.open)).toBe(true);

    const urgent = await client.listTickets(
      { priority: TICKET_PRIORITY.urgent },
      { page: 1, pageSize: 50 },
    );
    expect(urgent.tickets.length).toBeGreaterThan(0);
  });

  it('gets ticket by id and returns not found', async () => {
    const ticket = await client.getTicket(1001);
    expect(ticket.id).toBe(1001);

    await expect(client.getTicket(424242)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('searches tickets by keyword', async () => {
    const result = await client.searchTickets('webhook', {}, { page: 1, pageSize: 10 });
    expect(result.tickets.length).toBeGreaterThan(0);
    expect(result.tickets.some((t) => t.subject.toLowerCase().includes('webhook'))).toBe(true);
  });

  it('rejects invalid ticket id at tool layer via schema elsewhere', async () => {
    await expect(client.getTicket(-1)).rejects.toBeInstanceOf(ConnectorError);
  });
});
