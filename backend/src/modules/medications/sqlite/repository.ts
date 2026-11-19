import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { Medication, MedicationDetails } from '../medications.model';
import type { MedicationsRepository } from '../medications.repository';

const detailColumns = [
  'visit_id', 'medicine_name', 'generic_name', 'drug_code', 'dosage', 'frequency', 'start_date', 'end_date', 'status',
] as const satisfies readonly (keyof MedicationDetails)[];

export class SqliteMedicationsRepository extends SqliteRepository<Medication> implements MedicationsRepository {
  constructor(database: Database.Database) {
    super(database, 'medications', ['id', 'patient_id', ...detailColumns, 'entry_source']);
  }

  async create(medication: Medication): Promise<void> {
    this.insert(medication);
  }

  async findById(id: string): Promise<Medication | null> {
    return this.find('id', id);
  }

  async listByPatient(patientId: string): Promise<Medication[]> {
    return this.list('patient_id = ?', [patientId], 'start_date DESC, id');
  }

  async updateDetails(id: string, details: MedicationDetails): Promise<boolean> {
    return this.update(id, details, detailColumns);
  }
}
