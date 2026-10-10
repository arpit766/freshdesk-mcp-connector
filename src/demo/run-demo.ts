import { loadConfig } from '../config.js';
import { ConnectorError } from '../errors.js';
import { createFreshdeskClient } from '../freshdesk/factory.js';
import { TICKET_PRIORITY, TICKET_STATUS } from '../freshdesk/types.js';
import { Logger } from '../logging.js';

async function run(): Promise<void> {
  process.env.FRESHDESK_MODE = process.env.FRESHDESK_MODE ?? 'mock';
  const config = loadConfig({ ...process.env, FRESHDESK_MODE: 'mock' });
  const logger = new Logger(config.logLevel);
  const client = createFreshdeskClient(config, logger);

  console.error('=== Freshdesk MCP Connector Demo (mock mode) ===\n');

  console.error('1) List open OR high-priority tickets (page 1)...');
  const openList = await client.listTickets(
    { status: TICKET_STATUS.open },
    { page: 1, pageSize: 5 },
  );
  console.error(JSON.stringify(openList, null, 2));

  const highList = await client.listTickets(
    { priority: TICKET_PRIORITY.high },
    { page: 1, pageSize: 5 },
  );
  console.error('High-priority sample:', JSON.stringify(highList.tickets.map((t) => t.id)));

  console.error('\n2) Get ticket by ID 1003...');
  const ticket = await client.getTicket(1003);
  console.error(JSON.stringify(ticket, null, 2));

  console.error('\n3) Search tickets for keyword "webhook"...');
  const search = await client.searchTickets('webhook', {}, { page: 1, pageSize: 10 });
  console.error(JSON.stringify(search, null, 2));

  console.error('\n4) Handled error — ticket not found...');
  try {
    await client.getTicket(999999);
  } catch (error) {
    if (error instanceof ConnectorError) {
      console.error('Expected error:', error.toAgentMessage(), `[${error.code}]`);
    } else {
      throw error;
    }
  }

  console.error('\nDemo completed successfully.');
}

run().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
