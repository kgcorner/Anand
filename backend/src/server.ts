import { createApp } from './app';
import { openDatabase } from './platform/database';
import { migrateSqlite } from './platform/sqlite/migrations';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

const database = openDatabase();
try {
  migrateSqlite(database);
} catch (error) {
  database.close();
  throw error;
}
const app = createApp();

const server = app.listen(PORT, HOST);
server.once('listening', () => {
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : PORT;
  console.log(`Anand backend listening on port ${port} (host ${HOST})`);
});

server.on('error', (error: Error) => {
  console.error('Server error:', error);
  database.close();
  process.exitCode = 1;
});

let shuttingDown = false;
function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down...`);
  server.close((error) => {
    try {
      database.close();
    } catch (closeError) {
      console.error('Failed to close database:', closeError);
      process.exitCode = 1;
    }
    if (error) {
      console.error('Failed to close server:', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
