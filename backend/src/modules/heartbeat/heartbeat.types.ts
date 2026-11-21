/**
 * Heartbeat wire DTOs. This is the contract the client reads on every app
 * boot (and on each heartbeat poll): SYSTEM_BOOTSTRAP means "no account
 * exists — show the account-setup page", OK means "has data / session valid
 * — proceed normally". The router maps the service result to 200/204/401.
 */

/** The kind of system state the heartbeat reports. */
export type HeartbeatState = 'SYSTEM_BOOTSTRAP' | 'OK';

/** Body returned with 200 when the heartbeat reports a state the client must act on. */
export interface HeartbeatResponse {
  state: HeartbeatState;
}
