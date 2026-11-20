import { Router, type Request, type Response } from 'express';

/**
 * Liveness probe. Mounted at /api/v1/health by routes/index.ts.
 * Returns a static payload — no authentication, no database access.
 * The process is up iff this responds; detailed health is out of scope for V1.
 */
export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'anand-backend',
    timestamp: new Date().toISOString(),
  });
});
