const assert = require('node:assert/strict');
const { test } = require('node:test');
const { openDatabase } = require('../dist/platform/database.js');
const { migrateSqlite } = require('../dist/platform/sqlite/migrations.js');
const { seed, account, document, lab, medication, patient, vital } = require('./persistence-fixtures.cjs');

test('migration is versioned, idempotent and rejects newer databases', (t) => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  migrateSqlite(db);
  migrateSqlite(db);
  assert.equal(db.pragma('user_version', { simple: true }), 1);
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name").all();
  assert.deepEqual(tables.map(({ name }) => name), [
    'documents', 'lab_results', 'medical_visits', 'medications', 'patients', 'users', 'vitals',
  ]);
  db.pragma('user_version = 99');
  assert.throws(() => migrateSqlite(db), /Unsupported SQLite schema version/);
  assert.equal(db.pragma('user_version', { simple: true }), 99);
});

test('migration rolls back partial DDL on failure', (t) => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  db.exec('CREATE TABLE patients (id TEXT)');
  assert.throws(() => migrateSqlite(db), /already exists/);
  assert.equal(db.pragma('user_version', { simple: true }), 0);
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all();
  assert.deepEqual(tables, [{ name: 'patients' }]);
});

test('SQLite enforces account uniqueness and rejects cross-patient links', async (t) => {
  const r = await seed(t);
  const foreignKey = { code: 'SQLITE_CONSTRAINT_FOREIGNKEY' };
  await assert.rejects(r.users.create({ ...account, id: 'second-user' }), { code: 'SQLITE_CONSTRAINT_UNIQUE' });
  await assert.rejects(r.patients.create({ ...patient, id: 'orphan', owner_user_id: 'missing' }), foreignKey);
  await assert.rejects(r.vitals.create({ ...vital, id: 'orphan', patient_id: 'missing' }), foreignKey);

  const otherPatientId = 'second-patient';
  await r.patients.create({ ...patient, id: otherPatientId });
  await assert.rejects(r.medications.create({ ...medication, id: 'wrong-visit', patient_id: otherPatientId }), foreignKey);
  await assert.rejects(r.labs.create({ ...lab, id: 'wrong-document', patient_id: otherPatientId, visit_id: null }), foreignKey);
  const otherDocumentId = 'second-document';
  await r.documents.create({ ...document, id: otherDocumentId, patient_id: otherPatientId });
  await assert.rejects(
    r.labs.create({ ...lab, id: 'wrong-visit', patient_id: otherPatientId, document_id: otherDocumentId }),
    foreignKey,
  );
  await r.medications.create({ ...medication, id: 'standalone', patient_id: otherPatientId, visit_id: null });
  assert.deepEqual(r.db.pragma('foreign_key_check'), []);
});

test('SQLite rejects invalid persisted states and reference ranges', async (t) => {
  const r = await seed(t);
  const invalid = { code: 'SQLITE_CONSTRAINT_CHECK' };
  await assert.rejects(r.documents.updateProcessing(document.id, { processing_status: 'INVALID', extraction: null }), invalid);
  await assert.rejects(r.labs.create({ ...lab, id: 'bad-severity', severity: null }), invalid);
  await assert.rejects(r.labs.create({ ...lab, id: 'missing-range', reference_range: null }), invalid);
  await assert.rejects(r.labs.create({ ...lab, id: 'empty-range', reference_range: {} }), invalid);
  await assert.rejects(
    r.labs.create({ ...lab, id: 'swapped-range', reference_range: { low: 9, high: 5, source: 'CATALOG' } }),
    invalid,
  );
});
