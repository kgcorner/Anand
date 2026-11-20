import { randomUUID } from 'node:crypto';
import { ConflictError, InvalidCredentialsError, ValidationError } from '../../platform/errors';
import type { IdentityRepository } from './identity.repository';
import type { PasswordHasher } from './password-hasher';
import type { SessionTokenService } from './session-token';
import type { IdentityPrincipal, LoginRequest, MeResponse, RegisterRequest, SessionResponse } from './identity.types';

const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,63}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/** Validates the registration username: 2–64 chars, starts alphanumeric, then [A-Za-z0-9._-]. Returns the trimmed value. */
function validateUsername(username: unknown): string {
  if (typeof username !== 'string') throw new ValidationError('username is required');
  const trimmed = username.trim();
  if (!USERNAME_PATTERN.test(trimmed)) {
    throw new ValidationError('username must be 2-64 characters of letters, digits, dot, underscore or hyphen, and start with a letter or digit');
  }
  return trimmed;
}

/** Validates a registration password (8–128 chars). Returns the password unchanged. */
function validatePassword(password: unknown): string {
  if (typeof password !== 'string') throw new ValidationError('password is required');
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw new ValidationError(`password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`);
  }
  return password;
}

/** Parses/validates an unknown request body into a RegisterRequest (400 on any mismatch). */
function parseRegisterRequest(body: unknown): RegisterRequest {
  if (typeof body !== 'object' || body === null) throw new ValidationError('Request body must be a JSON object');
  const record = body as Record<string, unknown>;
  return {
    username: validateUsername(record.username),
    password: validatePassword(record.password),
  };
}

/** Parses/validates an unknown request body into a LoginRequest. Login checks presence only — strength is a registration concern. */
function parseLoginRequest(body: unknown): LoginRequest {
  if (typeof body !== 'object' || body === null) throw new ValidationError('Request body must be a JSON object');
  const record = body as Record<string, unknown>;
  if (typeof record.username !== 'string' || record.username.trim() === '') {
    throw new ValidationError('username is required');
  }
  if (typeof record.password !== 'string' || record.password === '') {
    throw new ValidationError('password is required');
  }
  return { username: record.username.trim(), password: record.password };
}

/** Use-case contract for identity: registration, authentication, and session introspection. */
export interface IdentityService {
  register(body: unknown): Promise<SessionResponse>;
  login(body: unknown): Promise<SessionResponse>;
  currentUser(principal: IdentityPrincipal): Promise<MeResponse>;
}

/**
 * Factory: builds the identity use-case service. Collaborators are injected
 * interfaces (repository, hasher, token service) — the composition root
 * (server.ts) passes concrete implementations. No business logic outside
 * the three use cases.
 */
export function createIdentityService(
  identityRepository: IdentityRepository,
  passwordHasher: PasswordHasher,
  sessionTokens: SessionTokenService,
): IdentityService {
  return {
    /** Register: validate → check uniqueness (409) → hash → persist → issue session token. */
    async register(body: unknown): Promise<SessionResponse> {
      const request = parseRegisterRequest(body);
      const existing = await identityRepository.findByUsername(request.username);
      if (existing !== null) throw new ConflictError('Username already taken');
      const passwordHash = await passwordHasher.hash(request.password);
      const userId = randomUUID();
      await identityRepository.create({ id: userId, username: request.username, password_hash: passwordHash });
      return {
        token: sessionTokens.issue(userId),
        tokenType: 'Bearer',
        userId,
        username: request.username,
      };
    },

    /** Login: validate → look up user → constant-time verify → issue token. Wrong password and unknown user return the same generic 401. */
    async login(body: unknown): Promise<SessionResponse> {
      const request = parseLoginRequest(body);
      const account = await identityRepository.findByUsername(request.username);
      if (account === null) throw new InvalidCredentialsError();
      const ok = await passwordHasher.verify(request.password, account.password_hash);
      if (!ok) throw new InvalidCredentialsError();
      return {
        token: sessionTokens.issue(account.id),
        tokenType: 'Bearer',
        userId: account.id,
        username: account.username,
      };
    },

    /** Resolve the middleware principal to the stored account (GET /auth/me). */
    async currentUser(principal: IdentityPrincipal): Promise<MeResponse> {
      const account = await identityRepository.findById(principal.userId);
      if (account === null) throw new InvalidCredentialsError();
      return { userId: account.id, username: account.username };
    },
  };
}
