/**
 * Heartbeat module public API — the only entry point other modules may import.
 * A single public probe that reports first-run vs live state so the client
 * knows whether to show the account-setup page.
 */
export { createHeartbeatService, type HeartbeatService } from './heartbeat.service';
export { createHeartbeatRouter, type HeartbeatRouterDeps } from './heartbeat.routes';
export type { HeartbeatResponse, HeartbeatState } from './heartbeat.types';
