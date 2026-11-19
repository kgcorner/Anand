import type { MedicalVisit } from './visits.model';

export interface VisitsRepository {
  create(visit: MedicalVisit): Promise<void>;
  findById(id: string): Promise<MedicalVisit | null>;
  listByPatient(patientId: string): Promise<MedicalVisit[]>;
}

