/**
 * Minimal structured logger. Domain code uses this instead of console.*.
 * Format: ISO timestamp, level, scope, message + optional meta.
 * No secrets or password hashes may be passed as meta.
 */
export interface Logger {
  /** Logs an informational event. */
  info(message: string, meta?: unknown): void;
  /** Logs a recoverable problem. */
  warn(message: string, meta?: unknown): void;
  /** Logs a failure that needs attention. */
  error(message: string, meta?: unknown): void;
}

/** Formats and writes one log line. error level goes to stderr; info/warn to stdout. */
function write(level: string, scope: string, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} [${scope}] ${message}`;
  const writer = level === 'error' ? console.error : console.log;
  if (meta === undefined) {
    writer(line);
  } else {
    writer(line, meta);
  }
}

/** Factory: creates a logger scoped to a module name (e.g. 'server', 'error-handler'). */
export function createLogger(scope: string): Logger {
  return {
    info: (message, meta) => write('info', scope, message, meta),
    warn: (message, meta) => write('warn', scope, message, meta),
    error: (message, meta) => write('error', scope, message, meta),
  };
}
