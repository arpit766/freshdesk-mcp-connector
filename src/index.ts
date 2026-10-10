#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { Logger } from './logging.js';
import { createMcpServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = new Logger(config.logLevel);
  logger.info('starting_freshdesk_mcp', { mode: config.mode });

  const server = createMcpServer(config, logger);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: 'error', message }));
  process.exit(1);
});
