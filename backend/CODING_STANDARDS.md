# Anand Backend — Coding Standards

**Stack:** Node.js 20+ · TypeScript 5.9 (`strict: true`) · Express 5 · `better-sqlite3`
**Applies to:** `backend/src/`. Normative language: **MUST** = required, **SHOULD** = strongly recommended, **MAY** = allowed.
**Companions:** `SOFTWARE_REQUIREMENT_SPEC.md` (product), `ARCHITECTURE_OWNERSHIP_SPEC.md` (domain boundaries, dependencies F1–F10).
If this doc and the ownership spec disagree on module boundaries, the ownership spec wins; if they disagree on product rules, the SRS wins.

**DI model in one paragraph:** this codebase uses **manual constructor dependency injection** — no framework, no decorators, no container. `server.ts` (the composition root) builds everything in dependency order and passes collaborators down through constructors. A service never does `new OtherModuleService(...)` itself; it receives an already-built instance. The exception is pure functions (`rules/`, parsers) which have no collaborators. Full wiring rules are in §4.1; the four decisions you must get right before writing code are: what you inject (interfaces, not classes), when you wire (composition root only), how you name the params, and how you test (fake at the interface seam).

---

## 0. Design patterns — the short version

TypeScript is host-language neutral: it supports the same structural patterns as Java/Python, just without ceremony. This codebase uses a deliberately small set. You do not need to learn 23 GoF patterns — you need these eight, and when each one applies.

| Pattern (brief) | What it solves | Where Anand uses it |
|---|---|---|
| **Module / Layered** | Keep concerns in separate boxes with clear doors | Every domain is a module under `src/modules/<module>/`; `routes/` → `service/` → `repository/`. This is the primary architecture, not an afterthought. |
| **Repository** | Domain talks to storage through an interface; SQL lives elsewhere | `patients.repository.ts` declares `PatientsRepository`; `patients/sqlite/repository.ts` implements it over `better-sqlite3`. Services never import a DB driver (F1). |
| **Dependency Injection (manual, constructor)** | Explicit wiring: a component declares what it needs; the composition root provides it | `server.ts` builds `SqlitePatientsRepository` → `PatientsService` → `VitalsService(patientsService)` and passes instances in. There is **no DI framework** — plain `new` + constructor params (§4.1). |
| **Service / Use-case** | Business rules live in one place an endpoint can call | `patients.service.ts` owns create/update/list rules. Routes parse HTTP, services decide, repositories persist. |
| **DTO + Domain Model separation** | Wire shape ≠ stored shape | `patients.model.ts` = stored domain objects; `patients.types.ts` = request/response DTOs. Routes map between them. |
| **Strategy** | Swap behaviour behind one interface | `password-hasher.ts` (bcrypt/argon2), `llm-client.ts` (Ollama vs OpenAI-compatible), `document-storage.ts`. Implement the interface, pick the impl in config. |
| **Factory** | Build objects without exposing `new`/config details | `createApp()` in `app.ts`, `openDatabase()` in `platform/database.ts`. Tests call factories with `:memory:` DBs and stub deps. |
| **Middleware / Chain of Responsibility** | Cross-cutting concerns (auth, errors, logging) wrap each route | `identity.middleware.ts` attaches the authenticated principal; `platform/error-handler.ts` converts thrown errors to JSON. |
| **Pure Function module (Functional Core)** | Rules testable without I/O | `rules/` (`status.ts`, `severity.ts`, `unit-conversion.ts`) — pure functions, no DB/files/network (F3). Read models (`snapshot`, `dashboard`, `organ-map`) are also pure composition of owner data. |

**Patterns deliberately NOT used (and why):**
- Singleton / static service locator — every shared thing is constructed in `server.ts` and passed in. Singletons hide dependencies and make tests order-dependent.
- DI frameworks (e.g. NestJS-style decorators, tsyringe, Inversify) — out of scope for a 16-module, framework-light Express app. Constructor injection gives you the same testability with zero magic and zero runtime cost; a container would add indirection without buying simplification at this size. Revisit only if the module count grows past ~40 or lifecycle hooks (request-scoped beans) become necessary.
- Active Record / ORM magic — SQL must stay visible in `sqlite/` adapters; you'll never hunt for where a query was generated.
- Inheritance hierarchies for business logic — prefer composition + small interfaces (Strategy). One class per concept, not a tree of `BaseService<T>`.
- Event-bus / pub-sub for internal flows — ingestion is a plain orchestrated call chain (`documents` → `extraction` → `lab-results`), which keeps the DAG acyclic (F5).
- Decorators for magic (ORM entities etc.) — behaviour must be readable without metaprogramming.

**Rule of thumb:** if you cannot explain the pattern in one sentence and point to the file it lives in, don't introduce it. Propose it in the ownership spec first.

