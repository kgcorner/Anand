/**
 * Environment configuration. Every value is read once, validated at startup,
 * and passed into the composition root. Domain code never reads process.env.
 */
export interface AppConfig {
  /** TCP port to listen on. 0 means "let the OS pick" (tests). Default 8080. */
  port: number;
  /** Interface to bind to. Default '0.0.0.0' (all interfaces). */
  host: string;
  /** SQLite file path (or ':memory:'). Default 'data/anand.sqlite'. */
  databasePath: string;
  /** Secret used to HMAC-sign session tokens. Set via SESSION_SECRET. */
  sessionSecret: string;
  /** How long a session token stays valid, in seconds (SESSION_TTL_SECONDS). */
  sessionTtlSeconds: number;
}

/** Parses the PORT env var; returns 8080 when unset, throws on non-integer or out-of-range. */
function readPort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 8080;
  const port = Number(raw);
  // 0 means "let the OS pick an ephemeral port" (used by tests). ENV must still be explicit.
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: expected an integer in 0..65535, got ${JSON.stringify(raw)}`);
  }
  return port;
}

/** Parses SESSION_SECRET; requires a non-empty value in production, falls back to a dev-only secret otherwise. */
function readSessionSecret(raw: string | undefined): string {
  if (raw !== undefined && raw.trim() !== '') return raw;
  // Dev fallback only. Production MUST set SESSION_SECRET to a long random value
  // (e.g. `openssl rand -hex 32`); tokens signed with the dev secret are trivially forgeable.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production');
  }
  return 'anand-dev-only-insecure-secret';
}

/** Parses SESSION_TTL_SECONDS; defaults to 30 days. Throws on non-positive integers. */
function readSessionTtlSeconds(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return 30 * 24 * 60 * 60;
  const ttl = Number(raw);
  if (!Number.isInteger(ttl) || ttl < 1) {
    throw new Error(`Invalid SESSION_TTL_SECONDS: expected a positive integer, got ${JSON.stringify(raw)}`);
  }
  return ttl;
}

/**
 * Reads and validates all environment configuration into an AppConfig.
 * Call once at process startup (server.ts). Throws on invalid values —
 * the process should fail fast rather than run with a broken config.
 */
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: readPort(env.PORT),
    host: env.HOST?.trim() ? env.HOST : '0.0.0.0',
    databasePath: env.DATABASE_PATH?.trim() ? env.DATABASE_PATH : 'data/anand.sqlite',
    sessionSecret: readSessionSecret(env.SESSION_SECRET),
    sessionTtlSeconds: readSessionTtlSeconds(env.SESSION_TTL_SECONDS),
  };
}
