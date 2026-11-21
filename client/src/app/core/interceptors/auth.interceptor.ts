import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionService } from '../services/session.service';

/**
 * Attaches `Authorization: Bearer <token>` to every outgoing request when a
 * session token is present. Auth-free endpoints (login, register, heartbeat)
 * simply do not send the header — the backend accepts requests without it.
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const session = inject(SessionService);
  const token = session.token();

  if (token === null) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
}
