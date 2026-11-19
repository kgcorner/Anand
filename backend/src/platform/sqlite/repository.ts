import type Database from 'better-sqlite3';

type Field<T> = Extract<keyof T, string>;
type Row = Record<string, unknown>;

/** Internal SQLite helper. Tables, columns and ordering are fixed by adapters, not user input. */
export class SqliteRepository<T extends object> {
  constructor(
    private readonly database: Database.Database,
    private readonly table: string,
    private readonly columns: readonly Field<T>[],
    private readonly jsonColumns: readonly Field<T>[] = [],
  ) {}

  private encode(value: object): Row {
    const row: Row = { ...value };
    for (const column of this.jsonColumns) {
      if (column in row && row[column] !== null) {
        row[column] = JSON.stringify(row[column]);
      }
    }
    return row;
  }

  private decode(row: Row): T {
    for (const column of this.jsonColumns) {
      if (row[column] !== null) row[column] = JSON.parse(row[column] as string) as unknown;
    }
    return row as T;
  }

  protected insert(value: T): void {
    const names = this.columns.join(', ');
    const params = this.columns.map((column) => `@${column}`).join(', ');
    this.database.prepare(`INSERT INTO ${this.table} (${names}) VALUES (${params})`).run(this.encode(value));
  }

  protected find(field: Field<T>, value: string): T | null {
    const row = this.database.prepare(`SELECT ${this.columns.join(', ')} FROM ${this.table} WHERE ${field} = ?`).get(value) as Row | undefined;
    return row ? this.decode(row) : null;
  }

  protected list(where: string, values: readonly string[], order: string): T[] {
    const rows = this.database.prepare(`SELECT ${this.columns.join(', ')} FROM ${this.table} WHERE ${where} ORDER BY ${order}`).all(...values) as Row[];
    return rows.map((row) => this.decode(row));
  }

  protected update(id: string, value: Partial<T>, fields: readonly Field<T>[]): boolean {
    const assignments = fields.map((column) => `${column} = @${column}`).join(', ');
    const result = this.database.prepare(`UPDATE ${this.table} SET ${assignments} WHERE id = @id`).run({ ...this.encode(value), id });
    return result.changes > 0;
  }
}
