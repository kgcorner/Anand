const assert = require('node:assert/strict');
const { test } = require('node:test');
const { seed, account, patient, document, visit, medication, lab, vital } = require('./persistence-fixtures.cjs');

test('SQLite repositories round-trip their owned data and list records by owner or patient', async (t) => {
  const r = await seed(t);
  assert.deepEqual(await r.users.findByUsername(account.username), account);
  assert.deepEqual(await r.users.findById(account.id), account);
  assert.equal(await r.users.findById('missing'), null);
  assert.deepEqual(await r.patients.findById(patient.id), patient);
  assert.deepEqual(await r.patients.listByOwner(account.id), [patient]);
  assert.deepEqual(await r.patients.listByOwner('other'), []);

  for (const [repo, record] of [
    [r.vitals, vital], [r.visits, visit], [r.medications, medication], [r.documents, document], [r.labs, lab],
  ]) {
    assert.deepEqual(await repo.findById(record.id), record);
    assert.equal(await repo.findById('missing'), null);
    assert.deepEqual(await repo.listByPatient(patient.id), [record]);
    assert.deepEqual(await repo.listByPatient('other'), []);
  }
});

test('owner adapters replace only editable fields and round-trip nested updates', async (t) => {
  const r = await seed(t);
  const editedPatient = { ...patient, name: 'Updated', allergies: [] };
  assert.equal(await r.patients.updateDetails(patient.id, { ...editedPatient, owner_user_id: 'other' }), true);
  assert.deepEqual(await r.patients.findById(patient.id), editedPatient);
  assert.equal(await r.patients.updateDetails('missing', editedPatient), false);

  const stopped = { ...medication, status: 'STOPPED', end_date: '2026-11-03' };
  assert.equal(await r.medications.updateDetails(medication.id, { ...stopped, entry_source: 'OCR_CONFIRMED' }), true);
  assert.deepEqual(await r.medications.findById(medication.id), stopped);
  assert.equal(await r.medications.updateDetails('missing', stopped), false);

  const extraction = { document_type: 'LAB_REPORT', lab_rows: [{ test_name: 'HbA1c', value: '7.2' }] };
  const processing = { processing_status: 'PENDING_REVIEW', extraction };
  assert.equal(await r.documents.updateProcessing(document.id, processing), true);
  assert.deepEqual(await r.documents.findById(document.id), { ...document, ...processing });
  assert.equal(await r.documents.updateProcessing('missing', processing), false);
});

test('lab history is patient-scoped, ordered by sample date, and supports unmatched and qualitative results', async (t) => {
  const r = await seed(t);
  const earlier = { ...lab, id: 'lab-older', test_id: null, sample_date: '2026-09-28' };
  const qualitative = {
    ...lab, id: 'lab-text', test_id: null, visit_id: null, raw_value: 'Positive', raw_unit: null,
    value: null, unit: null, reference_range: null, status: 'UNKNOWN', severity: null,
  };
  await r.labs.create(earlier);
  await r.labs.create(qualitative);
  assert.deepEqual(await r.labs.findById(qualitative.id), qualitative);
  assert.deepEqual(await r.labs.listByTest(patient.id, 'HBA1C'), [lab]);
  const interpretation = {
    test_id: 'HBA1C', value: 7.2, unit: '%', reference_range: { low: null, high: 5.6, source: 'REPORT' },
    status: 'HIGH', severity: 'SIGNIFICANT',
  };
  assert.equal(await r.labs.updateInterpretation(earlier.id, interpretation), true);
  assert.equal(await r.labs.updateInterpretation('missing', interpretation), false);
  assert.deepEqual(await r.labs.listByTest(patient.id, 'HBA1C'), [lab, { ...earlier, ...interpretation }]);
  assert.deepEqual(await r.labs.listByTest('other', 'HBA1C'), []);
});
