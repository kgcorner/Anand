import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { MedicalVisit } from '../visits.model';
import type { VisitsRepository } from '../visits.repository';

/** SQLite implementation of VisitsRepository, bound to the `medical_visits` table. */
export class SqliteVisitsRepository extends SqliteRepository<MedicalVisit> implements VisitsRepository {
  /** Binds to `medical_visits`; document_ids is JSON-encoded. */
  constructor(database: Database.Database) {
    super(database, 'medical_visits', [
      'id', 'patient_id', 'visit_date', 'doctor_name', 'specialty', 'clinic_name', 'reason', 'notes', 'document_ids',
    ], ['document_ids']);
  }

  /** Inserts one visit row. */
  async create(visit: MedicalVisit): Promise<void> {
    this.insert(visit);
  }

  /** Finds a visit by primary key, or null. */
  async findById(id: string): Promise<MedicalVisit | null> {
    return this.find('id', id);
  }

  /** All visits for a patient, newest first (drives the timeline + snapshot last-3). */
  async listByPatient(patientId: string): Promise<MedicalVisit[]> {
    return this.list('patient_id = ?', [patientId], 'visit_date DESC, id');
  }
}
