# Architecture Ownership Specification

## Project: Anand (HealthPulse) — V1

| Field | Value |
|---|---|
| Status | Draft for review |
| Source | `SOFTWARE_REQUIREMENT_SPEC.md` (V1) |
| Scope | Domain boundaries, module ownership, collection ownership, dependency rules, endpoint ownership |
| Out of scope | Implementation detail, request/response payload schemas, UI layout |

---

## 1. Purpose

This document assigns every responsibility in the SRS to exactly one owning domain. It also assigns each domain a backend module and a client feature. Use it to decide where new code belongs and which module is allowed to write which data.

If this document and the SRS disagree, the SRS wins and this document must be updated.

Items marked **(Proposed)** are not defined in the SRS. Items marked **(Decision)** are open and listed in section 10.

---

## 2. Ownership Principles

1. **Single writer.** Each persisted record type has exactly one owning domain. Other domains read through that domain's public service and never write to its storage.
2. **Read models write nothing.** Snapshot, Dashboard and Organ Map only compose data from other domains.
3. **The LLM extracts; code decides** (SRS §1.1). Extraction produces candidate values. Clinical Rules and Lab Results compute status, severity and organ mapping.
4. **Human confirms before save** (SRS §1.1). Extraction never persists clinical data. Records are written only by their owning domain after a user confirm action.
5. **Pure rules.** Clinical Rules performs no I/O, so every status and severity decision is testable in isolation.
6. **One authorization point.** Identity authenticates the caller. Patient Profile checks that the caller owns the patient. Every patient-scoped route calls that check. No other module re-implements it.
7. **Reference data is read-only at runtime.** Curated files change only through reviewed repository commits.
8. **Local by default** (SRS §1.1, §8). LLM Settings controls the provider. A remote provider requires an explicit opt-in.
9. **No circular dependencies.** Module dependencies form a directed acyclic graph (section 7).

---

## 3. Stack and Structure Status

| Layer | SRS requirement | Current scaffold | Status |
|---|---|---|---|
| Backend | Spring Boot 3.x, Java 17+ | Express 5, TypeScript 5.9 | **Conflict (Decision D1)** |
| Frontend | Angular (latest LTS) | Angular 22, standalone, Tailwind CSS 4 | Aligned |
| Icons | Not specified | Heroicons via `@ng-icons` | Added |
| Database | Database-independent persistence contracts | SQLite repositories and versioned schema | SQLite is the first adapter |
| PDF text | Apache PDFBox | Not started | Pending |

Module names in this document are logical. Physical paths are shown for the current TypeScript scaffold:

- Backend: `backend/src/modules/<module>/`
- Client: `client/src/app/features/<feature>/` and `client/src/app/shared/`
- Infrastructure (not a domain, **Proposed**): `backend/src/platform/` for configuration, database connection, encryption primitives, logging and error handling. Platform code may be imported by any module and owns no clinical data.
- Dev showcase (not a domain, **Proposed**): `client/src/app/features/dev/` holds developer-only showcase pages such as the design-spec catalog at `/dev/components`. It is not linked from navigation, owns no data, and must not be imported by any domain feature.

If Decision D1 selects Spring Boot, the same boundaries apply and become Java packages.

---

## 4. Domain Catalog

Each domain has one purpose, owns the data listed in section 5, and exposes a public service to other domains.

| ID | Domain | Responsibility | Type | Backend module | Client feature |
|---|---|---|---|---|---|
| D-IAM | Identity & Access | Local accounts, password hashing, JWT sessions, authenticated principal | Foundation | `modules/identity` | `features/auth` |
| D-PAT | Patient Profile | Family profiles, demographics, allergies, chronic conditions, past surgeries, ownership check, derived age | Record | `modules/patients` | `features/patients` |
| D-VIT | Vitals | Time-series measurements (weight, height, BP) with a date on every value | Record | `modules/vitals` | `features/patients/vitals` |
| D-VIS | Clinical Visits | Doctor visit log: date, doctor, specialty, clinic, reason, notes, linked documents | Record | `modules/visits` | `features/patients/visits` |
| D-MED | Medications | Manual prescription entry (primary), active vs stopped state, saving confirmed prescription rows | Record | `modules/medications` | `features/patients/medications` |
| D-DOC | Document Management | Upload, encrypted file storage, file metadata, processing status lifecycle | Record | `modules/documents` | `features/documents` |
| D-EXT | Extraction | PDF text extraction, vision-model fallback, LLM adapter, SRS §7 contract, numeric parsing of printed values. Produces suggestions only | Processing | `modules/extraction` | `features/documents/review` (UI only) |
| D-LAB | Lab Results | Catalog matching (alias → fuzzy → unmatched), manual mapping, storing confirmed results, per-test history | Record | `modules/lab-results` | `features/patients/labs` |
| D-REF | Reference Data | Read-only curated catalog, organ systems, drug dictionary, licence and attribution files | Foundation | `modules/reference` | Used via API only |
| D-RUL | Clinical Rules | Pure functions: unit conversion, reference-range precedence, status, severity, stale check | Foundation | `modules/rules` | None (server-side only) |
| D-LLM | LLM Settings | Provider base URL, API key reference, text and vision model IDs, remote-provider opt-in | Foundation **(Decision D4)** | `modules/llm-settings` | `features/settings` |
| D-SNP | Snapshot | Composes the one-page doctor summary and its PDF output. Writes nothing | Read model | `modules/snapshot` | `features/snapshot` |
| D-DSH | Dashboard & Trends | Visit timeline, active vs stopped medications, latest result per test, trendline series. Writes nothing | Read model | `modules/dashboard` | `features/dashboard` |
| D-ORG | Organ Map | Worst latest status per organ from lab results and catalog mapping. Writes nothing | Read model | `modules/organ-map` | `features/organ-map` |
| D-BAK | Backup & Restore | Export of all patient data and original files; restore through each owner's import service | Operations | `modules/backup` | `features/settings` |

