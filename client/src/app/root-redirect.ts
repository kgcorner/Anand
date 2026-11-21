import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HeartbeatService } from './core/services/heartbeat.service';
import { SessionService } from './core/services/session.service';

/**
 * Root route component ('/'). Runs the heartbeat probe once at app boot,
 * then redirects: SYSTEM_BOOTSTRAP → /setup, otherwise OK → /dashboard
 * when a session token exists, /login when it does not. It renders only a
 * brief "checking" state while the probe is in flight.
 */
@Component({
  selector: 'app-root-redirect',
  template: `
    <div class="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
      @if (error(); as message) {
        <p class="text-slate-600 text-body-md">{{ message }}</p>
        <button type="button" class="btn btn-secondary" (click)="retry()">Try again</button>
      } @else {
        <p class="text-slate-500 text-body-md">Starting Anand…</p>
      }
    </div>
  `,
})
export class RootRedirect {
  private readonly heartbeat = inject(HeartbeatService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** A user-safe message, set only when the boot probe fails. */
  readonly error = signal<string | null>(null);

  /** Runs the probe and redirects. Called once on component creation (app boot). */
  constructor() {
    void this.check();
  }

  /** Re-runs the boot probe after a failure. */
  async retry(): Promise<void> {
    this.error.set(null);
    await this.check();
  }

  /** Probes GET /heartbeat once, then navigates to the right screen. */
  private async check(): Promise<void> {
    try {
      const state = await this.heartbeat.check();
      if (state === 'SYSTEM_BOOTSTRAP') {
        await this.router.navigateByUrl('/setup');
        return;
      }
      await this.router.navigateByUrl(this.session.isAuthenticated ? '/dashboard' : '/login');
    } catch {
      this.error.set('Unable to reach the server. Is the backend running?');
    }
  }
}
