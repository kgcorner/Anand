import type { LabResult, LabResultInterpretation } from './lab-results.model';

/**
 * Lab-results storage contract — single writer for the lab_results table.
 * Reads power snapshot, dashboard trendlines and organ-map aggregation.
 * History queries are patient-scoped; test history is the trendline source.
 */
export interface LabResultsRepository {
  /** Persists a confirmed lab result (status/severity already computed by rules). */
  create(result: LabResult): Promise<void>;
  /** Returns the result with this id, or null. */
  findById(id: string): Promise<LabResult | null>;
  /** All results for the patient, newest sample first. */
  listByPatient(patientId: string): Promise<LabResult[]>;
  /** All results for one catalog test, newest first — the trendline query. */
  listByTest(patientId: string, testId: string): Promise<LabResult[]>;
  /** For mapping/corrections after deterministic rules have been applied. */
  updateInterpretation(id: string, interpretation: LabResultInterpretation): Promise<boolean>;
}
