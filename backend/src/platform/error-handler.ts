import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors';
import { createLogger } from './logger';

const logger = createLogger('error-handler');

/**
 * Central Express error handler (must be the last middleware).
 * Maps typed AppErrors to their status; everything else is a 500.
 * Stack traces and secrets never reach the client.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  // SQLite constraint errors and other unexpected failures.
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Unexpected server error' });
}
