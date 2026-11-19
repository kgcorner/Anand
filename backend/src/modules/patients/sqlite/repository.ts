import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { Patient, PatientDetails } from '../patients.model';
import type { PatientsRepository } from '../patients.repository';

const detailColumns = [
  'name', 'date_of_birth', 'gender', 'blood_group', 'allergies', 'chronic_conditions', 'past_surgeries',
] as const satisfies readonly (keyof PatientDetails)[];

export class SqlitePatientsRepository extends SqliteRepository<Patient> implements PatientsRepository {
  constructor(database: Database.Database) {
    super(database, 'patients', ['id', 'owner_user_id', ...detailColumns, 'created_at'], [
      'allergies', 'chronic_conditions', 'past_surgeries',
    ]);
  }

  async create(patient: Patient): Promise<void> {
    this.insert(patient);
  }

  async findById(id: string): Promise<Patient | null> {
    return this.find('id', id);
  }

  async listByOwner(ownerUserId: string): Promise<Patient[]> {
    return this.list('owner_user_id = ?', [ownerUserId], 'created_at DESC, id');
  }

  async updateDetails(id: string, details: PatientDetails): Promise<boolean> {
    return this.update(id, details, detailColumns);
  }
}
