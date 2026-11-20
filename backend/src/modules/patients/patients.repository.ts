import type { Patient, PatientDetails } from './patients.model';

/**
 * Patients storage contract (driver-free). Single writer for the patients
 * table. Implementations live in patients/sqlite/repository.ts. Services
 * depend on this interface so tests can substitute an in-memory fake.
 */
export interface PatientsRepository {
  /** Persists a new patient record. Throws on SQLite constraint violation. */
  create(patient: Patient): Promise<void>;
  /** Returns the patient with this id, or null. */
  findById(id: string): Promise<Patient | null>;
  /** All patients owned by this user, newest first. */
  listByOwner(ownerUserId: string): Promise<Patient[]>;
  /** Replaces editable details without changing ownership. Returns false if not found. */
  updateDetails(id: string, details: PatientDetails): Promise<boolean>;
}
