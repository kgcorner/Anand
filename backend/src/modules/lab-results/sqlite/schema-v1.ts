/**
 * Schema v1 for the lab_results table. The CHECKs encode SRS §6 invariants directly in
 * SQLite: severity is non-null iff status is HIGH/LOW, and non-UNKNOWN requires both a
 * value and a range. Composite FKs prevent cross-patient document/visit links.
 * Append-only: never edit once deployed.
 */
export const labResultsSchemaV1 = `
  CREATE TABLE lab_results (
    id TEXT NOT NULL PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    document_id TEXT NOT NULL,
    visit_id TEXT,
    test_id TEXT,
    raw_test_name TEXT NOT NULL,
    raw_value TEXT NOT NULL,
    raw_unit TEXT,
    value REAL,
    unit TEXT,
    reference_range TEXT CHECK (
      reference_range IS NULL OR (
        json_type(reference_range) = 'object'
        AND json_extract(reference_range, '$.source') IN ('REPORT', 'CATALOG')
        AND json_type(reference_range, '$.low') IN ('integer', 'real', 'null')
        AND json_type(reference_range, '$.high') IN ('integer', 'real', 'null')
        AND (
          json_extract(reference_range, '$.low') IS NOT NULL
          OR json_extract(reference_range, '$.high') IS NOT NULL
        )
        AND coalesce(json_extract(reference_range, '$.low') <= json_extract(reference_range, '$.high'), 1)
      ) IS TRUE
    ),
    status TEXT NOT NULL CHECK (status IN ('NORMAL', 'HIGH', 'LOW', 'UNKNOWN')),
    severity TEXT CHECK (severity IN ('BORDERLINE', 'SIGNIFICANT')),
    sample_date TEXT NOT NULL,
    lab_name TEXT,
    CHECK ((status IN ('HIGH', 'LOW')) = (severity IS NOT NULL)),
    CHECK (status = 'UNKNOWN' OR (reference_range IS NOT NULL AND value IS NOT NULL)),
    FOREIGN KEY (patient_id, document_id) REFERENCES documents (patient_id, id),
    FOREIGN KEY (patient_id, visit_id) REFERENCES medical_visits (patient_id, id)
  ) STRICT;

  CREATE INDEX lab_results_by_patient ON lab_results (patient_id, sample_date DESC, id);
  CREATE INDEX lab_results_by_test ON lab_results (patient_id, test_id, sample_date DESC, id);
`;
