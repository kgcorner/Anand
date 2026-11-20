import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { VitalMeasurement } from '../vitals.model';
import type { VitalsRepository } from '../vitals.repository';

/** SQLite implementation of VitalsRepository, bound to the `vitals` table. */
export class SqliteVitalsRepository extends SqliteRepository<VitalMeasurement> implements VitalsRepository {
  /** Binds to the `vitals` table with its fixed column list. */
  constructor(database: Database.Database) {
    super(database, 'vitals', ['id', 'patient_id', 'type', 'value', 'unit', 'measured_at']);
  }

  /** Inserts one measurement row. */
  async create(vital: VitalMeasurement): Promise<void> {
    this.insert(vital);
  }

  /** Finds a measurement by primary key, or null. */
  async findById(id: string): Promise<VitalMeasurement | null> {
    return this.find('id', id);
  }

  /** All measurements for a patient, newest first (drives latest-weight + trends). */
  async listByPatient(patientId: string): Promise<VitalMeasurement[]> {
    return this.list('patient_id = ?', [patientId], 'measured_at DESC, id');
  }
}
