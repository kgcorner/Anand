import { Router } from 'express';
import { healthRouter } from './health.routes';
import { createIdentityRouter, type IdentityService, type SessionTokenService } from '../modules/identity';

/** Dependencies the API router fans out to each module router factory. */
export interface ApiRouterDeps {
  identityService: IdentityService;
  sessionTokens: SessionTokenService;
}

/**
 * Aggregates every module router under /api/v1. Contains NO route handlers
 * of its own — each module owns its routes; this file only mounts them.
 */
export function createApiRouter(deps: ApiRouterDeps): Router {
  const apiRouter = Router();

  apiRouter.use('/health', healthRouter);
  apiRouter.use('/auth', createIdentityRouter(deps));

  return apiRouter;
}
