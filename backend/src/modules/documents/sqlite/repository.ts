import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { DocumentProcessing, PatientDocument } from '../documents.model';
import type { DocumentsRepository } from '../documents.repository';

/** Mutable columns only — identity, file metadata and timestamps never change after creation. */
const processingColumns = ['processing_status', 'extraction'] as const satisfies readonly (keyof DocumentProcessing)[];

/** SQLite implementation of DocumentsRepository, bound to the `documents` table. */
export class SqliteDocumentsRepository extends SqliteRepository<PatientDocument> implements DocumentsRepository {
  /** Binds to `documents`; extraction is JSON-encoded. */
  constructor(database: Database.Database) {
    super(database, 'documents', [
      'id', 'patient_id', 'file_name', 'file_type', 'storage_path', 'uploaded_at', ...processingColumns,
    ], ['extraction']);
  }

  /** Inserts a new document row (status UPLOADED, extraction null). */
  async create(document: PatientDocument): Promise<void> {
    this.insert(document);
  }

  /** Finds a document by primary key, or null. */
  async findById(id: string): Promise<PatientDocument | null> {
    return this.find('id', id);
  }

  /** All documents for a patient, newest upload first. */
  async listByPatient(patientId: string): Promise<PatientDocument[]> {
    return this.list('patient_id = ?', [patientId], 'uploaded_at DESC, id');
  }

  /** Stores the latest status + extraction draft. Returns true when the row existed. */
  async updateProcessing(id: string, processing: DocumentProcessing): Promise<boolean> {
    return this.update(id, processing, processingColumns);
  }
}
