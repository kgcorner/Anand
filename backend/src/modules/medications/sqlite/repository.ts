import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { Medication, MedicationDetails } from '../medications.model';
import type { MedicationsRepository } from '../medications.repository';

/** Editable columns only — entry_source and patient_id never change after creation. */
const detailColumns = [
  'visit_id', 'medicine_name', 'generic_name', 'drug_code', 'dosage', 'frequency', 'start_date', 'end_date', 'status',
] as const satisfies readonly (keyof MedicationDetails)[];

/** SQLite implementation of MedicationsRepository, bound to the `medications` table. */
export class SqliteMedicationsRepository extends SqliteRepository<Medication> implements MedicationsRepository {
  /** Binds to the `medications` table with its fixed column list. */
  constructor(database: Database.Database) {
    super(database, 'medications', ['id', 'patient_id', ...detailColumns, 'entry_source']);
  }

  /** Inserts a new medication course. */
  async create(medication: Medication): Promise<void> {
    this.insert(medication);
  }

  /** Finds a medication by primary key, or null. */
  async findById(id: string): Promise<Medication | null> {
    return this.find('id', id);
  }

  /** All courses for a patient, most recently started first (snapshot + dashboard source). */
  async listByPatient(patientId: string): Promise<Medication[]> {
    return this.list('patient_id = ?', [patientId], 'start_date DESC, id');
  }

  /** Replaces editable details. Returns true when the row existed and was updated. */
  async updateDetails(id: string, details: MedicationDetails): Promise<boolean> {
    return this.update(id, details, detailColumns);
  }
}
