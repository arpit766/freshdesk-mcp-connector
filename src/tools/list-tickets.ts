import type { ListTicketsInput } from '../freshdesk/schemas.js';
import type { FreshdeskClient, TicketPriorityCode, TicketStatusCode } from '../freshdesk/types.js';

export async function listTicketsTool(client: FreshdeskClient, input: ListTicketsInput) {
  const result = await client.listTickets(
    {
      status: input.status as TicketStatusCode | undefined,
      priority: input.priority as TicketPriorityCode | undefined,
    },
    { page: input.page, pageSize: input.page_size },
  );

  return {
    tickets: result.tickets,
    pagination: {
      page: result.pagination.page,
      page_size: result.pagination.pageSize,
      total: result.pagination.total,
    },
    has_more: result.pagination.hasMore ?? false,
  };
}
