import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { MedicalVisit } from '../visits.model';
import type { VisitsRepository } from '../visits.repository';

export class SqliteVisitsRepository extends SqliteRepository<MedicalVisit> implements VisitsRepository {
  constructor(database: Database.Database) {
    super(database, 'medical_visits', [
      'id', 'patient_id', 'visit_date', 'doctor_name', 'specialty', 'clinic_name', 'reason', 'notes', 'document_ids',
    ], ['document_ids']);
  }

  async create(visit: MedicalVisit): Promise<void> {
    this.insert(visit);
  }

  async findById(id: string): Promise<MedicalVisit | null> {
    return this.find('id', id);
  }

  async listByPatient(patientId: string): Promise<MedicalVisit[]> {
    return this.list('patient_id = ?', [patientId], 'visit_date DESC, id');
  }
}
