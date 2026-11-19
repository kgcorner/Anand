import type { Medication, MedicationDetails } from './medications.model';

export interface MedicationsRepository {
  create(medication: Medication): Promise<void>;
  findById(id: string): Promise<Medication | null>;
  listByPatient(patientId: string): Promise<Medication[]>;
  /** Replaces editable details; patient and entry source do not change. */
  updateDetails(id: string, details: MedicationDetails): Promise<boolean>;
}

