import { Router, type NextFunction, type Request, type Response } from 'express';
import type { HeartbeatService } from './heartbeat.service';

/** Dependencies for the heartbeat router: the heartbeat service. */
export interface HeartbeatRouterDeps {
  heartbeatService: HeartbeatService;
}

/**
 * Heartbeat routes. Mounted at /api/v1/heartbeat (see routes/index.ts).
 * Public — no auth is required for the probe; it must work before any login.
 *
 * Response contract:
 * - 204 No Content when the system is live with data (the state is OK).
 * - 200 JSON { state: 'SYSTEM_BOOTSTRAP' } when no account exists yet, so the
 *   client can route straight to the account-setup page.
 */
export function createHeartbeatRouter(deps: HeartbeatRouterDeps): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deps.heartbeatService.check();
      if (result.state === 'SYSTEM_BOOTSTRAP') {
        res.status(200).json(result);
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
