# Anand (HealthPulse) — Design Specification & UX Architecture

**Version:** 1.1 (Tailwind CSS & Heroicons Locked)  
**Design Philosophy:** Modern Minimalist, High-Legibility Clinical Utility, Privacy-First  
**Platform:** Responsive Web (Desktop 1440px / 1200px, Tablet 768px, Mobile 390px) + Print-Optimized Layouts  
**Associated Design System:** `{{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}` (Clinical Clarity)  
**Frontend UI Tooling:** **Tailwind CSS (v3.x / arbitrary tabular values & clinical tokens)** & **Heroicons (v2 Outline & Mini)**

---

## 1. Executive Summary & Design Principles

"Anand" is a self-hosted, privacy-first personal and family health record application. The UX bridges two core personas:
1. **The Anxious Caregiver / Patient:** Needs rapid comprehension, calm visuals, unambiguous status signals, and zero cognitive overload.
2. **The Attending Physician:** Needs dense, chronological, high-contrast, structured clinical data with zero fluff, clear reference ranges, and provenance/freshness transparency.

### Core Design Tenets
1. **Calm Clinical Clarity (Modern Minimalist):**
   - Clean, light surfaces (`bg-slate-50`, cards `bg-white`), crisp border lines (`border-slate-200`), restrained teal branding (`bg-teal-600`, text `text-teal-600`), and strictly purposeful semantic color.
   - Restraint over decoration: No gratuitous gradients, heavy drop shadows, or generic 3D medical illustrations.
2. **Deterministic Semantic Feedback:**
   - Colors are strictly reserved for clinical states calculated by deterministic rules, never decorative whims:
     - **Normal:** `text-emerald-700 bg-emerald-50 border-emerald-200`
     - **Borderline (within 10% limit margin):** `text-amber-800 bg-amber-50 border-amber-200`
     - **Significant (out-of-range):** `text-rose-700 bg-rose-50 border-rose-200`
     - **Stale data (>90 days):** `text-slate-500 bg-slate-100 border-slate-200` with `ExclamationTriangleIcon` (amber-500)
3. **Data Freshness as a First-Class Citizen:**
   - Every metric, lab row, and vital displays explicit temporal distance (e.g., *"tested 3 months ago"* or *"⚠️ 8 months ago — Stale"*).
4. **Human-in-the-Loop Transparency:**
   - Side-by-side OCR review interfaces with editable cells, confidence indicators, and unambiguous save confirmations.
5. **Print & Offline Readiness:**
   - One-page printable doctor visit snapshots engineered with CSS Paged Media `@media print` and Tailwind `print:` variants for physical A4 hand-offs.

---

## 2. Frontend Iconography & Styling Stack

### 2.1 Styling: Tailwind CSS
- **Color Palette & Mappings:**
  - Base Background: `bg-slate-50` (`#F8FAFC`)
  - Elevated Surfaces & Cards: `bg-white` (`#FFFFFF`) with `border border-slate-200`
  - Subtle Inset Wells: `bg-slate-100` (`#F1F5F9`)
  - Interactive & Brand: `teal-600` (`#0D9488`), hover `teal-700` (`#0F766E`), subtle tint `teal-50` (`#F0FDFA`)
  - Text Hierarchy: `text-slate-900` (headings/key values), `text-slate-600` (labels/subtext), `text-slate-400` (secondary metadata)
  - Numeric Tabular Alignment: `font-mono` or `font-sans tabular-nums` across all numeric vitals, dates, and lab figures.

### 2.2 Iconography: Heroicons (v2)
- **Standardized Sizing & Weight:**
  - Primary UI Navigation & Actions: `size-5` (20px) or `size-6` (24px) `outline` variants (`stroke-1.5` / `stroke-2`).
  - Table badges, pills, and inline metrics: `size-4` (16px) or `size-3.5` `mini` / `solid` variants for high density.
