import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { DocumentProcessing, PatientDocument } from '../documents.model';
import type { DocumentsRepository } from '../documents.repository';

const processingColumns = ['processing_status', 'extraction'] as const satisfies readonly (keyof DocumentProcessing)[];

export class SqliteDocumentsRepository extends SqliteRepository<PatientDocument> implements DocumentsRepository {
  constructor(database: Database.Database) {
    super(database, 'documents', [
      'id', 'patient_id', 'file_name', 'file_type', 'storage_path', 'uploaded_at', ...processingColumns,
    ], ['extraction']);
  }

  async create(document: PatientDocument): Promise<void> {
    this.insert(document);
  }

  async findById(id: string): Promise<PatientDocument | null> {
    return this.find('id', id);
  }

  async listByPatient(patientId: string): Promise<PatientDocument[]> {
    return this.list('patient_id = ?', [patientId], 'uploaded_at DESC, id');
  }

  async updateProcessing(id: string, processing: DocumentProcessing): Promise<boolean> {
    return this.update(id, processing, processingColumns);
  }
}
