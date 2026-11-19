export type LabStatus = 'NORMAL' | 'HIGH' | 'LOW' | 'UNKNOWN';
export type LabSeverity = 'BORDERLINE' | 'SIGNIFICANT';

/** A known range has at least one bound; null indicates an open end. */
export type ReferenceRange = { source: 'REPORT' | 'CATALOG' } & (
  | { low: number; high: number | null }
  | { low: null; high: number }
);

