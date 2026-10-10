import { ConnectorError } from '../errors.js';
import { redactString } from '../security/redaction.js';
import type { FreshdeskRawTicket, NormalizedTicket } from './types.js';

const MAX_DESCRIPTION_LENGTH = 2_000;

export function normalizeTicket(raw: FreshdeskRawTicket): NormalizedTicket {
  if (!raw.id || !Number.isInteger(raw.id)) {
    throw new ConnectorError('Malformed Freshdesk ticket response.', {
      code: 'PARSE_ERROR',
      retryable: false,
    });
  }

  const description =
    raw.description_text !== undefined
      ? redactString(raw.description_text, MAX_DESCRIPTION_LENGTH)
      : undefined;

  return {
    id: raw.id,
    subject: redactString(raw.subject ?? '(no subject)', 300),
    status: raw.status ?? 0,
    priority: raw.priority ?? 0,
    requesterId: raw.requester_id ?? null,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    descriptionText: description,
    tags: raw.tags?.slice(0, 20),
    type: raw.type ?? null,
    source: raw.source ?? null,
  };
}