---

## 1. Project layout

```
backend/src/
├── server.ts               # Entry: open DB, migrate, listen, graceful shutdown. No business logic.
├── app.ts                  # createApp(): middleware + router mount + 404 + error handler.
├── routes/                 # Aggregator ONLY — contains no route handlers of its own.
│   ├── index.ts            # Imports each module router and mounts it under /api/v1
│   └── health.routes.ts    # Only non-domain router. Domain routers live with their module (§4.1).
├── platform/               # Cross-cutting, owns no clinical data. Importable by any module.
│   ├── database.ts config.ts logger.ts encryption.ts errors.ts error-handler.ts
│   └── sqlite/             # Migration runner + shared SQLite helpers
└── modules/<module>/       # One folder per domain (see §7 for the dependency DAG)
    ├── *.model.ts          # Stored domain objects (no I/O, no framework)
    ├── *.repository.ts     # Async repository interface (no driver import)
    ├── *.types.ts          # Wire DTOs + public contract types (no I/O)
    ├── *.service.ts        # Business logic (pure-ish; depends on interfaces)
    ├── *.routes.ts         # Express router (parses HTTP, calls service, maps DTOs)
    ├── *.middleware.ts     # (identity only) auth principal attachment
    ├── index.ts            # Public API: the ONLY entry point other modules may import
    └── sqlite/             # SQLite schema + adapter (the only place that touches SQL)
        ├── schema-vX.ts    # Versioned DDL strings (append-only, never edit deployed)
        └── repository.ts   # Repository implementation over better-sqlite3
```

- A module **MUST NOT** import another module's `sqlite/` folder, `*.routes.ts`, or anything except that module's `index.ts`.
- `server.ts` is the composition root: it constructs repositories, services and routers **in dependency order** and wires them. Domain code never constructs its own collaborators with `new ConcreteX()`.
- `app.ts` builds middleware in this order: `express.json()` → domain routers → 404 → central error handler. Health check needs no auth; everything else does (see §8).
- `routes/index.ts` is a pure aggregator: it imports each module's router and mounts it. It contains **zero** route handlers and zero business logic. Adding a new module = add one import + one `use()` line here.

---

## 2. Naming — the heart of this document

### 2.1 Case rules (TypeScript/Node)

