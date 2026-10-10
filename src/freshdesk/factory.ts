import type { AppConfig } from '../config.js';
import type { Logger } from '../logging.js';
import { createLiveFreshdeskClient } from './client.js';
import type { FetchFn } from './http.js';
import type { FreshdeskClient } from './types.js';
import { createMockFreshdeskClient } from '../mock/mock-client.js';

export function createFreshdeskClient(
  config: AppConfig,
  logger: Logger,
  fetchImpl?: FetchFn,
): FreshdeskClient {
  if (config.mode === 'mock') {
    return createMockFreshdeskClient();
  }
  return createLiveFreshdeskClient(config, logger, fetchImpl);
}
