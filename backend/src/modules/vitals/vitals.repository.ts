import type { VitalMeasurement } from './vitals.model';

/**
 * Vitals storage contract — single writer for the vitals table.
 * Implementations must return patient-scoped, newest-first lists.
 */
export interface VitalsRepository {
  /** Persists one dated measurement row. */
  create(vital: VitalMeasurement): Promise<void>;
  /** Returns the measurement with this id, or null. */
  findById(id: string): Promise<VitalMeasurement | null>;
  /** All measurements for the patient, newest first (drives latest-weight + trends). */
  listByPatient(patientId: string): Promise<VitalMeasurement[]>;
}
