import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { VitalMeasurement } from '../vitals.model';
import type { VitalsRepository } from '../vitals.repository';

export class SqliteVitalsRepository extends SqliteRepository<VitalMeasurement> implements VitalsRepository {
  constructor(database: Database.Database) {
    super(database, 'vitals', ['id', 'patient_id', 'type', 'value', 'unit', 'measured_at']);
  }

  async create(vital: VitalMeasurement): Promise<void> {
    this.insert(vital);
  }

  async findById(id: string): Promise<VitalMeasurement | null> {
    return this.find('id', id);
  }

  async listByPatient(patientId: string): Promise<VitalMeasurement[]> {
    return this.list('patient_id = ?', [patientId], 'measured_at DESC, id');
  }
}
