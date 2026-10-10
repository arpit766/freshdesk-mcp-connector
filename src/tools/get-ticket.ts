import type { FreshdeskClient } from '../freshdesk/types.js';
import type { GetTicketInput } from '../freshdesk/schemas.js';

export async function getTicketTool(client: FreshdeskClient, input: GetTicketInput) {
  const ticket = await client.getTicket(input.ticket_id);
  return { ticket };
}
