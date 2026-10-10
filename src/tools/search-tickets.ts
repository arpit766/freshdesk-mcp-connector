import type { SearchTicketsInput } from '../freshdesk/schemas.js';
import type { FreshdeskClient, TicketPriorityCode, TicketStatusCode } from '../freshdesk/types.js';

export async function searchTicketsTool(client: FreshdeskClient, input: SearchTicketsInput) {
  const result = await client.searchTickets(
    input.query,
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
    total: result.total,
  };
}
