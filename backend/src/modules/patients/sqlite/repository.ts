import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { Patient, PatientDetails } from '../patients.model';
import type { PatientsRepository } from '../patients.repository';

/** Editable columns only — owner_user_id, id and created_at are never updated here. */
const detailColumns = [
  'name', 'date_of_birth', 'gender', 'blood_group', 'allergies', 'chronic_conditions', 'past_surgeries',
] as const satisfies readonly (keyof PatientDetails)[];

/**
 * SQLite implementation of PatientsRepository. Maps the Patient model onto
 * the patients table; allergies/conditions/surgeries are JSON-encoded via
 * the shared SqliteRepository helper.
 */
export class SqlitePatientsRepository extends SqliteRepository<Patient> implements PatientsRepository {
  /** Binds to the `patients` table with its fixed column list. */
  constructor(database: Database.Database) {
    super(database, 'patients', ['id', 'owner_user_id', ...detailColumns, 'created_at'], [
      'allergies', 'chronic_conditions', 'past_surgeries',
    ]);
  }

  /** Inserts a new patient row. Throws on foreign-key or NOT NULL violations. */
  async create(patient: Patient): Promise<void> {
    this.insert(patient);
  }

  /** Finds a patient by primary key, or null. */
  async findById(id: string): Promise<Patient | null> {
    return this.find('id', id);
  }

  /** All profiles owned by one user, newest first (drives the family-profile list). */
  async listByOwner(ownerUserId: string): Promise<Patient[]> {
    return this.list('owner_user_id = ?', [ownerUserId], 'created_at DESC, id');
  }

  /** Replaces editable details. Returns true when the row existed and was updated. */
  async updateDetails(id: string, details: PatientDetails): Promise<boolean> {
    return this.update(id, details, detailColumns);
  }
}