| Element | Case | Examples |
|---|---|---|
| Files & folders | `kebab-case.ts` | `patients.service.ts`, `test-catalog.loader.ts`, `lab-results/` |
| Classes, interfaces, types, enums | `PascalCase` | `Patient`, `PatientsRepository`, `LabResultStatus`, `ExtractionCandidate` |
| Variables, function params, properties | `camelCase` | `ownerUserId`, `measuredAt`, `bloodGroup` |
| Functions, methods | `camelCase` | `listByOwner`, `findById`, `updateDetails`, `createPatient` |
| Module constants (true constants) | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_BYTES`, `BORDERLINE_MARGIN_PCT_DEFAULT`, `API_PREFIX` |
| Database columns & JSON fields | `snake_case` | `owner_user_id`, `date_of_birth`, `measured_at`, `reference_range` |
| API path segments | `kebab-case` | `/api/v1/lab-results`, `/api/v1/patients/{id}/snapshot.pdf` |
| Environment variables | `UPPER_SNAKE_CASE` | `DATABASE_PATH`, `LlmBaseUrl` is **wrong** — use `LLM_BASE_URL` |

> **The one deliberate seam:** wire/storage is `snake_case`, TypeScript is `camelCase`. Mapping between them happens **once**, in the module's adapter/route mapper — never ad-hoc in a service. See §2.5 for how.

### 2.2 Class naming

- **One class per file** (exception: tiny closely-related value classes MAY share a file if the file name matches the main export — default is one per file).
- Class name **MUST** match the file name: file `patients.repository.ts` exports `PatientsRepository`; file `test-catalog.loader.ts` exports `TestCatalogLoader` (or a `createTestCatalogLoader` factory — see below).
- Suffixes carry meaning — use them exactly:
  - `*Repository` — storage interface/implementation (e.g. `PatientsRepository`, `SqlitePatientsRepository`)
  - `*Service` — use-case orchestration, no I/O primitives (e.g. `PatientsService`, `SnapshotService`, `IngestionService`)
  - `*Loader` — reads curated file data into memory at startup (e.g. `TestCatalogLoader`, `DrugDictionaryLoader`)
  - `*Parser` — text → typed values, no storage (e.g. `ValueParser`, `RangeTextParser`)
  - `*Matcher` — candidate → catalog entry (e.g. `TestMatcher`, `FuzzyMatcher`)
  - `*Composer` / `*Builder` — assembles a read model from others (e.g. `SnapshotComposer`, `TimelineBuilder`, `TrendlineBuilder`, `OrganAggregator`)
  - `*Renderer` — produces a final artefact (e.g. `SnapshotPdfRenderer`)
  - `*Client` — talks to an external system (e.g. `LlmClient`)
  - `*Storage` — file/blob persistence (e.g. `DocumentStorage`)
  - `*Hasher` — one-way transforms (e.g. `PasswordHasher`)
  - `*Guard` — policy decisions that throw/deny (e.g. `RemoteProviderGuard`)
- **No `Manager`, no `Helper`, no `Util`, no `Processor`, no `Base*`** in names. If you reach for one, the class is doing two things — split it.
- **No `I` prefix** on interfaces (`Repository`, not `IRepository`). No `Impl` suffix. No `Abstract*` naming — make the abstraction an interface with one implementation.
- A class **MUST NOT** be named after a database table, a route, or a UI concept. `Patient` (domain) is fine; `PatientsTable` and `PatientPage` are not.

### 2.3 Method naming

- **Commands/queries read as verbs in domain terms**, never HTTP verbs or SQL verbs:
  - ✅ `create`, `createPatient`, `findById`, `listByOwner`, `listVitals`, `updateDetails`, `confirmRows`, `deriveAge`
  - ❌ `insertIntoPatientsTable`, `executeQuery`, `doGet`, `selectAll`
- **Getter/setter prefixes are banned.** `getName()`, `setAge()` → expose a property (`patient.name`) or a plain function (`ageOf(patient)`). Express routes already say GET/POST; methods don't repeat them.
- **Boolean methods are questions** that read as predicates: `isOwner(principal, patient)`, `isStale(result, now)`, `hasData`, `ownsPatient` — and return `boolean`, never a truthy object.
- **Factory methods:** `createX`, `buildX`, `fromX`, `openX`, `loadX`. Only the composition root and factories use `new`; everything else receives collaborators via constructor.
- **Async:** every method that does I/O (repository, LLM client, file storage) is `async` and returns a Promise. Pure rules are synchronous and documented as such (see `rules/`). Never mix: an `async` function that never awaits, or a synchronous function that does I/O.
- **Error verbs:** `assert*` throws on violation (`assertOwnership`), `require*` returns-or-throws (`requirePatient` → non-null or 404).
- **Never** use `data`, `info`, `stuff`, `thing`, `tmp`, `x`, `foo` as identifiers. Numbers get unit-aware names: `staleAfterDays`, not `staleAfter`.

### 2.4 Variable & property naming

- **camelCase variables**, **PascalCase types**, **UPPER_SNAKE_CASE only for module-level constants** that never change at runtime. If it's configurable, it's config — read it from `platform/config.ts`, never hardcode.
- **No mutation of parameters.** Transform into a new value.
- **Domain language over generic language.** `patient` not `entity`; `measuredAt` not `date`; `bloodGroup` not `bg`.
- **Unions over booleans for state.** `status: 'ACTIVE' | 'STOPPED'`, `processingStatus: 'UPLOADED' | 'EXTRACTING' | ...` — never `isActive: boolean` paired with `isStopped: boolean`.
- **Specific collection nouns:** `patients: Patient[]`, `allergiesInRange`, `outOfRangeResults`. Plural for collections, singular for elements.
- **Loop variables:** `patient`, `result`, `row` — full word, not `p`, `r`, `i` (except `i` in a tiny numeric index loop).
- **Type imports:** `import type { Patient }` for types, regular import only when you need the runtime value. Enforced by `verbatimModuleSyntax`-style discipline (keep `esModuleInterop` usage consistent with the scaffold).

### 2.5 The `snake_case` ↔ `camelCase` seam

This is the most common source of drift. One rule prevents it:

- **Domain model (`*.model.ts`):** these are the stored shapes. Scaffold convention uses `snake_case` fields (`owner_user_id`, `date_of_birth`) because they map 1:1 onto SQLite columns and JSON columns, letting the generic `SqliteRepository<T>` encode/decode without a hand-written mapper per module.
- **TypeScript-facing code (services, routes, DTOs):** `camelCase` (`ownerUserId`, `dateOfBirth`). The mapper lives in exactly one place — the `sqlite/repository.ts` adapter for stored models, or the `*.routes.ts` mapper for wire DTOs.
- **Rule:** a `snake_case` identifier MUST NOT appear in `*.service.ts`, `*.routes.ts` (except the mapper block at the top/bottom), or `*.types.ts`. If you catch yourself reading `patient.owner_user_id` inside a service, the boundary has leaked — move the mapper.

Example — adapter only:

```ts
// sqlite/repository.ts — the ONLY place this conversion exists
import type { Patient } from '../patients.model';
import type { PatientRow } from './patient-row.mapper'; // internal

