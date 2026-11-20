import express, { type Request, type Response } from 'express';
import { errorHandler } from './platform/error-handler';
import { createApiRouter, type ApiRouterDeps } from './routes';

/** Re-exported so server.ts and tests depend on one path for the router deps type. */
export type { ApiRouterDeps };

/**
 * Builds the Express application. Middleware order is deliberate:
 * JSON parsing first, then the mounted API router, then a 404 catch-all,
 * then the central error handler (last). No business logic lives here.
 */
export function createApp(deps: ApiRouterDeps): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());

  app.use('/api/v1', createApiRouter(deps));

  // 404 for unknown routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  return app;
}
