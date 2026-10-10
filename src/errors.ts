export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'CONFIG_ERROR'
  | 'PARSE_ERROR';

export class ConnectorError extends Error {
  readonly code: ErrorCode;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code: ErrorCode;
      statusCode?: number;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'ConnectorError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }

  toAgentMessage(): string {
    return this.message;
  }
}

export function mapHttpStatusToError(status: number, context: string): ConnectorError {
  if (status === 400) {
    return new ConnectorError(`Invalid Freshdesk request while ${context}.`, {
      code: 'VALIDATION_ERROR',
      statusCode: status,
      retryable: false,
    });
  }
  if (status === 401 || status === 403) {
    return new ConnectorError(
      'Freshdesk authentication failed or the API key lacks permission for this operation.',
      { code: 'AUTH_ERROR', statusCode: status, retryable: false },
    );
  }
  if (status === 404) {
    return new ConnectorError('The requested Freshdesk resource was not found.', {
      code: 'NOT_FOUND',
      statusCode: status,
      retryable: false,
    });
  }
  if (status === 429) {
    return new ConnectorError('Freshdesk rate limit exceeded. Please retry later.', {
      code: 'RATE_LIMITED',
      statusCode: status,
      retryable: true,
    });
  }
  if (status >= 500) {
    return new ConnectorError(`Freshdesk service error while ${context}.`, {
      code: 'UPSTREAM_ERROR',
      statusCode: status,
      retryable: true,
    });
  }
  return new ConnectorError(`Unexpected Freshdesk response (${status}) while ${context}.`, {
    code: 'UPSTREAM_ERROR',
    statusCode: status,
    retryable: false,
  });
}