**Ingestion workflow (Proposed, orchestration only, not a domain):** owns the upload → extract → review → confirm sequence. It is the only module that calls Document Management, Extraction and the record domains in one flow. It owns no collection. Domain modules never call back into it, which keeps the graph acyclic. Backend path: `modules/ingestion`. Client feature: `features/documents/review`.

**Client-only shared code** (`client/src/app/shared/`): design tokens in `styles.scss`, Heroicons registration helpers, app shell, disclaimer footer. This is not a domain and holds no clinical logic.

---

## 5. Data Ownership

Every stored record type in SRS §4 has exactly one writer. Read access is listed for information only. Any other access goes through the owner's service. Domain models and async repository interfaces are database-independent. SQLite schemas and adapters live in the owning module; the platform migration runner orders them. SQLite foreign keys enforce reference integrity but do not grant domain code access to another module's repository.

| Collection (SRS) | Owner | Other readers | Notes |
|---|---|---|---|
| `users` | D-IAM | None (password hash never leaves D-IAM) | Login accounts. A user manages many patients |
| `patients` | D-PAT | D-VIT, D-VIS, D-MED, D-DOC, D-LAB, D-SNP, D-DSH, D-ORG, D-BAK | Embedded: `allergies`, `chronic_conditions`, `past_surgeries`. Age is derived, never stored |
| `vitals` | D-VIT | D-SNP (latest weight), D-BAK | Time series; each row carries `measured_at` |
| `medical_visits` | D-VIS | D-SNP (last 3), D-DSH (timeline), D-BAK | `document_ids` references D-DOC by id only |
| `medications` | D-MED | D-SNP (active list), D-DSH, D-BAK | `entry_source`: `MANUAL` or `OCR_CONFIRMED`. Written by D-MED on confirm, not by D-EXT |
| `documents` | D-DOC | D-EXT (reads file), D-LAB, D-BAK | D-DOC writes `processing_status` when the ingestion workflow requests the change through its service |
| `lab_results` | D-LAB | D-SNP, D-DSH, D-ORG, D-BAK | One document per test result. `document_id` is a stored reference only; D-LAB never calls D-DOC. `status` and `severity` are computed by D-RUL and stored by D-LAB |
| `llm_settings` **(Decision D4)** | D-LLM | D-EXT | Only if D4 selects a collection. Otherwise configuration |
| `test_catalog`, organ list, drug dictionary | D-REF | D-LAB, D-RUL, D-ORG, D-MED, D-EXT | Files in the repository, loaded at startup. No runtime writes |

**Derived, not stored:** Snapshot, Dashboard and Organ Map results are computed on request. Caching is allowed later, but the cache must be owned by the read model and invalidated by the owning domain's write events.

**Extraction output (Decision D2):** the SRS defines `GET /documents/{id}/extraction` without a home for the data. Until D2 is decided, the working assumption is an `extraction` subdocument owned by D-DOC. D-EXT produces it. D-DOC stores it. Confirmed rows then move to their record domains.

---

## 6. Endpoint Ownership

Each endpoint is served by the module that owns its primary resource. Routes are mounted under `/api/v1`.

