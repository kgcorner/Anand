import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../platform/errors';
import type { IdentityPrincipal } from './identity.types';
import type { SessionTokenService } from './session-token';

declare global {
  namespace Express {
    interface Request {
      principal?: IdentityPrincipal;
    }
  }
}

/**
 * Extracts the bearer token from an Authorization header value.
 * Returns null for missing, malformed, or wrong-scheme headers.
 */
export function readBearerToken(authorization: string | undefined): string | null {
  if (authorization === undefined) return null;
  const parts = authorization.split(' ');
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== 'bearer') return null;
  const token = parts[1]?.trim() ?? '';
  return token === '' ? null : token;
}

/**
 * Authenticates the request via `Authorization: Bearer <token>` and attaches
 * `req.principal = { userId }`. Throws 401 when the token is missing/invalid.
 * Does NOT check patient ownership — that is patients/patient-ownership.ts (F4).
 */
export function createAuthMiddleware(sessionTokens: SessionTokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = readBearerToken(req.header('Authorization'));
    if (token === null) {
      next(new UnauthorizedError('Missing bearer token'));
      return;
    }
    const verified = sessionTokens.verify(token);
    if (verified === null) {
      next(new UnauthorizedError('Invalid or expired session token'));
      return;
    }
    req.principal = { userId: verified.userId };
    next();
  };
}

/** For routes where the principal is guaranteed by middleware — throws 401 if absent. */
export function requirePrincipal(req: Request): IdentityPrincipal {
  if (req.principal === undefined) throw new UnauthorizedError('Missing principal');
  return req.principal;
}