function toDomain(row: PatientRow): Patient {
  return { ...row, owner_user_id: row.owner_user_id }; // model keeps snake_case by design
}
```

### 2.6 Enums & literal unions

- **Literal unions over enums** for wire/storage vocabularies — they serialize to JSON natively and match the SRS exactly:
  ```ts
  export type ResultStatus = 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';
  export type ResultSeverity = 'BORDERLINE' | 'SIGNIFICANT';
  export type MedicationStatus = 'ACTIVE' | 'STOPPED';
  export type DocumentProcessingStatus = 'UPLOADED' | 'EXTRACTING' | 'PENDING_REVIEW' | 'CONFIRMED' | 'FAILED';
  ```
- `const` objects + union types (`as const`) MAY be used when runtime iteration over members is needed. Numeric enums MUST NOT be used.
- Union members are `UPPER_SNAKE_CASE` exactly as in SRS §4/§5.

### 2.7 Dates & numbers

- **Dates as strings:** `YYYY-MM-DD` for calendar dates (`date_of_birth`, `sample_date`, `visit_date`); **ISO 8601 UTC with milliseconds** for timestamps (`created_at`, `uploaded_at`). Never `Date` objects in models, DTOs, or storage — parse/validate at the boundary, compare as strings (lexicographic = chronological for these formats), format at the boundary.
- **Age is derived, never stored** (SRS §4A). Use `patient-age.ts` helpers.
- **Money/ranges:** reference ranges are `{ low: number | null; high: number | null }`, never `"-"` strings, never `[0, 0]` for missing.
- **Units:** canonical catalog unit in models; raw unit preserved (`raw_unit`, `raw_value`). Conversion happens in `rules/unit-conversion.ts` (pure) — never in SQL, never in routes.

---

## 3. TypeScript language rules (beyond naming)

1. **`strict: true` is law** (`tsconfig.json`). No `any` without a comment justifying why and a tracking issue. Prefer `unknown` at JSON boundaries.
2. **No nullable soup.** `string | null` means "absent" (a column value); `undefined` means "not provided" (an optional argument). Do not interchange them — `exactOptionalPropertyTypes`-minded style: mark optionals `?:` and treat omission distinctly from explicit `null`.
3. **No non-null assertion `!`.** Narrow with guards (`if (!patient) throw new NotFoundError(...)`, `assertOwnership(...)`).
4. **Explicit return types** on every exported function/method. Inference is allowed only for local non-exported helpers.
5. **Interfaces for contracts** (`*.repository.ts`, `*.types.ts`), **classes only when they own behaviour** (services, adapters, clients). Data-only shapes are `interface` or `type` — never a class with public mutable props.
6. **`readonly` for anything a function receives.** Properties of models are `readonly` unless mutation is the explicit point of a repository method.
7. **Small functions, one level of abstraction.** If a function needs a comment to explain *what*, extract it. If a function exceeds ~40 lines or nests beyond 2 levels, split it.
8. **No `console.log` in domain code.** Use `platform/logger.ts`. (Scaffold `app.ts` still logs — treat that as tech debt, not a pattern.)
9. **Errors are typed.** Throw `NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError` from `platform/errors.ts`; `platform/error-handler.ts` maps them to status + JSON. Never throw a raw `Error` for an expected case, never return error sentinels.
10. **Async all the way down** the I/O path (repositories, clients, storage). Fire-and-forget background work doesn't exist in V1 — everything is request-scoped.

---

## 4. Express / HTTP conventions

### 4.0 Routes live in the module — `routes/index.ts` only aggregates

Every module owns its routes. The pattern is:

```
modules/patients/patients.routes.ts   → export function createPatientsRouter(deps): Router
modules/patients/index.ts             → re-export createPatientsRouter (+ types)
routes/index.ts                       → import { createPatientsRouter } from '../modules/patients';
                                        apiRouter.use('/patients', createPatientsRouter({ patientsService, ... }));
