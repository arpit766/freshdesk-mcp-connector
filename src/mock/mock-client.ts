import { ConnectorError } from '../errors.js';
import { normalizeTicket } from '../freshdesk/normalize.js';
import type {
  FreshdeskClient,
  ListTicketsFilters,
  ListTicketsResult,
  NormalizedTicket,
  PaginationInput,
  SearchTicketsResult,
} from '../freshdesk/types.js';
import { MOCK_TICKETS } from './fixtures.js';

function paginate<T>(items: T[], pagination: PaginationInput): { slice: T[]; hasMore: boolean } {
  const start = (pagination.page - 1) * pagination.pageSize;
  const slice = items.slice(start, start + pagination.pageSize);
  const hasMore = start + pagination.pageSize < items.length;
  return { slice, hasMore };
}

function applyListFilters(tickets: typeof MOCK_TICKETS, filters: ListTicketsFilters) {
  return tickets.filter((t) => {
    if (filters.status !== undefined && t.status !== filters.status) return false;
    if (filters.priority !== undefined && t.priority !== filters.priority) return false;
    if (filters.requesterId !== undefined && t.requester_id !== filters.requesterId) return false;
    return true;
  });
}

function searchMockTickets(
  query: string,
  filters: { status?: number; priority?: number },
): typeof MOCK_TICKETS {
  const q = query.toLowerCase();
  return MOCK_TICKETS.filter((t) => {
    const haystack = [t.subject ?? '', t.description_text ?? '', ...(t.tags ?? [])]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
    if (filters.status !== undefined && t.status !== filters.status) return false;
    if (filters.priority !== undefined && t.priority !== filters.priority) return false;
    return true;
  });
}

export function createMockFreshdeskClient(): FreshdeskClient {
  return {
    async listTickets(filters, pagination): Promise<ListTicketsResult> {
      const filtered = applyListFilters(MOCK_TICKETS, filters);
      const { slice, hasMore } = paginate(filtered, pagination);
      return {
        tickets: slice.map(normalizeTicket),
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          hasMore,
          total: filtered.length,
        },
      };
    },

    async getTicket(ticketId): Promise<NormalizedTicket> {
      const raw = MOCK_TICKETS.find((t) => t.id === ticketId);
      if (!raw) {
        throw new ConnectorError(`Ticket ${ticketId} was not found.`, {
          code: 'NOT_FOUND',
          statusCode: 404,
          retryable: false,
        });
      }
      return normalizeTicket(raw);
    },

    async searchTickets(query, filters, pagination): Promise<SearchTicketsResult> {
      const filtered = searchMockTickets(query, filters);
      const { slice, hasMore } = paginate(filtered, pagination);
      return {
        tickets: slice.map(normalizeTicket),
        total: filtered.length,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: filtered.length,
          hasMore,
        },
      };
    },
  };
}
