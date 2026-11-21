/**
 * Composition root — the process entry point. Builds the database, runs
 * migrations, constructs every collaborator in dependency order, and starts
 * listening. Nothing else in the codebase calls `new` on a service; wiring
 * happens here so the module DAG is visible in one place.
 */
import { createApp } from './app';
import { readConfig } from './platform/config';
import { openDatabase } from './platform/database';
import { createLogger } from './platform/logger';
import { migrateSqlite } from './platform/sqlite/migrations';
import {
  createIdentityService,
  createScryptPasswordHasher,
  createSessionTokenService,
  SqliteIdentityRepository,
} from './modules/identity';
import { createHeartbeatService } from './modules/heartbeat';

const config = readConfig();
const logger = createLogger('server');

const database = openDatabase(config.databasePath);
try {
  migrateSqlite(database);
} catch (error) {
  logger.error('Database migration failed', error);
  database.close();
  throw error;
}

const identityRepository = new SqliteIdentityRepository(database);
const passwordHasher = createScryptPasswordHasher();
const sessionTokens = createSessionTokenService(config.sessionSecret, config.sessionTtlSeconds);
const identityService = createIdentityService(identityRepository, passwordHasher, sessionTokens);
const heartbeatService = createHeartbeatService(identityRepository);

const app = createApp({ identityService, sessionTokens, heartbeatService }, config.corsOrigins);

const server = app.listen(config.port, config.host);
server.once('listening', () => {
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : config.port;
  logger.info(`Anand backend listening on port ${port} (host ${config.host})`);
});

server.on('error', (error: Error) => {
  logger.error('Server error', error);
  database.close();
  process.exitCode = 1;
});

let shuttingDown = false;
/** Graceful shutdown: stop accepting connections, close the database, exit. Idempotent. */
function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal}, shutting down...`);
  server.close((error) => {
    try {
      database.close();
    } catch (closeError) {
      logger.error('Failed to close database', closeError);
      process.exitCode = 1;
    }
    if (error) {
      logger.error('Failed to close server', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
