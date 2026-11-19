export const medicationsSchemaV1 = `
  CREATE TABLE medications (
    id TEXT NOT NULL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    visit_id TEXT,
    medicine_name TEXT NOT NULL,
    generic_name TEXT,
    drug_code TEXT,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'STOPPED')),
    entry_source TEXT NOT NULL CHECK (entry_source IN ('MANUAL', 'OCR_CONFIRMED')),
    FOREIGN KEY (patient_id, visit_id) REFERENCES medical_visits (patient_id, id)
  ) STRICT;

  CREATE INDEX medications_by_patient ON medications (patient_id, start_date DESC, id);
`;
