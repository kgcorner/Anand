import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { RootRedirect } from './root-redirect';

/**
 * Client routes. '/' is the boot gate: the root component probes
 * GET /heartbeat once and redirects to /setup, /login, or /dashboard.
 * /dashboard is guarded — it requires a session token (authGuard).
 * /setup and /login are public (the heartbeat decides which is reachable).
 */
export const routes: Routes = [
  {
    path: '',
    component: RootRedirect,
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((module) => module.Login),
  },
  {
    path: 'setup',
    loadComponent: () => import('./features/bootstrap/setup/setup').then((module) => module.Setup),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((module) => module.Dashboard),
  },
  {
    path: 'dev/components',
    loadComponent: () =>
      import('./features/dev/component-catalog/component-catalog').then((m) => m.ComponentCatalog),
  },
  { path: '**', redirectTo: '' },
];
