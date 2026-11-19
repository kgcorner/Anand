# Software Requirements Specification (SRS)
## Project: Anand — V1

---

## 1. System Overview & Objectives

HealthPulse is a self-hosted, privacy-first, open-source family health record system. It ingests prescriptions, doctor visit notes and lab reports (PDFs or images), extracts structured data using a local (default) or remote OpenAI-compatible LLM, and produces:

1. **Doctor-Visit Snapshot (core feature)** — a one-page, printable summary of a patient's current health picture with the age of every data point, so the patient or their companion can walk into any doctor's room prepared.
2. **Organ Map** — an interactive 2D body map showing which body systems have out-of-range lab results, to help non-medical users understand where an issue lies.
3. **Trendlines** — historical charts for each lab test.

**Disclaimer (shown in-app):** HealthPulse organizes and visualizes records. It does not diagnose or give medical advice.

### 1.1 Design Principles
- **The LLM extracts; code decides.** The LLM only pulls raw values out of documents. Test identity, status (NORMAL/HIGH/LOW), severity and organ mapping are computed deterministically from curated data.
- **Human confirms before save.** No extracted data is saved without user review.
- **Local by default.** Remote LLM providers are opt-in with an explicit privacy warning.

---

## 2. Technology Stack

* **Frontend:** Angular (latest LTS), Tailwind CSS / Angular Material, SVG-based body map, a charting library for trendlines.
* **Backend:** Spring Boot 3.x (Java 17+), REST API, Spring AI or REST client for OpenAI-compatible endpoints.
* **Database:** Database-independent TypeScript persistence contracts; SQLite is the first implementation.
* **Document Processing:**
  * Apache PDFBox for digital PDF text extraction.
  * Vision-capable LLM (e.g., `llama3.2-vision` via Ollama) for scanned PDFs and images.
  * **Hardware note:** an 11B vision model needs ~8–12 GB VRAM; on CPU-only machines expect several minutes per page.
* **Deployment:** Docker Compose (frontend, backend with persistent SQLite storage, optional Ollama).

---

## 3. Reference Data (Curated, Shipped in Repo)

All files are versioned JSON/TSV in the repository so contributors can review and correct them.

### 3.1 Test Catalog (`test_catalog.json`)
A canonical list of lab tests (V1 target: ~150 common tests covering CBC, LFT, KFT, lipid, thyroid, diabetes, vitamins, electrolytes, urine routine, iron studies).

Each entry:
```json
{
  "test_id": "HBA1C",
  "loinc_code": "4548-4",
  "display_name": "HbA1c",
  "aliases": ["Glycated Hemoglobin", "Glycosylated Hb", "A1C", "HbA1c (NGSP)"],
  "canonical_unit": "%",
  "unit_conversions": [{ "from": "mmol/mol", "formula": "x * 0.0915 + 2.15" }],
  "default_reference_range": { "low": 4.0, "high": 5.6 },
  "borderline_margin_pct": 10,
  "organ_primary": "pancreas",
  "organ_secondary": [],
  "stale_after_days": 90,
  "info_source": "MedlinePlus"
}
```

### 3.2 Organ Systems
`brain`, `thyroid`, `lungs`, `heart_cardiovascular`, `liver`, `pancreas`, `kidneys`, `blood`, `bones_joints`, `general`.
Tests that point to multiple organs (e.g., Creatinine → kidneys + muscle; ALP → liver + bone) use `organ_primary` + `organ_secondary`. Tests with no single organ (e.g., CRP) map to `general`.

### 3.3 Drug Dictionary
Derived from **Common Drug Codes for India (NRCeS / MoHFW)** — brand → generic mapping, used for prescription autocomplete.

### 3.4 Data Sources & Licensing
| Source | Use | Cost / License |
|---|---|---|
| LOINC (Regenstrief) | Test codes & names | Free; license file must ship with repo |
| MedlinePlus Connect (NIH) | Plain-language test explanations (via LOINC code) | Free API |
| Common Drug Codes for India (NRCeS) | Drug autocomplete | Free; check NRCeS terms before redistributing |
| SNOMED CT | Not used in V1 | Free in India but per-deployment license; deferred |

**Validation:** the organ mapping table must be reviewed once by a medical professional before V1 release.

---

## 4. Logical Persistence Schema

The examples below describe logical records, not a driver or on-disk representation. The backend contracts use opaque string IDs (`id`); `_id`, `ObjectId`, and `ISODate` in the examples are legacy notation. Dates use `YYYY-MM-DD` and timestamps use ISO 8601 UTC.

