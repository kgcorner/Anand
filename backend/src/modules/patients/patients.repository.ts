import type { Patient, PatientDetails } from './patients.model';

export interface PatientsRepository {
  create(patient: Patient): Promise<void>;
  findById(id: string): Promise<Patient | null>;
  listByOwner(ownerUserId: string): Promise<Patient[]>;
  /** Replaces editable details without changing ownership. Returns false if not found. */
  updateDetails(id: string, details: PatientDetails): Promise<boolean>;
}

