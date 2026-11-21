import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { API_ENVIRONMENT } from '../../../environments/environment';
import { SessionService, type CurrentUser } from './session.service';

/**
 * The shape returned by POST /auth/register and POST /auth/login.
 * Mirrors the backend SessionResponse DTO exactly.
 */
export interface SessionResponse {
  readonly token: string;
  readonly tokenType: 'Bearer';
  readonly userId: string;
  readonly username: string;
}

/** The shape returned by GET /auth/me. Mirrors the backend MeResponse DTO. */
export interface MeResponse {
  readonly userId: string;
  readonly username: string;
}

/** Successful login/register outcome — session established and persisted. */
export interface AuthSuccess {
  readonly user: CurrentUser;
}

/** Failure outcome — error message is safe to display to the user. */
export interface AuthFailure {
  readonly error: string;
}

const GENERIC_AUTH_ERROR = 'Invalid username or password. Please try again.';
const NETWORK_ERROR = 'Unable to reach the server. Check that the backend is running.';

/**
 * Auth API client + session orchestration.
 *
 * Owns all /auth/* HTTP calls and writes the resulting session into
 * SessionService. Components call `login()` / `register()` and render the
 * returned AuthSuccess | AuthFailure union — no HTTP or storage details leak
 * into components.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly apiBaseUrl = inject(API_ENVIRONMENT).apiBaseUrl.replace(/\/$/, '');

  /** POST /auth/login. Establishes the session on success. */
  async login(username: string, password: string, rememberMe = false): Promise<AuthSuccess | AuthFailure> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<SessionResponse>(`${this.apiBaseUrl}/auth/login`, { username, password })
          .pipe(map((session) => this.establishSession(session, rememberMe))),
      );
      return response;
    } catch {
      return { error: GENERIC_AUTH_ERROR };
    }
  }

  /** POST /auth/register. Used by the first-run setup page — establishes the session on success. */
  async register(username: string, password: string): Promise<AuthSuccess | AuthFailure> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<SessionResponse>(`${this.apiBaseUrl}/auth/register`, { username, password })
          .pipe(map((session) => this.establishSession(session, true))),
      );
      return response;
    } catch (error) {
      return { error: this.describeRegisterError(error) };
    }
  }

  /** GET /auth/me. Returns the current user, or null when unauthenticated. */
  async loadCurrentUser(): Promise<CurrentUser | null> {
    if (!this.session.isAuthenticated) return null;
    try {
      const me = await firstValueFrom(this.http.get<MeResponse>(`${this.apiBaseUrl}/auth/me`));
      const user: CurrentUser = { userId: me.userId, username: me.username };
      this.session.user.set(user);
      return user;
    } catch {
      this.session.logout();
      return null;
    }
  }

  /** Clears the session (client-side logout; the server token simply expires). */
  logout(): void {
    this.session.logout();
  }

  /** Writes the session into SessionService and returns the success envelope. */
  private establishSession(session: SessionResponse, rememberMe: boolean): AuthSuccess {
    const user: CurrentUser = { userId: session.userId, username: session.username };
    this.session.setSession(session.token, user, rememberMe);
    return { user };
  }

  /** Maps a failed register call to a user-safe message (network vs. server closed). */
  private describeRegisterError(error: unknown): string {
    if (error !== null && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      if (status === 403) return 'Setup is already complete. Please sign in.';
      if (status === 409) return 'That username is already taken.';
      if (status === 400) return 'Check the username and password, then try again.';
      if (status === 0) return NETWORK_ERROR;
    }
    return GENERIC_AUTH_ERROR;
  }
}
