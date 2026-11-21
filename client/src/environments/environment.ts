/**
 * Runtime environment. The API base is the only knob the client needs:
 * the backend listens on http://localhost:8080 by default in dev.
 * In production (Docker Compose) the client and API are served same-origin
 * behind a reverse proxy, so '/' (relative) is the correct value there —
 * override via API_BASE_URL at build time if needed.
 */
import { InjectionToken } from '@angular/core';

export interface ApiEnvironment {
  /** Base URL for the REST API, e.g. 'http://localhost:8080/api/v1'. */
  apiBaseUrl: string;
}

export const API_ENVIRONMENT = new InjectionToken<ApiEnvironment>('API_ENVIRONMENT', {
  providedIn: 'root',
  factory: (): ApiEnvironment => ({
    apiBaseUrl: 'http://localhost:8080/api/v1',
  }),
});
