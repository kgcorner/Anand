import { Router, type NextFunction, type Request, type Response } from 'express';
import type { IdentityService } from './identity.service';
import { createAuthMiddleware, requirePrincipal } from './identity.middleware';
import type { SessionTokenService } from './session-token';

/** Dependencies for the auth router: the identity service + the session token verifier. */
export interface IdentityRouterDeps {
  identityService: IdentityService;
  sessionTokens: SessionTokenService;
}

/**
 * Auth routes. Mounted at /api/v1/auth (see routes/index.ts).
 * Handlers only validate -> call the service -> respond. No business logic here.
 */
export function createIdentityRouter(deps: IdentityRouterDeps): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(deps.sessionTokens);

  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await deps.identityService.register(req.body);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await deps.identityService.login(req.body);
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const me = await deps.identityService.currentUser(requirePrincipal(req));
      res.json(me);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
