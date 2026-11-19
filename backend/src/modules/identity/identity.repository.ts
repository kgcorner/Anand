import type { UserAccount } from './identity.model';

/** Identity-only credential store; password_hash never leaves this domain. */
export interface IdentityRepository {
  create(account: UserAccount): Promise<void>;
  findById(id: string): Promise<UserAccount | null>;
  findByUsername(username: string): Promise<UserAccount | null>;
}