- **Icon Mapping Guide:**
  - **Doctor-Visit Snapshot:** `DocumentTextIcon` (nav), `PrinterIcon` (A4 print action), `ArrowDownTrayIcon` (PDF export), `ShareIcon` (export).
  - **Organ Map:** `CubeTransparentIcon` / `HeartIcon` / anatomical system nodes.
  - **Lab Trends:** `ChartBarSquareIcon` or `ArrowTrendingUpIcon` / `ArrowTrendingDownIcon` / `ArrowsRightLeftIcon` for directional lab trends.
  - **Medications & Rx:** `BeakerIcon` or `ClipboardDocumentListIcon`.
  - **Allergies Banner:** `ExclamationCircleIcon` (solid, `text-rose-600`).
  - **Data Freshness / Stale Warning:** `ClockIcon` or `ExclamationTriangleIcon` (`text-amber-500`).
  - **Privacy & Security Badges:** `ShieldCheckIcon` (solid emerald for local DB), `CpuChipIcon` (offline Ollama), `CloudIcon` with `ExclamationTriangleIcon` (remote provider notice).
  - **OCR Split Screen:** `DocumentMagnifyingGlassIcon`, `PencilSquareIcon`, `CheckCircleIcon`.

---

## 3. Information Architecture & Navigation

Persistent collapsible sidebar on desktop, adaptive bottom navigation bar on mobile:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Anand Header (Patient Selector: "Kumar Gaurav (Self) ▾", Profile, Sync)│
├──────────────┬─────────────────────────────────────────────────────────┤
│ Navigation   │ Main Workspace Area                                     │
│ • Snapshot   │                                                         │
│ • Organ Map  │ [Context Header: Patient Badges, Age, Blood Grp, Vitals]│
│ • Lab Trends │                                                         │
│ • Meds & Rx  │ [Dynamic Screen Content / Data Tables / Charts]         │
│ • Documents  │                                                         │
│ • Settings   │                                                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

### Route & Screen Map
1. **`/snapshot` (Doctor-Visit Snapshot — Core Screen):**
   - High-density, single-page summary formatted for mobile and A4 printing (`print:p-0 print:border-none`).
   - Sections in order: Patient Vitals & Demographics → Allergies Banner (Top Warning) → Chronic Conditions & Surgeries → Active Medications → Out-of-Range Lab Results with Trend Arrows → Recent Doctor Visits.
2. **`/organ-map` (Interactive 2D Body Map & System Overview):**
   - Anatomical SVG mapping 10 systems (`brain`, `thyroid`, `lungs`, `heart_cardiovascular`, `liver`, `pancreas`, `kidneys`, `blood`, `bones_joints`, `general`).
   - Heatmap coloring based on worst latest primary test result; secondary organ ties indicated via dashed outlines.
   - Contextual drawer displaying plain-language MedlinePlus explanations.
3. **`/labs` (Lab Results & Trendlines):**
   - Category-grouped tabular views with chronological sparklines, reference bands (`low` to `high`), and historical delta indicators (`↑`, `↓`, `→`).
4. **`/upload-review` (OCR Extraction & Confirmation Flow):**
   - Split-screen workspace: PDF/Image preview on the left; structured editable data table on the right with mapping status badges (`Matched`, `Catalog Fallback`, `Unmapped`).
5. **`/medications` (Active & Past Prescriptions):**
   - Card/List view of active regimens, CDCI drug dictionary autocomplete, dosage, frequency, and prescribing physician details.
6. **`/family` (Profile Switcher & Family Management):**
   - Multi-profile management (parents, spouse, children) with granular local data backup and export.

---

## 4. Key Component Specifications (Tailwind & Heroicons)

### 4.1 Doctor-Visit Snapshot Card
- **Header:** Patient avatar, Name, Derived Age (e.g. `39y`), Gender (`M`), Blood Group badge (`B+`), Latest Weight (`75 kg` • *2 days ago*), Snapshot generation timestamp.
- **Allergies Banner:** Placed immediately beneath header with `bg-rose-50 border-rose-300 text-rose-900` alert pill and `ExclamationCircleIcon`.
- **Dual Column Layout (Desktop: `grid grid-cols-12 gap-6`) / Stacked (Mobile: `flex flex-col gap-4`):**
  - Left Col: Active Conditions, Past Surgeries, Active Medications (Drug + Generic name, Dosage, Frequency).
  - Right Col: Out-of-Range Lab Highlights with previous delta arrow (`↑ 7.2% vs 6.1%`, reference `4.0–5.6%`), stale indicators (`ClockIcon`), and last 3 doctor visits.