### A. `patients`
```json
{
  "_id": "ObjectId",
  "owner_user_id": "ObjectId",
  "name": "Kumar Gaurav",
  "date_of_birth": "1987-05-10",
  "gender": "Male",
  "blood_group": "B+",
  "allergies": [
    { "substance": "Penicillin", "reaction": "Rash", "severity": "MODERATE", "recorded_at": "ISODate" }
  ],
  "chronic_conditions": [
    { "name": "Hypertension", "diagnosed_on": "2022-03-01", "status": "ACTIVE" }
  ],
  "past_surgeries": [
    { "procedure": "Appendectomy", "date": "2015-08-12", "hospital": "City Hospital" }
  ],
  "created_at": "ISODate"
}
```
Age is always derived from `date_of_birth`, never stored.

### B. `vitals`
Weight, height, BP and similar, stored as time-series so every value has a date.
```json
{ "_id": "ObjectId", "patient_id": "ObjectId", "type": "WEIGHT", "value": 75, "unit": "kg", "measured_at": "2026-11-02" }
```

### C. `medical_visits`
```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "visit_date": "2026-11-02",
  "doctor_name": "Dr. Sharma",
  "specialty": "General Physician",
  "clinic_name": "City Health Clinic",
  "reason": "Routine checkup, fatigue",
  "notes": "string",
  "document_ids": ["ObjectId"]
}
```

### D. `medications`
Kept separate from visits so the active list is easy to query.
```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "visit_id": "ObjectId",
  "medicine_name": "Atorvastatin",
  "generic_name": "Atorvastatin",
  "drug_code": "CDCI code (optional)",
  "dosage": "10mg",
  "frequency": "Once daily at bedtime",
  "start_date": "2026-11-02",
  "end_date": null,
  "status": "ACTIVE",
  "entry_source": "MANUAL"
}
```
`status`: `ACTIVE` | `STOPPED`. `entry_source`: `MANUAL` | `OCR_CONFIRMED`.

### E. `lab_results`
One document per test result (enables fast trend queries).
```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "document_id": "ObjectId",
  "visit_id": "ObjectId (optional)",
  "test_id": "HBA1C",
  "raw_test_name": "Glycosylated Haemoglobin (HbA1c)",
  "raw_value": "7.2",
  "raw_unit": "%",
  "value": 7.2,
  "unit": "%",
  "reference_range": { "low": 4.0, "high": 5.6, "source": "REPORT" },
  "status": "HIGH",
  "severity": "SIGNIFICANT",
  "sample_date": "2026-10-28",
  "lab_name": "Thyrocare"
}
```
* `status` and `severity` are computed by the backend (see §6).
* `reference_range.source`: `REPORT` (preferred; printed on the lab report) or `CATALOG` (fallback).
* Unmatched tests are saved with `test_id: null` and flagged for the user to map manually.

### F. `documents`
```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "file_name": "lipid_nov26.pdf",
  "file_type": "LAB_REPORT",
  "storage_path": "encrypted volume path",
  "processing_status": "PENDING_REVIEW",
  "uploaded_at": "ISODate"
}
```
`file_type`: `LAB_REPORT` | `PRESCRIPTION` | `VISIT_NOTE` | `OTHER`.
`processing_status`: `UPLOADED` | `EXTRACTING` | `PENDING_REVIEW` | `CONFIRMED` | `FAILED`.

### G. `users`
Login accounts. A user can manage multiple patient profiles (family).

---

## 5. Functional Requirements & User Flows

### Flow 1: Authentication & Profiles
* Local user accounts with password hashing (bcrypt/argon2); JWT sessions.
* A user creates and manages family member profiles, including allergies, conditions and surgeries.
* Endpoints: `POST /api/v1/auth/login`, `POST/GET/PUT /api/v1/patients`, `/api/v1/patients/{id}/allergies`, `/conditions`, `/surgeries`.

### Flow 2: Lab Report Upload & Extraction
1. User uploads a PDF or image for a patient.
2. File stored on encrypted volume.
3. Text extracted via PDFBox; if no selectable text, page images go to the vision model.
4. LLM returns raw rows (test name, value, unit, reference range as printed) per the schema in §7.
5. Backend matches each row to the Test Catalog (alias match → fuzzy match → unmatched), normalizes units, computes status and severity.
6. **Review screen:** user sees original document side-by-side with extracted rows, can edit or delete rows and map unmatched tests.
7. On confirm, rows are saved to `lab_results`.
* Endpoints: `POST /api/v1/patients/{id}/documents`, `GET /api/v1/documents/{id}/extraction`, `POST /api/v1/documents/{id}/confirm`.

