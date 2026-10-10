import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('MCP server integration (stdio)', () => {
  it('lists tools and executes read-only operations in mock mode', async () => {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.join(rootDir, 'dist/index.js')],
      env: {
        ...process.env,
        FRESHDESK_MODE: 'mock',
        LOG_LEVEL: 'error',
      },
      stderr: 'pipe',
    });

    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(transport);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name).sort();
    expect(names).toEqual(['get_ticket', 'list_tickets', 'search_tickets']);

    const listResult = await client.callTool({
      name: 'list_tickets',
      arguments: { page: 1, page_size: 3, status: 2 },
    });
    expect(listResult.isError).not.toBe(true);
    const listText = listResult.content?.[0];
    expect(listText?.type).toBe('text');
    if (listText?.type === 'text') {
      const payload = JSON.parse(listText.text) as { tickets: unknown[] };
      expect(payload.tickets.length).toBeGreaterThan(0);
    }

    const getResult = await client.callTool({
      name: 'get_ticket',
      arguments: { ticket_id: 1001 },
    });
    expect(getResult.isError).not.toBe(true);

    const searchResult = await client.callTool({
      name: 'search_tickets',
      arguments: { query: 'webhook', page: 1, page_size: 5 },
    });
    expect(searchResult.isError).not.toBe(true);

    const notFound = await client.callTool({
      name: 'get_ticket',
      arguments: { ticket_id: 999999 },
    });
    expect(notFound.isError).toBe(true);

    await client.close();
  }, 30_000);
});
