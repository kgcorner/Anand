export const visitsSchemaV1 = `
  CREATE TABLE medical_visits (
    id TEXT NOT NULL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    visit_date TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT,
    clinic_name TEXT,
    reason TEXT,
    notes TEXT,
    document_ids TEXT NOT NULL CHECK (json_type(document_ids) = 'array'),
    UNIQUE (patient_id, id)
  ) STRICT;

  CREATE INDEX visits_by_patient ON medical_visits (patient_id, visit_date DESC, id);
`;
