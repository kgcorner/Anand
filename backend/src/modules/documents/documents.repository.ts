import type { DocumentProcessing, PatientDocument } from './documents.model';

/**
 * Documents storage contract — single writer for the documents table.
 * Phase/status transitions go through updateProcessing; confirmed clinical
 * rows are written by their owning modules, never here (F1).
 */
export interface DocumentsRepository {
  /** Persists a new document record (status UPLOADED, extraction null). */
  create(document: PatientDocument): Promise<void>;
  /** Returns the document with this id, or null. */
  findById(id: string): Promise<PatientDocument | null>;
  /** All documents for the patient, newest upload first. */
  listByPatient(patientId: string): Promise<PatientDocument[]>;
  /** Stores extraction candidates and processing status, not confirmed clinical records. */
  updateProcessing(id: string, processing: DocumentProcessing): Promise<boolean>;
}
