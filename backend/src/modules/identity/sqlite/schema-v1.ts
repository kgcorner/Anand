/**
 * Schema v1 for the users table (identity). Append-only: never edit once deployed;
 * add schema-v2.ts and register it in platform/sqlite/migrations.ts instead.
 */
export const identitySchemaV1 = `
  CREATE TABLE users (
    id TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  ) STRICT;
`;
