import { Injectable, signal } from '@angular/core';

/**
 * Minimal client-side session store.
 *
 * Holds the bearer token in memory (never localStorage in V1 — a page reload
 * is the only way the session dies) and exposes the current user identity
 * loaded from GET /auth/me. Guards read `token()`/`user()` to decide access.
 */
export interface CurrentUser {
  readonly userId: string;
  readonly username: string;
}

const TOKEN_STORAGE_KEY = 'anand.token';
const USER_STORAGE_KEY = 'anand.user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  /** The current session token, or null when logged out. */
  readonly token = signal<string | null>(null);

  /** The loaded current user, or null when no identity is established. */
  readonly user = signal<CurrentUser | null>(null);

  constructor() {
    // Restore a persisted session (survives reload) — "remember me" path.
    // In-memory only by default; persistToken() is the only writer.
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) this.token.set(stored);
      const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        try {
          this.user.set(JSON.parse(storedUser) as CurrentUser);
        } catch {
          sessionStorage.removeItem(USER_STORAGE_KEY);
        }
      }
    } catch {
      // sessionStorage unavailable (e.g. SSR/tests) — session stays in-memory only.
    }
  }

  /** Stores the token + user in memory. Persists to sessionStorage only when rememberMe is true. */
  setSession(token: string, user: CurrentUser, rememberMe = false): void {
    this.token.set(token);
    this.user.set(user);
    if (rememberMe) {
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {
        // Non-fatal: the in-memory session still works for this page-load.
      }
    }
  }

  /** Clears all session state. */
  logout(): void {
    this.token.set(null);
    this.user.set(null);
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Ignore storage errors — the in-memory clear already happened.
    }
  }

  /** True when a token is present (validity is server-enforced via the token expiry). */
  get isAuthenticated(): boolean {
    return this.token() !== null;
  }
}