```

Rules:
1. **Each module has exactly one `*.routes.ts`** (name it after the module: `patients.routes.ts`, `lab-results.routes.ts`, `identity.routes.ts`, `ingestion.routes.ts`...). It exports a **factory function** `create<Module>Router(deps)` returning an Express `Router` — *not* a module-level singleton `Router` instance. Factories are what let tests build an isolated app with fakes, and what let `server.ts` wire real services (§4.1).
2. **`routes/index.ts` is an aggregator only.** It imports each module's router factory (via the module's `index.ts`), instantiates the router with its deps, and `use()`s it under `/api/v1/<resource>`. It MUST NOT declare `router.get(...)`, handlers, or validation logic of its own. (Exception: `health.routes.ts` in `routes/` — health has no module, so it stays here.)
3. **One resource, one mount point.** The mount prefix is a decision made in exactly one place (`routes/index.ts`). A module MUST NOT hardcode its own mount path. The router file declares *relative* routes only (`'/'`, `'/:id'`, `'/:id/allergies'`).
4. **Modular parallelism:** resequencing or renaming one module's routes touches only (a) that module's `*.routes.ts` and (b) one line in `routes/index.ts`. If a route change requires editing `routes/` handlers, the design has drifted — fix it by moving the handler into the module.

### 4.1 Dependency injection — who gives Module B its Module A service

**Yes — constructor dependency injection.** Here is the exact discipline.

**Rule 1 — Services depend on interfaces, never on concrete classes.**
`VitalsService` needs patient operations. It declares a dependency on the `PatientsService` *interface* (the public methods it uses), not on the concrete `PatientsService` class. In TypeScript this is structural typing:

```ts
// vitals/vitals.service.ts — depends on an interface, not the patients module's internals
import type { PatientsService } from '../patients'; // interface only (type-only import)

