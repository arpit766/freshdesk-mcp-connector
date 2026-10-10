export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogFields {
  operation?: string;
  durationMs?: number;
  success?: boolean;
  httpStatus?: number;
  retryCount?: number;
  rateLimited?: boolean;
  requestId?: string;
  errorCode?: string;
  [key: string]: unknown;
}

export class Logger {
  private readonly minLevel: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel];
  }

  private write(level: LogLevel, message: string, fields?: LogFields): void {
    if (!this.shouldLog(level)) return;
    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      ...fields,
    };
    console.error(JSON.stringify(entry));
  }

  debug(message: string, fields?: LogFields): void {
    this.write('debug', message, fields);
  }

  info(message: string, fields?: LogFields): void {
    this.write('info', message, fields);
  }

  warn(message: string, fields?: LogFields): void {
    this.write('warn', message, fields);
  }

  error(message: string, fields?: LogFields): void {
    this.write('error', message, fields);
  }
}

export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
