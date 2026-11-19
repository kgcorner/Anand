import type { DocumentProcessing, PatientDocument } from './documents.model';

export interface DocumentsRepository {
  create(document: PatientDocument): Promise<void>;
  findById(id: string): Promise<PatientDocument | null>;
  listByPatient(patientId: string): Promise<PatientDocument[]>;
  /** Stores extraction candidates and processing status, not confirmed clinical records. */
  updateProcessing(id: string, processing: DocumentProcessing): Promise<boolean>;
}

