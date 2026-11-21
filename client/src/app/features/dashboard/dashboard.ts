import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroArrowRightOnRectangle, heroShieldCheck } from '@ng-icons/heroicons/outline';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

/**
 * Post-login dashboard — intentionally blank for now. Greets the signed-in
 * user by name and offers a sign-out. Real read-model views (snapshot,
 * dashboard, organ map) land in subsequent slices; the route + guard
 * contract is established here.
 */
@Component({
  selector: 'app-dashboard',
  imports: [NgIcon],
  providers: [provideIcons({ heroArrowRightOnRectangle, heroShieldCheck })],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Signs out and returns to /login. */
  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
