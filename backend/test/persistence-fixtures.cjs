const { openDatabase } = require('../dist/platform/database.js');
const { migrateSqlite } = require('../dist/platform/sqlite/migrations.js');
const { SqliteIdentityRepository } = require('../dist/modules/identity/sqlite/repository.js');
const { SqlitePatientsRepository } = require('../dist/modules/patients/sqlite/repository.js');
const { SqliteVitalsRepository } = require('../dist/modules/vitals/sqlite/repository.js');
const { SqliteVisitsRepository } = require('../dist/modules/visits/sqlite/repository.js');
const { SqliteMedicationsRepository } = require('../dist/modules/medications/sqlite/repository.js');
const { SqliteDocumentsRepository } = require('../dist/modules/documents/sqlite/repository.js');
const { SqliteLabResultsRepository } = require('../dist/modules/lab-results/sqlite/repository.js');

const account = { id: 'user-1', username: 'someone', password_hash: 'test-hash' };
const patient = {
  id: 'patient-1', owner_user_id: account.id, name: 'Name', date_of_birth: '1987-05-10', gender: 'Male',
  blood_group: null,
  allergies: [{ substance: 'Penicillin', reaction: 'Rash', severity: 'MODERATE', recorded_at: '2026-01-01T00:00:00.000Z' }],
  chronic_conditions: [{ name: 'Hypertension', diagnosed_on: '2022-03-01', status: 'ACTIVE' }],
  past_surgeries: [{ procedure: 'Appendectomy', date: '2015-08-12', hospital: 'Hospital' }],
  created_at: '2026-01-01T00:00:00.000Z',
};
const document = {
  id: 'doc-1', patient_id: patient.id, file_name: 'report.pdf', file_type: 'LAB_REPORT',
  storage_path: 'encrypted/report', uploaded_at: '2026-11-02T00:00:00.000Z',
  processing_status: 'UPLOADED', extraction: null,
};
const visit = {
  id: 'visit-1', patient_id: patient.id, visit_date: '2026-11-02', doctor_name: 'Doctor',
  specialty: null, clinic_name: null, reason: 'Routine', notes: null, document_ids: [document.id],
};
const medication = {
  id: 'med-1', patient_id: patient.id, visit_id: visit.id, medicine_name: 'Atorvastatin',
  generic_name: null, drug_code: null, dosage: '10mg', frequency: 'daily',
  start_date: '2026-11-02', end_date: null, status: 'ACTIVE', entry_source: 'MANUAL',
};
const lab = {
  id: 'lab-1', patient_id: patient.id, document_id: document.id, visit_id: visit.id, test_id: 'HBA1C',
  raw_test_name: 'HbA1c', raw_value: '7.2', raw_unit: '%', value: 7.2, unit: '%',
  reference_range: { low: 4, high: 5.6, source: 'REPORT' }, status: 'HIGH', severity: 'SIGNIFICANT',
  sample_date: '2026-10-28', lab_name: null,
};
const vital = {
  id: 'vital-1', patient_id: patient.id, type: 'WEIGHT', value: 75, unit: 'kg', measured_at: '2026-11-02',
};

async function seed(t) {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  migrateSqlite(db);
  const repos = {
    users: new SqliteIdentityRepository(db),
    patients: new SqlitePatientsRepository(db),
    vitals: new SqliteVitalsRepository(db),
    visits: new SqliteVisitsRepository(db),
    medications: new SqliteMedicationsRepository(db),
    documents: new SqliteDocumentsRepository(db),
    labs: new SqliteLabResultsRepository(db),
  };
  await repos.users.create(account);
  await repos.patients.create(patient);
  await repos.documents.create(document);
  await repos.visits.create(visit);
  await repos.vitals.create(vital);
  await repos.medications.create(medication);
  await repos.labs.create(lab);
  return { db, ...repos };
}

module.exports = { seed, account, patient, document, visit, medication, lab, vital };
