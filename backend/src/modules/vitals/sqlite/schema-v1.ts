export const vitalsSchemaV1 = `
  CREATE TABLE vitals (
    id TEXT NOT NULL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    measured_at TEXT NOT NULL
  ) STRICT;

  CREATE INDEX vitals_by_patient ON vitals (patient_id, measured_at DESC, id);
`;
