import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AppConfig } from './config.js';
import { createFreshdeskClient } from './freshdesk/factory.js';
import type { Logger } from './logging.js';
import { registerFreshdeskTools } from './tools/register-tools.js';

export function createMcpServer(config: AppConfig, logger: Logger): McpServer {
  const client = createFreshdeskClient(config, logger);
  const server = new McpServer({
    name: 'freshdesk-mcp-connector',
    version: '1.0.0',
  });
  registerFreshdeskTools(server, client);
  return server;
}
