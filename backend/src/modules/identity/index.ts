/**
 * Identity module public API — the only entry point other modules may import.
 * Hides repositories, services and routers behind this single surface so
 * cross-module code depends on a stable contract, not internal file layout.
 */
export { createIdentityService, type IdentityService } from './identity.service';
export { createIdentityRouter, type IdentityRouterDeps } from './identity.routes';
export { createScryptPasswordHasher, type PasswordHasher } from './password-hasher';
export { createSessionTokenService, type SessionTokenService } from './session-token';
export { createAuthMiddleware, requirePrincipal, readBearerToken } from './identity.middleware';
export { SqliteIdentityRepository } from './sqlite/repository';
export type { IdentityRepository } from './identity.repository';
export type {
  IdentityPrincipal,
  LoginRequest,
  MeResponse,
  RegisterRequest,
  SessionResponse,
} from './identity.types';
export type { UserAccount } from './identity.model';