- **Action Toolbar:** "Print Snapshot (A4)", "Download PDF", "Share Local Copy".

### 4.2 Interactive 2D Organ Map
- Minimalist anatomical silhouette rendered in SVG with interactive organ paths:
  - `brain`, `lungs`, `heart_cardiovascular`, `thyroid`, `liver`, `pancreas`, `kidneys`, `blood` (systemic glow), `bones_joints`.
- Hover/Tap micro-interaction: Path fills smoothly with semantic tint (`fill-rose-100 stroke-rose-500` for red alert), showing an elevation tooltip with test count.
- Sidebar drawer sync: Selecting "Pancreas" filters right-hand panel to show `HbA1c` and `Fasting Blood Glucose` with MedlinePlus explanation card and disclaimer pill:
  *"Shows which body system a test relates to. Not a diagnosis."*

### 4.3 Side-by-Side OCR Extraction Review Table
- Split pane: 50% Original Document Canvas (with zoom/pan) | 50% Extracted Data Table.
- Table columns:
  1. `Extracted Test Name` (Editable input)
  2. `Catalog Match LOINC` (Dropdown autocomplete)
  3. `Value` + `Unit` (Numeric input with unit normalizer badge)
  4. `Reference Range` (`low` - `high`, with Source tag: `Report` or `Catalog`)
  5. `Status Pill` (Auto-computed preview: `NORMAL`, `HIGH`, `LOW`)
- Footer Action Bar: Sticky bottom bar with `ArrowPathIcon` (Discard), `PlusIcon` (Add Manual Row), and `CheckIcon` (Confirm & Save).

---

## 5. Responsive Behavior & Breakpoints

| Breakpoint | Target Devices | Layout Adaptations |
|---|---|---|
| **Mobile (`< 640px`)** | iPhone, Android phones | • Bottom tab bar with Heroicons (`Snapshot`, `Organ Map`, `Labs`, `Upload`).<br>• Snapshot collapses to single column with sticky top allergy alert.<br>• Organ map switches to toggle view (Anatomical SVG vs List of Systems).<br>• Document OCR review switches from split-screen to tabbed view (Tab 1: Doc, Tab 2: Rows). |
| **Tablet (`640px – 1024px`)** | iPads, Tablets | • Collapsed icon sidebar (`size-6` Heroicons).<br>• Snapshot switches to 2-column masonry.<br>• Organ map places SVG and test list side-by-side. |
| **Desktop (`> 1024px`)** | Laptops, Desktop displays | • Full expanded 240px sidebar with icon + text labels.<br>• Split-screen OCR review with synchronized scrolling.<br>• High-density data grid tables with inline trend sparklines. |
| **Print (`@media print`)** | A4 Paper / PDF Export | • All navigation, headers, and interactive buttons hidden (`print:hidden`).<br>• Forced 1-page layout with high-contrast grayscale + crisp borders.<br>• Explicit timestamp, patient DOB, and medical disclaimer at footer. |

---

## 6. Accessibility & Privacy Indicators

- **WCAG AA Compliance:** Minimum 4.5:1 contrast on all clinical text; color is never the sole indicator of health status (always paired with labels `HIGH`, `LOW`, `NORMAL` and trend arrows).
- **Privacy Badges:** Persistent local-first indicator in the top navbar:
  - 🟢 `Local Storage Active (SQLite/MongoDB)` (`ShieldCheckIcon`)
  - 🔒 `Local Vision LLM (Ollama / Offline)` (`CpuChipIcon`)
  - ⚠️ If remote provider selected: Visible amber pill: `Remote API Active: Data Leaves Device` (`ExclamationTriangleIcon`).
