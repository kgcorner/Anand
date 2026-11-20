import type Database from 'better-sqlite3';
import { documentsSchemaV1 } from '../../modules/documents/sqlite/schema-v1';
import { identitySchemaV1 } from '../../modules/identity/sqlite/schema-v1';
import { labResultsSchemaV1 } from '../../modules/lab-results/sqlite/schema-v1';
import { medicationsSchemaV1 } from '../../modules/medications/sqlite/schema-v1';
import { patientsSchemaV1 } from '../../modules/patients/sqlite/schema-v1';
import { visitsSchemaV1 } from '../../modules/visits/sqlite/schema-v1';
import { vitalsSchemaV1 } from '../../modules/vitals/sqlite/schema-v1';

// Append a new version rather than changing SQL for a deployed version.
const migrations = [
  [identitySchemaV1, patientsSchemaV1, vitalsSchemaV1, visitsSchemaV1, medicationsSchemaV1, documentsSchemaV1, labResultsSchemaV1],
];

/**
 * Runs all pending schema migrations in one transaction per version.
 * The user's PRAGMA user_version tracks the applied version; newer-than-known
 * databases are rejected rather than silently accepted. A failure rolls back
 * the whole version, so a partial DDL patch can never leave the schema half-applied.
 */
export function migrateSqlite(database: Database.Database): void {
  database.transaction(() => {
    const current = database.pragma('user_version', { simple: true });
    if (typeof current !== 'number' || current < 0 || current > migrations.length) {
      throw new Error(`Unsupported SQLite schema version: ${String(current)}`);
    }

    for (let i = current; i < migrations.length; i++) {
      for (const sql of migrations[i]) database.exec(sql);
      database.pragma(`user_version = ${i + 1}`);
    }
  }).immediate();
}
