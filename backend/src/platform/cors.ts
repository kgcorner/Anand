import cors, { type CorsOptions } from 'cors';
import type { RequestHandler } from 'express';

/**
 * CORS middleware factory. Browsers on the Angular dev server (:4200) and
 * the API on :8080 are cross-origin by default; this is the only place that
 * decides which origins are trusted. Same-origin deployment behind a reverse
 * proxy does not need it, but the middleware is harmless there.
 *
 * Allowed: the origins from config.corsOrigins (default: localhost:4200).
 * Methods: GET, POST, PUT, DELETE, OPTIONS. Headers: Content-Type,
 * Authorization (for bearer tokens). Preflight is answered by cors() directly.
 */
export function createCorsMiddleware(origins: string[]): RequestHandler {
  const normalized = origins.map((origin) => origin.replace(/\/$/, ''));
  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      // Non-browser clients (curl, tests, same-origin) send no Origin header.
      if (origin === undefined) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (normalized.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  return cors(corsOptions);
}
