export const patientsSchemaV1 = `
  CREATE TABLE patients (
    id TEXT NOT NULL PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    gender TEXT NOT NULL,
    blood_group TEXT,
    allergies TEXT NOT NULL CHECK (json_type(allergies) = 'array'),
    chronic_conditions TEXT NOT NULL CHECK (json_type(chronic_conditions) = 'array'),
    past_surgeries TEXT NOT NULL CHECK (json_type(past_surgeries) = 'array'),
    created_at TEXT NOT NULL
  ) STRICT;

  CREATE INDEX patients_by_owner ON patients (owner_user_id, created_at DESC, id);
`;
