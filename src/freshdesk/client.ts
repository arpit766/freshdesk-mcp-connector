import type { AppConfig } from '../config.js';
import { ConnectorError } from '../errors.js';
import type { Logger } from '../logging.js';
import { buildSearchQuery, formatFreshdeskSearchQuery } from '../security/validation.js';
import type { FetchFn } from './http.js';
import { FreshdeskHttp } from './http.js';
import { normalizeTicket } from './normalize.js';
import type {
  FreshdeskClient,
  FreshdeskRawTicket,
  PaginationInput,
  SearchTicketsResult,
} from './types.js';

interface SearchResponse {
  total?: number;
  results?: FreshdeskRawTicket[];
}

export function createLiveFreshdeskClient(
  config: AppConfig,
  logger: Logger,
  fetchImpl?: FetchFn,
): FreshdeskClient {
  const http = new FreshdeskHttp(config, logger, fetchImpl);

  return {
    async listTickets(filters, pagination) {
      const hasStatusOrPriority = filters.status !== undefined || filters.priority !== undefined;

      if (hasStatusOrPriority) {
        const queryParts: string[] = [];
        if (filters.status !== undefined) queryParts.push(`status:${filters.status}`);
        if (filters.priority !== undefined) queryParts.push(`priority:${filters.priority}`);
        const query = formatFreshdeskSearchQuery(queryParts.join(' AND '));
        const searchResult = await searchInternal(http, query, pagination);
        let tickets = searchResult.tickets;
        if (filters.requesterId !== undefined) {
          tickets = tickets.filter((t) => t.requesterId === filters.requesterId);
        }
        return {
          tickets,
          pagination: searchResult.pagination,
        };
      }

      const raw = await http.getJson<FreshdeskRawTicket[]>({
        path: '/api/v2/tickets',
        query: {
          page: pagination.page,
          per_page: pagination.pageSize,
          requester_id: filters.requesterId,
        },
        context: 'list_tickets',
      });

      const tickets = (raw ?? []).map(normalizeTicket);
      const hasMore = tickets.length === pagination.pageSize;
      return {
        tickets,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          hasMore,
        },
      };
    },

    async getTicket(ticketId) {
      try {
        const raw = await http.getJson<FreshdeskRawTicket>({
          path: `/api/v2/tickets/${ticketId}`,
          context: 'get_ticket',
        });
        return normalizeTicket(raw);
      } catch (error) {
        if (error instanceof ConnectorError && error.code === 'NOT_FOUND') {
          throw new ConnectorError(`Ticket ${ticketId} was not found.`, {
            code: 'NOT_FOUND',
            statusCode: 404,
            retryable: false,
          });
        }
        throw error;
      }
    },

    async searchTickets(query, filters, pagination) {
      const built = formatFreshdeskSearchQuery(buildSearchQuery(query, filters));
      return searchInternal(http, built, pagination);
    },
  };
}

async function searchInternal(
  http: FreshdeskHttp,
  query: string,
  pagination: PaginationInput,
): Promise<SearchTicketsResult> {
  const raw = await http.getJson<SearchResponse>({
    path: '/api/v2/search/tickets',
    query: {
      query,
      page: pagination.page,
    },
    context: 'search_tickets',
  });

  const results = raw.results ?? [];
  const tickets = results.slice(0, pagination.pageSize).map((t) => normalizeTicket(t));

  const total = raw.total;
  const hasMore =
    total !== undefined
      ? pagination.page * pagination.pageSize < total
      : results.length === pagination.pageSize;

  return {
    tickets,
    total,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      hasMore,
    },
  };
}
