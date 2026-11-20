/**
 * Wire DTOs for the identity domain. camelCase; these are the API contract.
 * Storage shapes live in identity.model.ts (snake_case for SQLite 1:1 mapping).
 */

/** The authenticated caller. Attached by identity.middleware as req.principal. */
export interface IdentityPrincipal {
  userId: string;
}

/** Request body for POST /auth/register. password must be 8–128 chars; validated by the service. */
export interface RegisterRequest {
  username: string;
  password: string;
}

/** Request body for POST /auth/login. Same credential shape as registration. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Successful register/login response. Contains the bearer token and identity of the user. Never carries hashes. */
export interface SessionResponse {
  token: string;
  /** Always 'Bearer' in V1 — the token type for the Authorization header. */
  tokenType: 'Bearer';
  userId: string;
  username: string;
}

/** Response body for GET /auth/me — the caller's own identity. */
export interface MeResponse {
  userId: string;
  username: string;
}
