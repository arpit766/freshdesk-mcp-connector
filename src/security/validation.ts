import { ConnectorError } from '../errors.js';

const MAX_SEARCH_QUERY_LENGTH = 200;
const MAX_PAGE_SIZE = 100;

export function assertPositiveInt(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ConnectorError(`${name} must be a positive integer.`, {
      code: 'VALIDATION_ERROR',
      retryable: false,
    });
  }
}

export function clampPageSize(pageSize: number, maxPageSize: number = MAX_PAGE_SIZE): number {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new ConnectorError('page_size must be a positive integer.', {
      code: 'VALIDATION_ERROR',
      retryable: false,
    });
  }
  return Math.min(pageSize, maxPageSize);
}

export function validateSearchQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new ConnectorError('Search query cannot be empty.', {
      code: 'VALIDATION_ERROR',
      retryable: false,
    });
  }
  if (trimmed.length > MAX_SEARCH_QUERY_LENGTH) {
    throw new ConnectorError(
      `Search query must be at most ${MAX_SEARCH_QUERY_LENGTH} characters.`,
      {
        code: 'VALIDATION_ERROR',
        retryable: false,
      },
    );
  }
  return trimmed;
}

/** Escape double quotes for Freshdesk search query literals. */
export function escapeSearchTerm(term: string): string {
  return term.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function buildSearchQuery(
  userQuery: string,
  filters: { status?: number; priority?: number },
): string {
  const escaped = escapeSearchTerm(userQuery);
  const parts: string[] = [escaped];
  if (filters.status !== undefined) {
    parts.push(`status:${filters.status}`);
  }
  if (filters.priority !== undefined) {
    parts.push(`priority:${filters.priority}`);
  }
  return parts.join(' AND ');
}

/** Freshdesk search API expects the expression wrapped in double quotes. */
export function formatFreshdeskSearchQuery(expression: string): string {
  const inner = expression.replace(/^"|"$/g, '');
  return `"${inner.replace(/"/g, '\\"')}"`;
}
