import type { MedicalVisit } from './visits.model';

/**
 * Visits storage contract — single writer for the medical_visits table.
 * The ingestion workflow writes visits; this module owns the table itself.
 */
export interface VisitsRepository {
  /** Persists a new visit record. */
  create(visit: MedicalVisit): Promise<void>;
  /** Returns the visit with this id, or null. */
  findById(id: string): Promise<MedicalVisit | null>;
  /** All visits for the patient, newest first (drives the timeline + snapshot last-3). */
  listByPatient(patientId: string): Promise<MedicalVisit[]>;
}
