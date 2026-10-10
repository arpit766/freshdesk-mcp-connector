import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConnectorError } from '../errors.js';
import type { FreshdeskClient } from '../freshdesk/types.js';
import {
  getTicketInputSchema,
  listTicketsInputSchema,
  searchTicketsInputSchema,
} from '../freshdesk/schemas.js';
import { getTicketTool } from './get-ticket.js';
import { listTicketsTool } from './list-tickets.js';
import { searchTicketsTool } from './search-tickets.js';

function toolError(error: unknown): { content: { type: 'text'; text: string }[]; isError: true } {
  const message =
    error instanceof ConnectorError
      ? error.toAgentMessage()
      : error instanceof Error
        ? error.message
        : 'An unexpected error occurred.';
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

function successPayload(data: unknown): { content: { type: 'text'; text: string }[] } {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
  };
}

export function registerFreshdeskTools(server: McpServer, client: FreshdeskClient): void {
  server.registerTool(
    'list_tickets',
    {
      title: 'List Freshdesk tickets',
      description:
        'Read-only: list support tickets with optional status and priority filters. Uses Freshdesk list or search APIs depending on filters.',
      inputSchema: listTicketsInputSchema,
    },
    async (input) => {
      try {
        const parsed = listTicketsInputSchema.parse(input);
        const data = await listTicketsTool(client, parsed);
        return successPayload(data);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    'get_ticket',
    {
      title: 'Get Freshdesk ticket',
      description: 'Read-only: fetch a single ticket by numeric ID with sanitized public fields.',
      inputSchema: getTicketInputSchema,
    },
    async (input) => {
      try {
        const parsed = getTicketInputSchema.parse(input);
        const data = await getTicketTool(client, parsed);
        return successPayload(data);
      } catch (error) {
        return toolError(error);
      }
    },
  );

  server.registerTool(
    'search_tickets',
    {
      title: 'Search Freshdesk tickets',
      description:
        'Read-only: search tickets by keyword with optional status and priority filters. Query length is bounded.',
      inputSchema: searchTicketsInputSchema,
    },
    async (input) => {
      try {
        const parsed = searchTicketsInputSchema.parse(input);
        const data = await searchTicketsTool(client, parsed);
        return successPayload(data);
      } catch (error) {
        return toolError(error);
      }
    },
  );
}

/** Exported for tests that need JSON schemas */
export const toolSchemas = {
  list_tickets: listTicketsInputSchema,
  get_ticket: getTicketInputSchema,
  search_tickets: searchTicketsInputSchema,
};
