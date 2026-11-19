import type Database from 'better-sqlite3';
import { SqliteRepository } from '../../../platform/sqlite/repository';
import type { LabResult, LabResultInterpretation } from '../lab-results.model';
import type { LabResultsRepository } from '../lab-results.repository';

const interpretationColumns = [
  'test_id', 'value', 'unit', 'reference_range', 'status', 'severity',
] as const satisfies readonly (keyof LabResultInterpretation)[];

export class SqliteLabResultsRepository extends SqliteRepository<LabResult> implements LabResultsRepository {
  constructor(database: Database.Database) {
    super(database, 'lab_results', [
      'id', 'patient_id', 'document_id', 'visit_id', 'raw_test_name', 'raw_value', 'raw_unit', 'sample_date', 'lab_name',
      ...interpretationColumns,
    ], ['reference_range']);
  }

  async create(result: LabResult): Promise<void> {
    this.insert(result);
  }

  async findById(id: string): Promise<LabResult | null> {
    return this.find('id', id);
  }

  async listByPatient(patientId: string): Promise<LabResult[]> {
    return this.list('patient_id = ?', [patientId], 'sample_date DESC, id');
  }

  async listByTest(patientId: string, testId: string): Promise<LabResult[]> {
    return this.list('patient_id = ? AND test_id = ?', [patientId, testId], 'sample_date DESC, id');
  }

  async updateInterpretation(id: string, interpretation: LabResultInterpretation): Promise<boolean> {
    return this.update(id, interpretation, interpretationColumns);
  }
}
