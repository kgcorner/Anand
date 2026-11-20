import type { UserAccount } from './identity.model';

/**
 * Identity storage contract — the only door to the users table.
 * password_hash never leaves this domain (F8): no other module imports
 * this interface or the users table. Implementations live in
 * identity/sqlite/repository.ts.
 */
export interface IdentityRepository {
  /** Persists a new account. Throws SQLITE_CONSTRAINT_UNIQUE on duplicate username. */
  create(account: UserAccount): Promise<void>;
  /** Returns the account with this id, or null. */
  findById(id: string): Promise<UserAccount | null>;
  /** Returns the account with this login handle, or null. */
  findByUsername(username: string): Promise<UserAccount | null>;
}
