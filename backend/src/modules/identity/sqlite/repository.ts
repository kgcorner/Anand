import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { UserAccount } from '../identity.model';
import type { IdentityRepository } from '../identity.repository';

export class SqliteIdentityRepository extends SqliteRepository<UserAccount> implements IdentityRepository {
  constructor(database: Database.Database) {
    super(database, 'users', ['id', 'username', 'password_hash']);
  }

  async create(account: UserAccount): Promise<void> {
    this.insert(account);
  }

  async findById(id: string): Promise<UserAccount | null> {
    return this.find('id', id);
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    return this.find('username', username);
  }
}
