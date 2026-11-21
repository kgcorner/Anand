import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

/**
 * Route guard for authenticated routes (dashboard and everything after it).
 * Redirects to /login when no session token is present. When a token exists
 * but no user is loaded yet, it loads the user via GET /auth/me first.
 *
 * Usage (route config):  canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const session = inject(SessionService);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!session.isAuthenticated) {
    await router.navigateByUrl('/login');
    return false;
  }

  if (session.user() === null) {
    const user = await auth.loadCurrentUser();
    if (user === null) {
      await router.navigateByUrl('/login');
      return false;
    }
  }

  // Keep the original destination (state.url) for post-login redirect.
  return true;
};
