import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Open a SQLite connection. Relative paths are resolved from the working directory. */
export function openDatabase(databasePath = process.env.DATABASE_PATH ?? join('data', 'anand.sqlite')): Database.Database {
  if (!databasePath.trim()) {
    throw new Error('DATABASE_PATH must not be empty');
  }

  const filename = databasePath === ':memory:' ? databasePath : resolve(databasePath);
  if (filename !== ':memory:') {
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  }

  const database = new Database(filename);
  try {
    database.pragma('foreign_keys = ON');
    database.pragma('busy_timeout = 5000');
    database.pragma('journal_mode = WAL');
  } catch (error) {
    database.close();
    throw error;
  }
  return database;
}

