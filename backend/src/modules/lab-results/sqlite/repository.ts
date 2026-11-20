import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { LabResult, LabResultInterpretation } from '../lab-results.model';
import type { LabResultsRepository } from '../lab-results.repository';

/** Columns that carry the rules-derived interpretation (re-issued on correction). */
const interpretationColumns = [
  'test_id', 'value', 'unit', 'reference_range', 'status', 'severity',
] as const satisfies readonly (keyof LabResultInterpretation)[];

/** SQLite implementation of LabResultsRepository, bound to the `lab_results` table. */
export class SqliteLabResultsRepository extends SqliteRepository<LabResult> implements LabResultsRepository {
  /** Binds to `lab_results`; reference_range is JSON-encoded. */
  constructor(database: Database.Database) {
    super(database, 'lab_results', [
      'id', 'patient_id', 'document_id', 'visit_id', 'raw_test_name', 'raw_value', 'raw_unit', 'sample_date', 'lab_name',
      ...interpretationColumns,
    ], ['reference_range']);
  }

  /** Inserts a confirmed result (status/severity already computed by rules). */
  async create(result: LabResult): Promise<void> {
    this.insert(result);
  }

  /** Finds a result by primary key, or null. */
  async findById(id: string): Promise<LabResult | null> {
    return this.find('id', id);
  }

  /** All results for a patient, newest sample first (snapshot + dashboard source). */
  async listByPatient(patientId: string): Promise<LabResult[]> {
    return this.list('patient_id = ?', [patientId], 'sample_date DESC, id');
  }

  /** All results for one catalog test, newest first — the trendline query. */
  async listByTest(patientId: string, testId: string): Promise<LabResult[]> {
    return this.list('patient_id = ? AND test_id = ?', [patientId, testId], 'sample_date DESC, id');
  }

  /** Replaces only the interpreted fields after a mapping/correction. Returns true when the row existed. */
  async updateInterpretation(id: string, interpretation: LabResultInterpretation): Promise<boolean> {
    return this.update(id, interpretation, interpretationColumns);
  }
}
