import type { Medication, MedicationDetails } from './medications.model';

/**
 * Medications storage contract — single writer for the medications table.
 * The ingestion workflow writes confirmed prescription rows through this
 * contract; extraction never writes here directly (F2).
 */
export interface MedicationsRepository {
  /** Persists a new medication course. */
  create(medication: Medication): Promise<void>;
  /** Returns the medication with this id, or null. */
  findById(id: string): Promise<Medication | null>;
  /** All courses for the patient, most recently started first. */
  listByPatient(patientId: string): Promise<Medication[]>;
  /** Replaces editable details; patient and entry source do not change. */
  updateDetails(id: string, details: MedicationDetails): Promise<boolean>;
}
