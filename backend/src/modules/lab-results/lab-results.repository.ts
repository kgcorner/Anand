import type { LabResult, LabResultInterpretation } from './lab-results.model';

export interface LabResultsRepository {
  create(result: LabResult): Promise<void>;
  findById(id: string): Promise<LabResult | null>;
  listByPatient(patientId: string): Promise<LabResult[]>;
  listByTest(patientId: string, testId: string): Promise<LabResult[]>;
  /** For mapping/corrections after deterministic rules have been applied. */
  updateInterpretation(id: string, interpretation: LabResultInterpretation): Promise<boolean>;
}