export class VitalsService {
  constructor(
    private readonly patients: PatientsService,   // injected, never constructed here
    private readonly vitalsRepository: VitalsRepository,
  ) {}
}
```

Because interfaces are erased at runtime, this costs nothing and couples `vitals` to a contract, not an implementation.

**Rule 2 — Only the composition root constructs.**
`server.ts` (or a `wireDependencies()` helper it calls) does all `new`. Domain code never calls `new SqliteXRepository(...)` or `new OtherService(...)`. This is what makes the graph acyclic in practice: nothing inside a module can reach sideways; the one place that knows the whole graph is the root.

```ts
// server.ts — the ONLY file that knows the whole graph (simplified)
const db = openDatabase();
const patientsRepository = new SqlitePatientsRepository(db);
const patientsService = new PatientsService(patientsRepository);            // A built first
const vitalsRepository = new SqliteVitalsRepository(db);
const vitalsService = new VitalsService(patientsService, vitalsRepository); // B receives A
app.use('/api/v1', createApiRouter({ patientsService, vitalsService, ... }));
```

**Rule 3 — Parameters are named after the collaborator role, `readonly`, and in dependency order.**
`private readonly patients: PatientsService` — not `svc`, not `service1`. Order: domain dependencies first (`patients`), then infrastructure (`vitalsRepository`, `logger`). Every constructor param is `readonly` except the composition root's locals.

**Rule 4 — Routers are injected the same way routes are.**
A router factory receives the service instance(s) it needs and nothing else:

```ts
// patients/patients.routes.ts
export function createPatientsRouter(deps: { patientsService: PatientsService }): Router {
  const router = Router();
  router.post('/', async (req, res, next) => { /* validate → patientsService.create(...) */ });
  return router;
}
```

**Rule 5 — Optional/config behaviours come second, never first.**
Config values (`DocumentStorage`, `PasswordHasher`, `LlmClient`) are injected after domain deps. Strategy selection (bcrypt vs argon2, Ollama vs remote) happens in `server.ts` / wallet config, not inside the service.

**Rule 6 — No `new` inside a service, except for value objects.**
Constructing a `Date`-free DTO or a `ReferenceRange` value object locally is fine. Constructing a *collaborator with behaviour* (service, repository, client, storage) locally is a violation — that collaborator arrives via constructor.

**Rule 7 — Test doubles plug into the same seam.**
A service test passes a fake implementing the interface; an adapter test passes a real `:memory:` DB; a route test passes a stubbed service into the router factory. If a dependency can only be satisfied by the real implementation, the seam is wrong.

**When NOT to inject:** pure functions (`rules/`, parsers, matchers, `patient-age`) are imported directly — they have no state and no collaborators, so injection buys nothing. `platform/` helpers (logger, error types, `openDatabase` factory result) are provided from the composition root like anything else.
- **A route handler does exactly four things:** (1) auth/ownership guard, (2) validate input, (3) call the service, (4) map to the response. No business logic, no SQL, no branching beyond validation.
- **Validation at the edge.** Every request body/query is validated before the service sees it. Invalid input → `400 VALIDATION_ERROR` with field-level detail. Services trust validated DTOs.
- **Response shape:** JSON everywhere. Success: resource DTO(s). Error: `{ error: CODE, message: string, details?: unknown }`. The 404 catch-all and 500 handler in `app.ts` are the backstop, not the plan — domain code throws typed errors.
- **No status codes as strings, no `200 OK` strings in bodies.** HTTP status is the status; the body carries data.
- **Idempotency:** `POST` creates are safe to retry only where the service defines a natural key; otherwise document non-idempotency. `PUT` replaces the full editable representation.
- **Auth:** `identity.middleware.ts` attaches `req.principal` (or `req.userId` — pick one and keep it; see §8). Every `Patient-scoped` route calls `patient-ownership.ts` before touching data (F4). Ownership failures are `403` (don't reveal existence) unless the resource is already known to the caller.
- **File upload:** stored via `DocumentStorage` (Strategy) to encrypted volume, never written by routes directly. `storage_path` is opaque — clients never see raw filesystem paths.

---

## 5. Persistence conventions (SQLite)

- **Contracts are driver-free.** `*.repository.ts` imports only `*.model.ts` types. `better-sqlite3` appears **only** under `modules/*/sqlite/` and `platform/`.
- **Adapters are async** (`Promise<...>`) even though `better-sqlite3` is synchronous under the hood — services stay DB-technology-agnostic and portable to a future async driver.
- **Schema lives in `sqlite/schema-vX.ts`** as versioned SQL strings. **Append-only:** never edit a shipped schema file; add `schema-v2.ts` and register it in `platform/sqlite/migrations.ts`. Migrations run in one transaction per version with `PRAGMA user_version` gating (see scaffold `migrations.ts`).
- **Nested data as JSON columns** (`allergies`, `chronic_conditions`, `past_surgeries`, `reference_range`, `document_ids` — matching SRS §4). The generic `SqliteRepository<T>` (`platform/sqlite/repository.ts`) encodes/decodes JSON columns; adapters declare their `jsonColumns` explicitly.
- **Foreign keys ON, single-writer only (F1).** A module's adapter writes its own table(s) and nothing else — not even "just updating one field". Cross-domain references (e.g. `lab_results.document_id`) are stored as plain string ids; the owning module is never read through another module's repository.
- **No raw SQL string concatenation with user input.** Bound parameters only (`?` / `@named`). Table/column identifiers come from the fixed `columns` list, never from requests.

---

## 6. Module structure — file-by-file

Inside each `modules/<module>/`, follow this anatomy. Not every file is needed for every module — but if you create one, it holds exactly this and nothing else:

| File | Holds | Must NOT hold |
|---|---|---|
| `<module>.model.ts` | Stored domain objects + nested value types (`Allergy`, `ChronicCondition`…). `snake_case` fields (§2.5). | I/O, validation, Express types, `Date` objects |
| `<module>.repository.ts` | Async repository interface (methods = domain verbs). | SQL, driver imports, DTOs |
| `<module>.types.ts` | Wire DTOs (`CreatePatientRequest`, `PatientResponse`), public service signatures, union types. `camelCase`. | Storage shapes, SQL |
| `<module>.service.ts` | Use-case logic. Depends on repository *interfaces* + `platform/` only. | SQL, `req`/`res`, file paths |
| `<module>.routes.ts` | Express router: validate → guard → service → map. | Business rules, SQL |
| `<module>.middleware.ts` | Only where needed (identity). Attaches principal; throws `UnauthorizedError` when missing. | Ownership checks (that's `patients`) |
| Domain helpers (e.g. `patient-age.ts`, `test-matcher.ts`, `status.ts`) | Single named concept per file, pure functions or tiny strategies. | HTTP, DB |
| `sqlite/schema-vX.ts` | Versioned DDL for this module's tables. | Application logic |
| `sqlite/repository.ts` | `Sqlite<Module>Repository` implementing the interface; the `snake_case`↔mapper home. | Business rules |
| `index.ts` | Public API: re-export service + types + router creation. **The only import surface.** | Internal helpers, SQL, route handlers |

**Worked example — `patients` (already scaffolded):**
`patients.model.ts` (snake_case stored `Patient`) · `patients.repository.ts` (`create`, `findById`, `listByOwner`, `updateDetails`) · `patients.service.ts` (ownership + age derivation + detail replacement) · `patients.routes.ts` · `patient-ownership.ts` (the one authorization point, F4) · `patient-age.ts` (pure derivation) · `sqlite/` adapter. A `vitals` or `visits` module follows the same anatomy with its own resources.

---

## 7. Module boundaries & dependency DAG

From `ARCHITECTURE_OWNERSHIP_SPEC.md` §7–§8. **These are rules, not suggestions.** A pull request that violates one fails review regardless of other merit.

**Allowed dependency matrix (abridged — check the spec for the full table):**

| Module | May depend on |
|---|---|
| `identity`, `reference`, `llm-settings` | Nothing (except `platform/`) |
| `rules` | `reference` **types only** — receives catalog data as arguments, never loads it, never does I/O (F3) |
| `patients` | `identity` (principal type only) |
| `vitals`, `visits` | `patients` |
| `medications` | `patients`, `reference` (drug dictionary via `DrugDictionaryLoader`/service) |
| `documents` | `patients` |
| `extraction` | `documents` (read file), `llm-settings`, `reference`. **Never** `lab-results`/`medications`/`visits`/`patients` in either direction (F2) |
| `lab-results` | `patients`, `reference`, `rules` |
| `snapshot` | `patients`, `vitals`, `visits`, `medications`, `lab-results`, `reference`, `rules` |
| `dashboard` | `patients`, `visits`, `medications`, `lab-results`, `reference` |
| `organ-map` | `patients`, `lab-results`, `reference`, `rules` |
| `ingestion` (workflow) | `documents`, `extraction`, `patients`, `lab-results`, `medications`, `visits` |
| `backup` | Every owner module's public export/import service |

**Forbidden (code-review checklist, F1–F10 abridged):**
- F1 No module writes another module's table — writes go through the owner's service. Only `backup` restore calls multiple owners' import services.
- F2 `extraction` produces **candidate data only**; it never persists clinical rows. The ingestion workflow confirms and saves via owners.
- F3 `rules` imports nothing that does I/O.
- F4 Only `patients` implements ownership. No other module re-implements it.
- F5 No domain module imports `ingestion`. The workflow calls domains; domains never call back.
- F6 Read models (`snapshot`, `dashboard`, `organ-map`) write nothing and never depend on each other.
- F7 `reference` reads no domain collections.
- F8 Only `identity` reads `users.password_hash`.
- F9 Status/severity/organ mapping come from `rules` + catalog, never from the LLM, never from the client.
- F10 Read models never recompute status/severity — they read the stored values or call `rules`.

**Composition root wiring rule:** `server.ts` (or a `wireDependencies()` helper it calls) instantiates adapters → services → routers and injects them via constructors. Services receive interfaces, never concrete adapters. Tests substitute fakes at the interface seam.

---

## 8. Identity & auth conventions

- **Principal shape (one place, one name):** `IdentityPrincipal` = `{ userId: string }` (plus `username` if needed for logging — decide once, in `identity.types.ts`, and use that exact shape everywhere). The middleware puts it on the request as `req.principal`.
- **`identity.middleware.ts`** authenticates (JWT verify) and attaches the principal. It does **not** check patient ownership — that is `patient-ownership.ts` in `patients/`, called by every patient-scoped route.
- **Password hashing** behind `PasswordHasher` (Strategy): bcrypt or argon2, `async hash(plain)`, `async verify(plain, hash)`, `async needsRehash(hash)`. Hash never leaves `identity/` (F8), never appears in logs, DTOs or error messages.
- **Session tokens** (`session-token.ts`): issue + verify + revoke; secrets come from env (`platform/config.ts`), never hardcoded, never logged.
- **LLM secrets** (`llm-settings/`): API keys referenced, never stored in plaintext in the repo. Remote provider selection requires explicit opt-in + the privacy warning surfaced in the API response (SRS §1.1, §8).

---

## 9. LLM & extraction conventions (the trust boundary)

The SRS's core rule — **the LLM extracts; code decides** — is enforced in code, not just in prose:

- `extraction/llm-client.ts` (`LlmClient` Strategy: Ollama + OpenAI-compatible impls) returns **raw text rows only**, shaped exactly by SRS §7 (`test_name`, `value`, `unit`, `reference_range_text`).
- `extraction/value-parser.ts` and `range-text-parser.ts` parse `< 200`, `4.0 - 5.6`, `> 40`, `Positive`, `Nil` into typed values. Parsing is *not* deciding: parsers never produce status/severity/organ.
- `lab-results/test-matcher.ts` + `fuzzy-matcher.ts` map raw names → catalog entries (alias → fuzzy → unmatched). Unmatched rows persist with `test_id: null` for manual mapping.
- **Confirm gate:** no extraction output reaches `lab_results`/`medications`/`visits` except through `ingestion.service.ts` after a user confirm POST. `extraction` never imports those modules (F2).
- **Numeric parsing ≠ status computation.** `rules/status.ts` + `severity.ts` compute `LOW/NORMAL/HIGH/UNKNOWN` and `BORDERLINE/SIGNIFICANT` from the *preferred* range (report range first, catalog fallback). `llm-settings/remote-provider-guard.ts` enforces local-by-default before any remote call.

---

## 10. Testing standards

- **Pure modules first:** `rules/`, `value-parser`, `range-text-parser`, `patient-age`, matchers — unit-test with plain inputs/outputs, no DB, no network. These carry the highest regression value (SRS §8 fixture set for extraction).
- **Services** are tested against fake repositories (in-memory impl of the interface). Test the rule, not the SQL.
- **Adapters** (`sqlite/repository.ts`) are tested against `openDatabase(':memory:')` + `migrateSqlite` — real SQLite, no mocks of the driver.
- **Routes** are tested with the app factory (`createApp`) and supertest-style requests against an in-memory composition: auth → validation → ownership → service → response shape.
- **Extraction fixtures:** 10–15 anonymized real Indian-lab reports (Thyrocare, Dr Lal PathLabs, Metropolis) as regression fixtures for parser + matcher (SRS §8). Fixtures live outside `src/` (see `test/` or a `fixtures/` dir) and are versioned.
- **Naming:** tests mirror source — `<unit>.test.ts` next to or mirroring the unit; test cases read as behaviour: `it('marks HIGH when value exceeds report range', ...)`.
- **No skipped tests on main.** A failing test blocks release; a flaky test is treated as a bug.

---

## 11. Review checklist (paste into PR template)

Every backend PR MUST pass all of these:

- [ ] New/changed code follows the case rules (§2.1) — files kebab, types Pascal, vars/methods camel, constants SNAKE, storage snake, paths kebab
- [ ] Class suffix is from §2.2; no `Manager`/`Helper`/`Util`/`Base`/`Impl`/`I*` names
- [ ] No `any`, no `!`, explicit return types on exports, errors are typed (§3)
- [ ] DI: services take interfaces via `readonly` constructor params; only `server.ts` calls `new` (§4.1)
- [ ] No `console.log` in domain code; no secrets in repo or logs
- [ ] Route handlers do validate → guard → service → map only (§4)
- [ ] New table? Schema appended as new `schema-vX.ts` + registered migration (§5)
- [ ] New cross-module import? Check against §7 DAG; `extraction` isolation (F2) and read-model purity (F6/F10) intact
- [ ] Status/severity/organ logic in `rules` only; LLM output treated as untrusted text (§9)
- [ ] Tests added for pure modules and service boundaries (§10); `npm run typecheck && npm test` green

---

## 12. Development workflow — feature-by-feature, backend-first

Development proceeds **one vertical feature slice at a time**, in this order:

```
1. Backend support for the feature (API + service + adapter + migration if needed)
        ↓ testable on its own via curl / the backend's own test suite
2. Frontend wiring for the same feature (Angular feature + route + API call)
        ↓
3. End-to-end smoke: the feature works through the UI against the live backend
```

**Invariants that follow from this workflow:**

1. **The app is always runnable.** After step 1, the backend builds, typechecks, passes its tests, and serves the new endpoints. After step 3, the frontend builds and the feature works end-to-end. There is never a commit where the app is known-broken on `main`.
2. **Features are independently shippable.** A feature slice must not require a later slice to function — it may depend only on slices already merged. If feature B needs infrastructure from feature C, C lands first (this is why the §7 DAG is also the build order: `identity`/`patients` → `vitals`/`visits` → `medications` → `documents`/`extraction`/`lab-results` → read models).
3. **Backend-first means contract-first.** The backend step defines the wire DTOs (`*.types.ts`) and the routes; the frontend step *consumes* that contract, never redefines it. If the frontend needs a field the backend doesn't provide, the backend issue is reopened — the frontend does not compute, enrich, or fabricate it.
4. **Each slice is tested at three levels** (see §10): pure-unit tests land with the backend, API tests exercise the new endpoints through `createApp`, and the step-3 smoke test is a manual end-to-end pass through the UI. A slice is not done until all three pass.
5. **Limited capability is acceptable; broken is not.** A slice that only covers manual entry (e.g. medications without the optional vision read) is fine to ship — the UI labels what exists today. A slice that leaves the app unable to start, migrate, or serve previously-shipped features is not.

**Feature ordering guideline (suggested):**
- Slice 1: `identity` (login/register) + `patients` (CRUD) — the app can authenticate and list profiles.
- Slice 2: `vitals` + `visits` — dated data the snapshot needs.
- Slice 3: `medications` (manual-first) — active list functional without LLM.
- Slice 4: `documents` + `reference` + `rules` + `lab-results` (manual entry only) — lab results usable before extraction exists.
- Slice 5: `extraction` + `ingestion` — upload → extract → review → confirm end-to-end.
- Slice 6: `snapshot` + `dashboard` + `organ-map` — read models over everything above.
- Slice 7: `llm-settings` hardening + `backup` — operations features.

Within a slice, backend and frontend issues are tracked as a pair (backend issue first, frontend issue second) linked as blocked-by.

---

## 13. Working with this doc

- New module? Copy the anatomy in §6 and add a row to §7's matrix — both in the same PR as the scaffold.
- New pattern? Propose it in the ownership spec first, then document it in §0.
- Stuck between two rules? The ownership spec's principles (§0 in `ARCHITECTURE_OWNERSHIP_SPEC.md`) arbitrate: single writer, LLM extracts/code decides, human confirms, pure rules, one authorization point.
