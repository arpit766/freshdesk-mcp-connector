/** Freshdesk default ticket status codes (custom statuses may differ per account). */
export const TICKET_STATUS = {
  open: 2,
  pending: 3,
  resolved: 4,
  closed: 5,
} as const;

export type TicketStatusCode = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const TICKET_PRIORITY = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
} as const;

export type TicketPriorityCode = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
}

export interface ListTicketsFilters {
  status?: TicketStatusCode;
  priority?: TicketPriorityCode;
  requesterId?: number;
}

export interface NormalizedTicket {
  id: number;
  subject: string;
  status: number;
  priority: number;
  requesterId: number | null;
  createdAt: string;
  updatedAt: string;
  descriptionText?: string;
  tags?: string[];
  type?: string | null;
  source?: number | null;
}

export interface ListTicketsResult {
  tickets: NormalizedTicket[];
  pagination: PaginationMeta;
}

export interface SearchTicketsResult {
  tickets: NormalizedTicket[];
  pagination: PaginationMeta;
  total?: number;
}

export interface FreshdeskClient {
  listTickets(filters: ListTicketsFilters, pagination: PaginationInput): Promise<ListTicketsResult>;
  getTicket(ticketId: number): Promise<NormalizedTicket>;
  searchTickets(
    query: string,
    filters: { status?: TicketStatusCode; priority?: TicketPriorityCode },
    pagination: PaginationInput,
  ): Promise<SearchTicketsResult>;
}

export interface FreshdeskRawTicket {
  id: number;
  subject?: string;
  status?: number;
  priority?: number;
  requester_id?: number;
  created_at?: string;
  updated_at?: string;
  description_text?: string;
  tags?: string[];
  type?: string | null;
  source?: number;
}
