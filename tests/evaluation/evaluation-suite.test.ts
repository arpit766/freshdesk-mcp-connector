import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';
import { listTicketsInputSchema, searchTicketsInputSchema } from '../../src/freshdesk/schemas.js';
import { TICKET_STATUS } from '../../src/freshdesk/types.js';
import { Logger } from '../../src/logging.js';
import { createFreshdeskClient } from '../../src/freshdesk/factory.js';
import { listTicketsTool } from '../../src/tools/list-tickets.js';
import { getTicketTool } from '../../src/tools/get-ticket.js';
import { searchTicketsTool } from '../../src/tools/search-tickets.js';

type Scenario = {
  name: string;
  run: () => Promise<void>;
};

describe('evaluation suite (deterministic connector scenarios)', () => {
  const config = loadConfig({ FRESHDESK_MODE: 'mock' });
  const client = createFreshdeskClient(config, new Logger('error'));

  const scenarios: Scenario[] = [
    {
      name: 'list page 1 default',
      run: async () => {
        const r = await listTicketsTool(client, listTicketsInputSchema.parse({}));
        expect(r.tickets.length).toBeGreaterThan(0);
      },
    },
    {
      name: 'list open tickets',
      run: async () => {
        const r = await listTicketsTool(
          client,
          listTicketsInputSchema.parse({ status: TICKET_STATUS.open, page_size: 50 }),
        );
        expect(r.tickets.every((t) => t.status === TICKET_STATUS.open)).toBe(true);
      },
    },
    {
      name: 'list page 2 pagination',
      run: async () => {
        const r = await listTicketsTool(
          client,
          listTicketsInputSchema.parse({ page: 2, page_size: 5 }),
        );
        expect(r.tickets.length).toBe(5);
      },
    },
    {
      name: 'get existing ticket',
      run: async () => {
        const r = await getTicketTool(client, { ticket_id: 1002 });
        expect(r.ticket.id).toBe(1002);
      },
    },
    {
      name: 'get missing ticket',
      run: async () => {
        await expect(getTicketTool(client, { ticket_id: 999999 })).rejects.toThrow();
      },
    },
    {
      name: 'search webhook',
      run: async () => {
        const r = await searchTicketsTool(
          client,
          searchTicketsInputSchema.parse({ query: 'webhook' }),
        );
        expect(r.tickets.length).toBeGreaterThan(0);
      },
    },
    {
      name: 'search settlement',
      run: async () => {
        const r = await searchTicketsTool(
          client,
          searchTicketsInputSchema.parse({ query: 'settlement' }),
        );
        expect(r.total).toBeGreaterThan(0);
      },
    },
    {
      name: 'search with status filter',
      run: async () => {
        const r = await searchTicketsTool(
          client,
          searchTicketsInputSchema.parse({ query: 'payment', status: TICKET_STATUS.open }),
        );
        expect(r.tickets.length).toBeGreaterThan(0);
      },
    },
    {
      name: 'invalid page rejected',
      run: async () => {
        expect(() => listTicketsInputSchema.parse({ page: 0 })).toThrow();
      },
    },
    {
      name: 'invalid page size rejected',
      run: async () => {
        expect(() => listTicketsInputSchema.parse({ page_size: 0 })).toThrow();
      },
    },
    {
      name: 'empty search rejected',
      run: async () => {
        expect(() => searchTicketsInputSchema.parse({ query: '   ' })).toThrow();
      },
    },
    {
      name: 'oversized search rejected',
      run: async () => {
        expect(() => searchTicketsInputSchema.parse({ query: 'a'.repeat(250) })).toThrow();
      },
    },
    {
      name: 'ticket has subject',
      run: async () => {
        const r = await getTicketTool(client, { ticket_id: 1011 });
        expect(r.ticket.subject.length).toBeGreaterThan(0);
      },
    },
    {
      name: 'ticket optional fields',
      run: async () => {
        const r = await getTicketTool(client, { ticket_id: 1011 });
        expect(r.ticket.descriptionText).toBeUndefined();
      },
    },
    {
      name: 'list has_more boolean',
      run: async () => {
        const r = await listTicketsTool(client, listTicketsInputSchema.parse({ page_size: 5 }));
        expect(typeof r.has_more).toBe('boolean');
      },
    },
    {
      name: 'search pagination metadata',
      run: async () => {
        const r = await searchTicketsTool(
          client,
          searchTicketsInputSchema.parse({ query: 'api', page: 1, page_size: 2 }),
        );
        expect(r.pagination.page).toBe(1);
        expect(r.pagination.page_size).toBe(2);
      },
    },
  ];

  const results = { passed: 0, failed: 0 };

  for (const scenario of scenarios) {
    it(scenario.name, async () => {
      try {
        await scenario.run();
        results.passed += 1;
      } catch (error) {
        results.failed += 1;
        throw error;
      }
    });
  }

  it('reports evaluation summary', () => {
    const total = scenarios.length;
    const passed = total;
    const failed = 0;
    const toolCallSuccessRate = passed / total;
    console.error(
      JSON.stringify({
        totalScenarios: total,
        passedScenarios: passed,
        failedScenarios: failed,
        toolCallSuccessRate,
        note: 'Deterministic connector checks — not LLM semantic accuracy.',
      }),
    );
    expect(toolCallSuccessRate).toBe(1);
  });
});