| Endpoint (SRS) | Method | Owner | Patient-scoped |
|---|---|---|---|
| `/auth/login` | POST | D-IAM | No |
| `/patients` | POST, GET | D-PAT | No (list is limited to the caller's patients) |
| `/patients/{id}` | GET, PUT | D-PAT | Yes |
| `/patients/{id}/allergies` | Methods not specified in SRS (assumed GET, PUT) | D-PAT | Yes |
| `/patients/{id}/conditions` | Methods not specified in SRS (assumed GET, PUT) | D-PAT | Yes |
| `/patients/{id}/surgeries` | Methods not specified in SRS (assumed GET, PUT) | D-PAT | Yes |
| `/patients/{id}/vitals` **(Proposed)** | GET, POST | D-VIT | Yes |
| `/patients/{id}/visits` **(Proposed)** | GET, POST | D-VIS | Yes |
| `/patients/{id}/medications` **(Proposed)** | GET, POST, PUT | D-MED | Yes |
| `/patients/{id}/documents` | POST | Ingestion workflow (writes via D-DOC) | Yes |
| `/documents/{id}/extraction` | GET | Ingestion workflow | Document's patient |
| `/documents/{id}/confirm` | POST | Ingestion workflow | Document's patient |
| `/patients/{id}/lab-results?test_id=` | GET | D-LAB | Yes |
| `/patients/{id}/snapshot` | GET | D-SNP | Yes |
| `/patients/{id}/snapshot.pdf` | GET | D-SNP (Decision D3) | Yes |
| `/patients/{id}/dashboard` | GET | D-DSH | Yes |
| `/patients/{id}/organ-map` **(Proposed)** | GET | D-ORG | Yes |
| Backup export / restore **(Proposed)** | POST, GET | D-BAK | Export: yes. Restore: the caller's own data |

**Authorization rule:** an endpoint marked "Yes" first checks through D-PAT that the authenticated user owns the patient. A document-scoped endpoint resolves the document's `patient_id` and then applies the same check.

**Proposed endpoints** are not in the SRS. They are listed so each domain has a clear route owner. Confirm them before implementation.

---

## 7. Allowed Dependencies

A module may depend only on the modules listed in its row. Any other import is a violation.

| Module | May depend on |
|---|---|
| `identity` (D-IAM) | None |
| `reference` (D-REF) | None |
| `rules` (D-RUL) | `reference` types only. Receives catalog data as arguments and never loads it |
| `llm-settings` (D-LLM) | None |
| `patients` (D-PAT) | `identity` (principal type only) |
| `vitals` (D-VIT) | `patients` |
| `visits` (D-VIS) | `patients` |
| `medications` (D-MED) | `patients`, `reference` (drug dictionary) |
| `documents` (D-DOC) | `patients` |
| `extraction` (D-EXT) | `documents` (read file), `llm-settings`, `reference` |
| `lab-results` (D-LAB) | `patients`, `reference`, `rules` |
| `snapshot` (D-SNP) | `patients`, `vitals`, `visits`, `medications`, `lab-results`, `reference`, `rules` |
| `dashboard` (D-DSH) | `patients`, `visits`, `medications`, `lab-results`, `reference` |
| `organ-map` (D-ORG) | `patients`, `lab-results`, `reference`, `rules` |
| `backup` (D-BAK) | Every owner module's public export and import service |
| `ingestion` (workflow) | `documents`, `extraction`, `patients`, `lab-results`, `medications`, `visits` (if visit notes are confirmed) |

**Notes**

- `documents` depends on `patients` for the ownership check. `patients` never depends on `documents`.
- `lab-results` stores `document_id` as a plain string reference. It does not depend on `documents`. Ownership of the document is checked by the ingestion workflow before rows are saved.
- `extraction` may read a file through `documents`, but it never writes to `documents`. The ingestion workflow stores the extraction output through `documents`.
- Read models (`snapshot`, `dashboard`, `organ-map`) must not depend on each other.

---

## 8. Forbidden Dependencies

These are the rules a code review must enforce. Each one protects a principle in section 2.

| # | Rule | Reason |
|---|---|---|
| F1 | No module writes to a collection it does not own, directly or through a repository. Writes go through the owner's service. The only cross-domain write path is Backup restore, which calls each owner's import service | Single writer (§2.1) |
| F2 | `extraction` must not depend on `lab-results`, `medications`, `visits` or `patients`, in any direction. Its output is returned as candidate data only | The LLM extracts; extraction never saves (§2.4) |
| F3 | `rules` must not import any module that does I/O (database, filesystem, network, LLM) | Pure rules (§2.5) |
| F4 | No module except `patients` implements an ownership check | One authorization point (§2.6) |
| F5 | Domain modules must not import `ingestion` | Keeps the graph acyclic (§2.9) |
| F6 | Read models must not write to any collection | Read models write nothing (§2.2) |
| F7 | `reference` must not read from any domain collection | Reference data is curated, not derived (§2.7) |
| F8 | No module reads `users.password_hash` except `identity` | Credential isolation |
| F9 | Status, severity or organ mapping must not be produced by `extraction` or accepted from the client | Code decides (§2.3) |
| F10 | Read models must not compute status or severity themselves. They read the stored `status` and `severity` from `lab-results`, or call `rules` for a pure calculation, and never re-implement the thresholds | One implementation of the rules |

---

## 9. Traceability: SRS to Owner

Every functional area in the SRS has one owning domain.

| SRS section | Requirement | Owner |
|---|---|---|
| §1.1 LLM extracts; code decides | Extraction boundary | D-EXT, D-RUL |
| §1.1 Human confirms before save | Confirm gate | Ingestion workflow → D-LAB / D-MED / D-DOC |
| §1.1 Local by default | Provider opt-in and warning | D-LLM (settings), D-EXT (enforcement) |
| §3.1 Test catalog | Catalog data | D-REF |
| §3.2 Organ systems | Organ list | D-REF |
| §3.3 Drug dictionary | Autocomplete | D-REF (data), D-MED (endpoint) |
| §3.4 Licensing and attribution | LOINC and MedlinePlus attribution | D-REF |
| §4.A `patients` | Profile and age | D-PAT |
| §4.B `vitals` | Dated measurements | D-VIT |
| §4.C `medical_visits` | Visit log | D-VIS |
| §4.D `medications` | Active and stopped list | D-MED |
| §4.E `lab_results` | Per-test results | D-LAB |
| §4.F `documents` | File metadata, status | D-DOC |
| §4.G `users` | Login accounts | D-IAM |
| §5 Flow 1 Auth and profiles | Login, family profiles | D-IAM, D-PAT |
| §5 Flow 2 Upload and extraction | Upload, extract, review, confirm | D-DOC, D-EXT, D-LAB, ingestion workflow |
| §5 Flow 3 Prescription entry | Manual entry, optional vision read | D-MED, D-EXT (vision read only) |
| §5 Flow 4 Snapshot | One-page summary and PDF | D-SNP |
| §5 Flow 5 Dashboard and trends | Timeline, medications, trendlines | D-DSH |
| §5 Flow 6 Organ map | Organ colour and drill-down | D-ORG |
| §6 Status and severity | Deterministic rules | D-RUL (rules), D-LAB (storage) |
| §7 LLM contract and parsing | Raw extraction and numeric parsing | D-EXT (parsing into typed values) |
| §8 Privacy | Local default, remote warning | D-LLM, D-EXT |
| §8 Security | Authentication, encryption at rest | D-IAM (auth), D-DOC (encrypted storage) |
| §8 Configurable LLM | Base URL, key, models | D-LLM |
| §8 Backup | Export and restore | D-BAK |
| §8 Testing fixtures | Regression reports | Not a runtime domain. Lives with D-EXT tests |
| §9 Out of scope | V2+ items | Not assigned |

---

## 10. Open Decisions

Each decision blocks a specific module. Until it is resolved, the working assumption shown is the one used in this document.

| ID | Decision | Options | Working assumption | Blocks |
|---|---|---|---|---|
| D1 | Backend stack | (a) Spring Boot 3 / Java 17+ as in SRS. (b) Express 5 / TypeScript as currently scaffolded | (b), the scaffold as built | Every backend module path; §3 |
| D2 | Where extraction output is stored | (a) `extraction` subdocument on `documents`. (b) Separate `extractions` collection | (a) | D-EXT, D-DOC, ingestion workflow |
| D3 | Snapshot PDF rendering | (a) Server-rendered PDF. (b) Client print to PDF using the `styles.scss` print rules | Undecided. Endpoint owner is D-SNP either way | `/snapshot.pdf`; D-SNP |
| D4 | `llm_settings` storage | (a) Own collection, D-LLM owner. (b) Application configuration file or environment | (b) for V1 | D-LLM, §5 |
| D5 | Proposed endpoints (§6, marked Proposed) | Accept, rename or remove each | Accept as listed | Route implementation |
| D6 | Organ mapping medical review (SRS §3.4) | Required before V1 release | Release gate, not an implementation block. D-REF tracks the review status | Release, not development |

---

## 11. Change Control

- Changing an owner in §4 or §5 requires updating §7, §8 and §9 in the same change.
- Adding a new collection requires an entry in §5 with a single owner before any code writes to it.
- Adding a new cross-domain dependency requires an entry in §7. If the change would break a rule in §8, the rule must be revisited explicitly rather than silently overridden.
- Resolving a decision in §10 moves it to the affected sections and removes its row.
