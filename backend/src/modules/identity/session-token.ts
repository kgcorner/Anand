import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Stateless session tokens: `v1.<base64url payload>.<base64url HMAC>`.
 * Payload = { sub: userId, iat: epochSeconds, exp: epochSeconds }.
 * Verification is constant-time; expired tokens are rejected, never refreshed here.
 * Deliberately NOT a JWT library — no algorithm agility required for V1,
 * and the surface area (RS256 confusion, kid traversal) is inherited for free.
 * Swap to JWT/RS256 only if Clock-skew tolerance or interop is demanded.
 */
export interface SessionTokenService {
  /** Issues a signed token for the given user, valid for ttlSeconds from now. */
  issue(userId: string): string;
  /** Verifies a token's signature and expiry. Returns { userId } or null when invalid/expired/malformed. */
  verify(token: string): { userId: string } | null;
}

/** Encodes a buffer as base64url (token transport encoding). */
function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64url');
}

/** Decodes a base64url token segment back to a buffer. */
function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

/**
 * Factory: builds the stateless HMAC session token service.
 * @param secret - HMAC signing secret from config (SESSION_SECRET). Must not be the dev default in production.
 * @param ttlSeconds - Token lifetime in seconds (default 30 days via config).
 */
export function createSessionTokenService(secret: string, ttlSeconds: number): SessionTokenService {
  const VERSION = 'v1';

  /** Signs an unsigned token string (version + payload) with HMAC-SHA256. */
  function sign(unsigned: string): string {
    return base64UrlEncode(createHmac('sha256', secret).update(unsigned).digest());
  }

  return {
    issue(userId: string): string {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const payload = { sub: userId, iat: nowSeconds, exp: nowSeconds + ttlSeconds };
      const unsigned = `${VERSION}.${base64UrlEncode(Buffer.from(JSON.stringify(payload), 'utf8'))}`;
      return `${unsigned}.${sign(unsigned)}`;
    },

    verify(token: string): { userId: string } | null {
      const parts = token.split('.');
      if (parts.length !== 3 || parts[0] !== VERSION) return null;
      const unsigned = `${parts[0]}.${parts[1]}`;
      const expected = sign(unsigned);
      const givenBuffer = Buffer.from(parts[2], 'utf8');
      const expectedBuffer = Buffer.from(expected, 'utf8');
      if (givenBuffer.length !== expectedBuffer.length) return null;
      if (!timingSafeEqual(givenBuffer, expectedBuffer)) return null;

      let payload: unknown;
      try {
        payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf8')) as unknown;
      } catch {
        return null;
      }
      if (typeof payload !== 'object' || payload === null) return null;
      const record = payload as Record<string, unknown>;
      const sub = record.sub;
      const exp = record.exp;
      if (typeof sub !== 'string' || sub.trim() === '' || typeof exp !== 'number') return null;
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (exp <= nowSeconds) return null;
      // Reasonable clock-skew tolerance: reject absurd iat in the future.
      const iat = record.iat;
      if (typeof iat === 'number' && iat > nowSeconds + 300) return null;
      return { userId: sub };
    },
  };
}

/** Generate a random user id (UUID v4 text). Kept here to avoid a uuid dependency. */
export function generateUserId(): string {
  return randomBytes(16).toString('hex');
}
