/**
 * Schema v1 for the documents table. CHECKs pin file_type and processing_status to the
 * SRS vocabulary; extraction is a JSON object or NULL. Composite UNIQUE supports the
 * (patient_id, document_id) FK from lab_results. Append-only: never edit once deployed.
 */
export const documentsSchemaV1 = `
  CREATE TABLE documents (
    id TEXT NOT NULL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('LAB_REPORT', 'PRESCRIPTION', 'VISIT_NOTE', 'OTHER')),
    storage_path TEXT NOT NULL,
    processing_status TEXT NOT NULL CHECK (processing_status IN ('UPLOADED', 'EXTRACTING', 'PENDING_REVIEW', 'CONFIRMED', 'FAILED')),
    uploaded_at TEXT NOT NULL,
    extraction TEXT CHECK (extraction IS NULL OR json_type(extraction) = 'object'),
    UNIQUE (patient_id, id)
  ) STRICT;

  CREATE INDEX documents_by_patient ON documents (patient_id, uploaded_at DESC, id);
`;
