import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowRight,
  heroCheck,
  heroExclamationTriangle,
  heroEye,
  heroEyeSlash,
  heroLockClosed,
  heroShieldCheck,
  heroUser,
} from '@ng-icons/heroicons/outline';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

/**
 * Login page. Adapted from templates/login.html — keeps the two-column
 * layout (SRS pillars on the left, auth card on the right), swaps
 * Material Symbols for the project's Heroicons, and wires the form to
 * POST /auth/login via AuthService. The "remember me" toggle controls
 * sessionStorage persistence (SessionService.setSession).
 */
@Component({
  selector: 'app-login',
  imports: [RouterLink, NgIcon, FormsModule],
  providers: [
    provideIcons({
      heroArrowRight,
      heroCheck,
      heroExclamationTriangle,
      heroEye,
      heroEyeSlash,
      heroLockClosed,
      heroShieldCheck,
      heroUser,
    }),
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** Whether the password field is currently shown as plain text. */
  readonly showPassword = signal(false);

  /** Whether the form is submitting. Disables inputs/buttons while true. */
  readonly submitting = signal(false);

  /** User-safe error from the last failed attempt, or null. */
  readonly error = signal<string | null>(null);

  /** The remember-me checkbox value. */
  rememberMe = false;

  /** Toggles password field visibility without losing focus. */
  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  /** Submits the login form: POST /auth/login, then navigates to /dashboard on success. */
  async onSubmit(username: string, password: string): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    try {
      const result = await this.auth.login(username.trim(), password, this.rememberMe);
      if ('error' in result) {
        this.error.set(result.error);
        return;
      }
      // Persist the loaded user so the dashboard can greet by name immediately.
      this.session.user.set(result.user);
      await this.router.navigateByUrl('/dashboard');
    } finally {
      this.submitting.set(false);
    }
  }
}
