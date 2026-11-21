import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowRight,
  heroCheckCircle,
  heroEye,
  heroEyeSlash,
  heroLockClosed,
  heroLockOpen,
  heroShieldCheck,
  heroUser,
  heroExclamationTriangle,
} from '@ng-icons/heroicons/outline';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

/** Minimum password length, mirrored from the backend validator (identity.service). */
const MIN_PASSWORD_LENGTH = 8;

/**
 * First-run setup page (the "bootstrap" screen). Adapted from
 * templates/account-creation.html — keeps the centered card, first-time-setup
 * pill, and encryption banner, swaps Material Symbols for Heroicons, and wires
 * the form to POST /auth/register via AuthService. The client reaches this
 * page only when GET /heartbeat reports SYSTEM_BOOTSTRAP.
 *
 * Backend contract: registration succeeds only when the users table is empty;
 * once any account exists, POST /auth/register returns 403.
 */
@Component({
  selector: 'app-setup',
  imports: [RouterLink, NgIcon, FormsModule],
  providers: [
    provideIcons({
      heroArrowRight,
      heroCheckCircle,
      heroExclamationTriangle,
      heroEye,
      heroEyeSlash,
      heroLockClosed,
      heroLockOpen,
      heroShieldCheck,
      heroUser,
    }),
  ],
  templateUrl: './setup.html',
  styleUrl: './setup.scss',
})
export class Setup {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** Show/hide toggles for the two password fields. */
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  /** True while the register call is in flight. Disables the form. */
  readonly submitting = signal(false);

  /** User-safe error from the last failed attempt, or null. */
  readonly error = signal<string | null>(null);

  /** Last client-side validation problem (password mismatch / too short), or null. */
  readonly validationError = signal<string | null>(null);

  /** Toggles the password field visibility. */
  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  /** Toggles the confirm-password field visibility. */
  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  /**
   * Submits first-run setup: validates the confirm-password client-side,
   * then POST /auth/register. On success navigates to /dashboard; on
   * "registration closed" (403) redirects to /login.
   */
  async onSubmit(form: { username: string; password: string; confirmPassword: string }): Promise<void> {
    if (this.submitting()) return;
    this.validationError.set(null);
    this.error.set(null);

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      this.validationError.set(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (form.confirmPassword.length > 0 && form.password !== form.confirmPassword) {
      this.validationError.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    try {
      const result = await this.auth.register(form.username.trim(), form.password);
      if ('error' in result) {
        if (result.error.includes('already complete')) {
          await this.router.navigateByUrl('/login');
          return;
        }
        this.error.set(result.error);
        return;
      }
      this.session.user.set(result.user);
      await this.router.navigateByUrl('/dashboard');
    } finally {
      this.submitting.set(false);
    }
  }
}
