import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_ENVIRONMENT } from '../../../environments/environment';

/** What the heartbeat reports. SYSTEM_BOOTSTRAP means no account exists yet. */
export type HeartbeatState = 'SYSTEM_BOOTSTRAP' | 'OK';

/**
 * The boot-time system probe (GET /heartbeat).
 *
 * Called once at app startup by the heartbeat gate: 204 No Content means
 * the system has data (OK), 200 { state: 'SYSTEM_BOOTSTRAP' } means the
 * users table is empty and the client should show the account-setup page.
 */
@Injectable({ providedIn: 'root' })
export class HeartbeatService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_ENVIRONMENT).apiBaseUrl.replace(/\/$/, '');

  /** Returns SYSTEM_BOOTSTRAP on first run, OK once any account exists. */
  async check(): Promise<HeartbeatState> {
    const response = await firstValueFrom(
      this.http.get<unknown>(`${this.apiBaseUrl}/heartbeat`, { observe: 'response' }),
    );

    if (response.status === 204) return 'OK';
    if (response.status === 200) {
      const body = response.body as { state?: string } | null;
      return body?.state === 'SYSTEM_BOOTSTRAP' ? 'SYSTEM_BOOTSTRAP' : 'OK';
    }
    return 'OK';
  }
}
