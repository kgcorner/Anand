import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Password hashing via Node's built-in scrypt (OWASP-recommended KDF for
 * password storage). No external dependency; encoded as `scrypt:N:r:p$salt$hash`.
 * The hash never leaves the identity module (F8).
 */
export interface PasswordHasher {
  /** Hashes a plaintext password into the scrypt:$ format. Salt is generated per call. */
  hash(password: string): Promise<string>;
  /** Verifies a plaintext password against a stored hash. Constant-time comparison. */
  verify(password: string, passwordHash: string): Promise<boolean>;
}

const N = 16384;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';

/** Derives the scrypt key for a password+salt with the given cost parameters. Pure wrapper over scryptSync. */
function derive(password: string, salt: Buffer, n: number, rParam: number, pParam: number): Buffer {
  return scryptSync(password, salt, KEY_LENGTH, { N: n, r: rParam, p: pParam, maxmem: 64 * 1024 * 1024 });
}

/** Factory: creates the scrypt-backed PasswordHasher used in production and tests. */
export function createScryptPasswordHasher(): PasswordHasher {
  return {
    async hash(password: string): Promise<string> {
      const salt = randomBytes(SALT_BYTES);
      const derived = derive(password, salt, N, r, p);
      return [PREFIX, N, r, p, salt.toString('base64url'), derived.toString('base64url')].join('$');
    },

    async verify(password: string, passwordHash: string): Promise<boolean> {
      const parts = passwordHash.split('$');
      if (parts.length !== 6 || parts[0] !== PREFIX) return false;
      const n = Number(parts[1]);
      const rParam = Number(parts[2]);
      const pParam = Number(parts[3]);
      if (!Number.isInteger(n) || !Number.isInteger(rParam) || !Number.isInteger(pParam)) return false;
      let salt: Buffer;
      let expected: Buffer;
      try {
        salt = Buffer.from(parts[4], 'base64url');
        expected = Buffer.from(parts[5], 'base64url');
      } catch {
        return false;
      }
      if (salt.length === 0 || expected.length === 0) return false;
      let actual: Buffer;
      try {
        actual = derive(password, salt, n, rParam, pParam);
      } catch {
        return false;
      }
      if (actual.length !== expected.length) return false;
      return timingSafeEqual(actual, expected);
    },
  };
}
