import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { UserAccount } from '../identity.model';
import type { IdentityRepository } from '../identity.repository';

/**
 * SQLite implementation of IdentityRepository.
 * Maps the UserAccount model onto the users table (1:1 snake_case columns).
 * The generic SqliteRepository handles encoding; domain rules live in the service.
 */
export class SqliteIdentityRepository extends SqliteRepository<UserAccount> implements IdentityRepository {
  /** Binds to the `users` table with its fixed column list. */
  constructor(database: Database.Database) {
    super(database, 'users', ['id', 'username', 'password_hash']);
  }

  /** Inserts the account row. Throws on duplicate id/username. */
  async create(account: UserAccount): Promise<void> {
    this.insert(account);
  }

  /** Finds the account by primary key, or null. */
  async findById(id: string): Promise<UserAccount | null> {
    return this.find('id', id);
  }

  /** Finds the account by unique username, or null. */
  async findByUsername(username: string): Promise<UserAccount | null> {
    return this.find('username', username);
  }

  /** Total number of accounts (0 = first-run setup pending). */
  async countUsers(): Promise<number> {
    return this.count();
  }

  /** True when at least one account exists. */
  async hasAnyUser(): Promise<boolean> {
    return (await this.countUsers()) > 0;
  }
}
