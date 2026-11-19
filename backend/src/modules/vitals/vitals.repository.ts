import type { VitalMeasurement } from './vitals.model';

export interface VitalsRepository {
  create(vital: VitalMeasurement): Promise<void>;
  findById(id: string): Promise<VitalMeasurement | null>;
  listByPatient(patientId: string): Promise<VitalMeasurement[]>;
}

