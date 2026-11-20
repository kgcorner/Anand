/**
 * Clinical Rules domain types — the pure, deterministic interpretation
 * vocabulary (SRS §6). These types are consumed by rules/, lab-results,
 * snapshot/dashboard/organ-map. No I/O, no LLM: given a value + range,
 * status and severity are computed here and only here (F3, F9).
 */

/** Deterministic outcome of comparing a value to its reference range. UNKNOWN = no range or unparsable. */
export type LabStatus = 'NORMAL' | 'HIGH' | 'LOW' | 'UNKNOWN';

/** How far outside the range the value sits: within margin (BORDERLINE) or beyond (SIGNIFICANT). */
export type LabSeverity = 'BORDERLINE' | 'SIGNIFICANT';

/**
 * A reference range with its provenance. source=REPORT means the lab printed
 * it (preferred); source=CATALOG is the curated fallback. A known range has
 * at least one bound; null indicates an open end.
 */
export type ReferenceRange = { source: 'REPORT' | 'CATALOG' } & (
  | { low: number; high: number | null }
  | { low: null; high: number }
);
