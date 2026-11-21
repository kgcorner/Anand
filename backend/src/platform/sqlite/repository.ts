import type Database from 'better-sqlite3';

/** A string key of T (a model property name usable as a column). */
type Field<T> = Extract<keyof T, string>;
/** A database row as a loosely-typed record; adapters narrow it back to T. */
type Row = Record<string, unknown>;

/**
 * Shared SQLite adapter base. Tables, columns and ordering are fixed by
 * adapters, not user input. Encodes JSON columns to strings on write and
 * parses them back on read so domain models keep typed objects/arrays.
 */
export class SqliteRepository<T extends object> {
  /**
   * @param database - Open SQLite connection (owned by the composition root).
   * @param table - Table name; must match the module's schema file.
   * @param columns - Full column list in stored order; also the INSERT column list.
   * @param jsonColumns - Columns whose values are JSON-encoded (arrays/objects).
   */
  constructor(
    private readonly database: Database.Database,
    private readonly table: string,
    private readonly columns: readonly Field<T>[],
    private readonly jsonColumns: readonly Field<T>[] = [],
  ) {}

  /** Deep-copies the domain object for the driver, JSON-encoding any jsonColumns. */
  private encode(value: object): Row {
    const row: Row = { ...value };
    for (const column of this.jsonColumns) {
      if (column in row && row[column] !== null) {
        row[column] = JSON.stringify(row[column]);
      }
    }
    return row;
  }

  /** Parses JSON columns in a raw driver row back into typed domain values. */
  private decode(row: Row): T {
    for (const column of this.jsonColumns) {
      if (row[column] !== null) row[column] = JSON.parse(row[column] as string) as unknown;
    }
    return row as T;
  }

  /** Inserts one row. Throws on constraint violations (UNIQUE, CHECK, FOREIGN KEY). */
  protected insert(value: T): void {
    const names = this.columns.join(', ');
    const params = this.columns.map((column) => `@${column}`).join(', ');
    this.database.prepare(`INSERT INTO ${this.table} (${names}) VALUES (${params})`).run(this.encode(value));
  }

  /** Finds the first row where `field` equals `value`, or null. The field name comes from the adapter, never from user input. */
  protected find(field: Field<T>, value: string): T | null {
    const row = this.database.prepare(`SELECT ${this.columns.join(', ')} FROM ${this.table} WHERE ${field} = ?`).get(value) as Row | undefined;
    return row ? this.decode(row) : null;
  }

  /** Lists rows matching a WHERE clause, ordered by `order`. Both come from the adapter, never from user input. */
  protected list(where: string, values: readonly string[], order: string): T[] {
    const rows = this.database.prepare(`SELECT ${this.columns.join(', ')} FROM ${this.table} WHERE ${where} ORDER BY ${order}`).all(...values) as Row[];
    return rows.map((row) => this.decode(row));
  }

  /** Updates the listed columns of the row with `id`. Returns true when a row was changed. */
  protected update(id: string, value: Partial<T>, fields: readonly Field<T>[]): boolean {
    const assignments = fields.map((column) => `${column} = @${column}`).join(', ');
    const result = this.database.prepare(`UPDATE ${this.table} SET ${assignments} WHERE id = @id`).run({ ...this.encode(value), id });
    return result.changes > 0;
  }

  /** Total number of rows in the table. Used by the bootstrap probe to detect first-run state. */
  protected count(): number {
    const row = this.database.prepare(`SELECT COUNT(*) AS total FROM ${this.table}`).get() as { total: number } | undefined;
    return row?.total ?? 0;
  }
}
