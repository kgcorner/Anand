import type { IdentityRepository } from '../identity/identity.repository';
import type { HeartbeatResponse } from './heartbeat.types';

/** Use-case contract for the heartbeat probe: is the app in first-run setup, or is it live? */
export interface HeartbeatService {
  check(): Promise<HeartbeatResponse>;
}

/**
 * Factory: builds the heartbeat service. Depends on the identity repository
 * interface only — it never reads credentials, just whether any account exists.
 * The composition root passes the concrete repository.
 */
export function createHeartbeatService(identityRepository: IdentityRepository): HeartbeatService {
  return {
    /** Reports SYSTEM_BOOTSTRAP when no account exists yet, otherwise OK (live data present). */
    async check(): Promise<HeartbeatResponse> {
      const hasAnyUser = await identityRepository.hasAnyUser();
      return { state: hasAnyUser ? 'OK' : 'SYSTEM_BOOTSTRAP' };
    },
  };
}