### Flow 3: Prescription Entry
* **Manual entry is the primary flow**, with drug-name autocomplete from the drug dictionary.
* Optional "Read prescription" button runs the vision model and pre-fills the form as suggestions. The user must confirm every field.
* UI notes that handwritten prescription reading is unreliable.

### Flow 4: Doctor-Visit Snapshot (Core)
A one-page summary, viewable on phone and exportable as PDF for offline use.

Contents, in order:
1. Patient: name, age, gender, blood group, latest weight (with date).
2. **Allergies** (highlighted at top).
3. Chronic conditions and past surgeries.
4. Active medications with dose and start date.
5. **Out-of-range lab results only**, each with value, reference range, sample date, trend arrow (↑ ↓ →) versus the previous result.
6. Last 3 doctor visits with reason.

**Freshness rules:**
* Every value shows its age (e.g., "measured 8 months ago").
* Values older than the test's `stale_after_days` are marked ⚠️ *stale*.
* Snapshot header shows the generation date and the date of the most recent data point.

Endpoints: `GET /api/v1/patients/{id}/snapshot`, `GET /api/v1/patients/{id}/snapshot.pdf`.

### Flow 5: Dashboard & Trendlines
* Visit timeline, active vs stopped medications, latest result per test.
* Clicking a test shows its trendline with reference range band.
* Endpoint: `GET /api/v1/patients/{id}/dashboard`, `GET /api/v1/patients/{id}/lab-results?test_id=HBA1C`.

### Flow 6: Organ Map
* 2D SVG body map with organs from §3.2.
* Each organ's colour reflects the worst **latest** result mapped to it (primary mapping; secondary mappings shown as an outline only):
  * Grey — no data
  * Green — all normal
  * Amber — borderline
  * Red — significantly out of range
* Stale results render faded.
* Clicking an organ filters the dashboard to its tests and shows a plain-language description of each test (from MedlinePlus).
* Map displays the disclaimer: *"Shows which body system a test relates to. Not a diagnosis."*

---

## 6. Status & Severity Rules (Deterministic)

Computed in backend code, never by the LLM.

* **Status:** `LOW` if value < low; `HIGH` if value > high; else `NORMAL`.
* **Severity** (for out-of-range values):
  * `BORDERLINE` — within `borderline_margin_pct` of the limit (default 10%).
  * `SIGNIFICANT` — beyond that margin.
* Reference range printed on the report takes priority over the catalog default.
* If no reference range is available, status is `UNKNOWN` and the organ map ignores it.

---

## 7. LLM Extraction Contract

The LLM returns raw text fields only. It does **not** decide status, organ or LOINC code.

```json
{
  "type": "object",
  "properties": {
    "document_type": { "type": "string", "enum": ["LAB_REPORT", "PRESCRIPTION", "VISIT_NOTE", "OTHER"] },
    "lab_name": { "type": "string" },
    "doctor_name": { "type": "string" },
    "sample_date": { "type": "string", "format": "date" },
    "lab_rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "test_name": { "type": "string" },
          "value": { "type": "string" },
          "unit": { "type": "string" },
          "reference_range_text": { "type": "string" }
        },
        "required": ["test_name", "value"]
      }
    },
    "prescription_rows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "medicine_name": { "type": "string" },
          "dosage": { "type": "string" },
          "frequency": { "type": "string" },
          "duration": { "type": "string" }
        },
        "required": ["medicine_name"]
      }
    }
  },
  "required": ["document_type"]
}
```

Backend parses `value` and `reference_range_text` into numbers, handling forms like `< 200`, `4.0 - 5.6`, `> 40`, and non-numeric values (`Positive`, `Nil`).

---

## 8. Non-Functional Requirements

* **Privacy:** local LLM (Ollama/LM Studio) is the default. Selecting a remote provider shows a warning that documents leave the device.
* **Security:** authentication required; uploaded files encrypted at rest; SQLite files are kept private to the backend on restricted storage; any future database service must not be exposed outside the Docker network; HTTPS via reverse proxy.
* **Configurable LLM:** Base URL, API key, model ID, separate text and vision model settings.
* **Backup:** one-click export of all patient data (JSON + original files) and restore.
* **Testing:** a fixture set of 10–15 anonymized real lab reports from major Indian labs (e.g., Thyrocare, Dr Lal PathLabs, Metropolis) for extraction regression tests.
* **Open source:** licensed (e.g., AGPL-3.0 or MIT — TBD); LOINC license and attribution included.

---

## 9. Out of Scope for V1 (Planned for V2+)

* Explaining the impact of out-of-range values (to be sourced from MedlinePlus, not LLM-generated text).
* Time-limited share link / QR code for the snapshot.
* Medication reminders.
* Drug-interaction warnings.
* ABHA / ABDM integration.
* Mobile app.