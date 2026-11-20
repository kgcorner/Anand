/**
 * Typed application errors. Services throw these; platform/error-handler
 * maps each one to an HTTP status + JSON body. Never throw a raw Error
 * for an expected failure case.
 */

/** Base class for all expected application failures. Carries the API error code + HTTP status. */
export class AppError extends Error {
  /** Stable machine-readable code returned in the JSON body, e.g. 'VALIDATION_ERROR'. */
  readonly code: string;
  /** HTTP status the error handler returns. */
  readonly status: number;
  /** Optional structured detail (e.g. per-field validation messages). Safe for clients. */
  readonly details?: unknown;

  constructor(code: string, status: number, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** 400 — the request body or parameters are invalid. */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

/** 401 — authentication is required or the token is missing/invalid. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', 401, message);
  }
}

/** 401 — username/password did not match. Message is generic to avoid user enumeration. */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super('INVALID_CREDENTIALS', 401, 'Invalid username or password');
  }
}

/** 403 — the authenticated user is not allowed to access this resource. */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', 403, message);
  }
}

/** 404 — the requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', 404, `${resource} not found`);
  }
}

/** 409 — the request conflicts with current state (e.g. duplicate username). */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super('CONFLICT', 409, message);
  }
}
