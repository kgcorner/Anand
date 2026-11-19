---
name: Clinical Clarity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  teal-50: '#f0fdfa'
  teal-600: '#0d9488'
  teal-700: '#0f766e'
  slate-50: '#f8fafc'
  slate-100: '#f1f5f9'
  slate-200: '#e2e8f0'
  slate-400: '#94a3b8'
  slate-500: '#64748b'
  slate-900: '#0f172a'
  emerald-50: '#ecfdf5'
  emerald-100: '#d1fae5'
  emerald-500: '#10b981'
  emerald-700: '#047857'
  amber-50: '#fffbeb'
  amber-100: '#fef3c7'
  amber-500: '#f59e0b'
  amber-700: '#b45309'
  red-50: '#fef2f2'
  red-100: '#fee2e2'
  red-600: '#dc2626'
  red-700: '#b91c1c'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-metric:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  data-metric-compact:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a clinical yet reassuring aesthetic engineered for personal health sovereignty. Tailored for individuals managing chronic conditions, multi-generational family caregivers, and privacy-conscious users self-hosting medical records, it bridges the gap between cold laboratory precision and empathetic family care.

The interface adheres to **Minimalist Medical Precision** implemented with modern utility-first discipline:
- **Precision Without Alarm:** Medical data can provoke anxiety. The interface leverages calm Scandinavian minimalism, structured whitespace, and Tailwind CSS Slate and Teal foundational scales to present vital metrics without artificial panic.
- **Deterministic Rigor:** Extracted lab values, reference boundaries, and unit normalizations are visually anchored with strict borders (`border-slate-200`) and tabular numeric typography. Clear cues distinguish verified data from pending OCR extractions awaiting human validation.
- **Visual Hygiene & Scannability:** High-density medical matrix tables and lab trendlines sit within calm layouts, using consistent Heroicons (v2 micro, mini, and outline) to guide attention quickly and eliminate cognitive fatigue during critical consultations.
- **Dual-Medium Architecture:** Every screen state is architected for both responsive digital monitors and strict, ink-efficient print snapshots calibrated for clinical appointments.

## Colors

The color system is standardized on Tailwind CSS 3.x core palette utilities, ensuring predictable contrast ratios and accessibility compliance across clinical charts, badges, and inspection split-views.

### Foundation & Interactive Tiers
- **Canvas & Structural Neutrals:** Canvas substrate uses `bg-slate-50` (`#f8fafc`), with individual data panels on pure white (`bg-white`). Secondary structural fills utilize `bg-slate-100` (`#f1f5f9`), borders default to `border-slate-200` (`#e2e8f0`), and inactive/subtle markers rely on `border-slate-300`. Primary typography maps to `text-slate-900` (`#0f172a`), secondary labels to `text-slate-500` (`#64748b`), and disabled or placeholder copy to `text-slate-400` (`#94a3b8`).
- **Primary Interactive Brand:** Built on Teal 600 (`#0d9488`) for default triggers, selected navigation rows, and focus outlines (`focus:ring-teal-600`). Hover states transition to Teal 700 (`#0f766e`), while light active highlights and hover wells use Teal 50 (`#f0fdfa`).

### Deterministic Clinical Status Tiers
- **Normal / In-Range:** 
  - Utilities: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - Accent / Value marker: `text-emerald-500` (`#10b981`)
- **Borderline / Proactive Observation:**
  - Utilities: `bg-amber-50 text-amber-700 border-amber-200`
  - Accent / Value marker: `text-amber-500` (`#f59e0b`)
- **Significant / Out-of-Range:**
  - Utilities: `bg-red-50 text-red-700 border-red-200`
  - Accent / Value marker: `text-red-600` (`#dc2626`)
- **Stale / Historical (Expired validity windows):**
  - Utilities: `bg-slate-100 text-slate-500 border-slate-200`
  - Indicator: `text-slate-400` with reduced layer opacity (`opacity-60`).

## Typography

Typography relies on **Inter** with native OpenType features activated across the interface (`font-feature-settings: 'tnum' 1, 'cv05' 1, 'cv11' 1`). Code blocks, HL7 segments, and LOINC data points render in **JetBrains Mono**.

### Tailwind Typographic Rules
- **Tabular Numerics (`tabular-nums`):** All numbers, metric values, laboratory bounds, and clinical timestamps must carry the `tabular-nums` Tailwind utility class to preserve vertical decimal and column alignment.
- **Metric Pairing:** Large vital metrics pair `data-metric` (`text-2xl font-semibold tracking-tight tabular-nums text-slate-900`) with adjacent measurement units styled via `text-xs font-medium text-slate-500 uppercase tracking-wide`.
- **Anatomical & Medical Taxonomy:** Medical terminology uses `text-sm font-semibold text-slate-900`, paired with conversational aliases rendered in `text-xs font-normal text-slate-500`.
- **Legibility Guardrails:** Text smaller than `text-xs` (11px minimum via `label-sm`) is forbidden in interactive views to guarantee accessibility under poor lighting or during patient visits.

## Layout & Spacing

The layout is built on Tailwind CSS container boundaries and responsive 12-column grid utilities (`grid grid-cols-12 gap-6`).

### Breakpoints & Adaptive Layouts
- **Desktop (`lg` / 1024px+ & `xl` / 1280px+):** 
  - Standard 12-column layout with 24px gutters (`gap-6`) and maximum boundary `max-w-7xl mx-auto px-8`.
  - Supports side-by-side inspection layouts (e.g., `col-span-6` for raw document scan, `col-span-6` for OCR extraction matrix).
- **Tablet (`md` / 768px – 1023px):**
  - Reflows into an 8-column or alternating 2-column pattern (`grid-cols-2 gap-4 px-6`).
  - Anatomical organ map and vitals breakdown stack vertically.
- **Mobile (`< 768px`):**
  - Single-column linear flow (`flex flex-col space-y-4 px-4`).
  - Dense tabular lab views transform into swipeable summary cards with sticky metric values.
- **Doctor-Visit Print Form Factor:**
  - Print styles (`@media print`) override backgrounds to pure white (`bg-white`), enforce `p-0`, hide non-clinical controls (`print:hidden`), and layout in a clean 2-column or high-density table grid format.

## Elevation & Depth

Visual hierarchy rejects exaggerated, heavy shadows in favor of flat structural clarity, crisp border delineations, and targeted Tailwind ambient shadow utilities.

### Surface Tiers
- **Canvas Level:** `bg-slate-50`. Base substrate for page backgrounds and content scaffolds.
- **Panel & Card Level (Elevation 0):** `bg-white border border-slate-200`. Default resting state for all laboratory cards, metric blocks, and tables. Zero box shadow.
- **Interactive Floating & Dropdowns (Elevation 1):** `bg-white border border-slate-200 shadow-sm` (`shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]`). Applied to popovers, contextual tooltips, and floating filter selects.
- **Inspection Drawers & Modal Overlays (Elevation 2):** Backed by `bg-slate-900/40 backdrop-blur-sm`, with content panels carrying `bg-white border border-slate-200 shadow-lg` (`shadow-[0_10px_15px_-3px_rgba(15,23,42,0.08)]`).
- **Stale Depth Attenuation:** Out-of-date records are visually grounded using `border border-dashed border-slate-300 opacity-60 bg-slate-50/50`.

## Shapes

The design system standardizes on a balanced `0.5rem` (8px, Tailwind `rounded-lg`) geometry. This provides an approachable feel while maintaining structural rectilinearity appropriate for clinical dashboards.

### Corner Radius Mapping
- **Cards, Panels, Inputs, and Modals:** `rounded-lg` (`0.5rem` / 8px).
- **Small Controls & Action Triggers:** Buttons, search bars, and tabular inline dropdowns use `rounded-md` (`0.375rem` / 6px) or `rounded-lg`.
- **Badges, Pills, and Status Chips:** Strictly `rounded-full` (`9999px`) to contrast sharply against rectangular data panels.
- **Interactive SVG Organ Overlays:** 1.5px stroked vector paths with `stroke-linecap="round"` and `stroke-linejoin="round"`.

## Components

Interface iconography and clinical indicators strictly leverage **Heroicons v2**:
- **Micro (16px / `h-4 w-4`):** Tight tabular badges, inline flags, compact table cell markers.
- **Mini (20px / `h-5 w-5`):** Standard form controls, buttons, list item icons, input prefixes.
- **Outline (24px / `h-6 w-6`):** Section titles, primary empty-state callouts, primary navigational sidebars.

### 1. Buttons
- **Primary:** `bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm h-9 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2`. Includes Heroicons Mini (e.g., `CheckIcon`, `ArrowDownTrayIcon`).
- **Secondary / Standard:** `bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm h-9 px-4 rounded-lg border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2`.
- **Destructive:** `bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-sm h-9 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-colors flex items-center gap-2`.
- **Clinical Validation Action:** `bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm` accompanied by `CheckCircleIcon` (mini).

### 2. Status Chips & Medical Badges
Built with `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border uppercase`.
- **Normal Status:** `bg-emerald-50 text-emerald-700 border-emerald-200` with `CheckIcon` (micro).
- **Borderline Status:** `bg-amber-50 text-amber-700 border-amber-200` with `ExclamationTriangleIcon` (micro).
- **Significant / Critical:** `bg-red-50 text-red-700 border-red-200` with `ExclamationCircleIcon` (micro).
- **Stale / Expired Data:** `bg-slate-100 text-slate-500 border-slate-200` with `ClockIcon` (micro).

### 3. Clinical Data Tables
- **Container:** `w-full overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm`.
- **Header:** `bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 text-left`.
- **Rows:** `border-b border-slate-100 hover:bg-slate-50/80 transition-colors h-12 text-sm text-slate-900`.
- **Critical Deviation Row:** Highlighted with `border-l-4 border-l-red-600 bg-red-50/30`.
- **Range Progress Track:** A horizontal embedded range bar (`h-1.5 w-24 bg-slate-200 rounded-full relative overflow-hidden`) with a centered target span (`bg-slate-300`) and the active metric marked as a dot (`h-2.5 w-2.5 rounded-full ring-2 ring-white`) colored according to the status token (`bg-emerald-500`, `bg-amber-500`, or `bg-red-600`).

### 4. Input Fields & Form Controls
- **Standard Input:** `h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600`.
- **With Icon Prefix:** Includes a Heroicons Mini (e.g., `MagnifyingGlassIcon`) positioned via `absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400`.
- **OCR Verification Diff Control:** Side-by-side row comparing original scan string against editable input, featuring quick-action confirm (`CheckIcon`) and reject (`XMarkIcon`) buttons.

### 5. Interactive Anatomical Organ Map
- **SVG Canvas:** Contained in `rounded-lg border border-slate-200 bg-white p-4`.
- **Organ Paths:** Base path styling `fill-slate-100 stroke-slate-300 stroke-[1.5] transition-colors duration-200 hover:fill-slate-200 cursor-pointer`.
- **Active Organ States:** 
  - Normal: `fill-emerald-500/20 stroke-emerald-500`.
  - Borderline: `fill-amber-500/20 stroke-amber-500`.
  - Significant: `fill-red-600/20 stroke-red-600 animate-pulse`.
  - Stale: `stroke-slate-300 fill-slate-100 [stroke-dasharray:4_2] opacity-50`.
- **Hover Inspection Card:** `absolute z-20 w-64 p-3 bg-white border border-slate-200 rounded-lg shadow-md pointer-events-none`.

### 6. Doctor-Visit Snapshot (Printable Report Card)
- **Container:** `bg-white border-b-2 border-slate-900 pb-4 mb-6 print:border-black`.
- **Patient Identifier Banner:** Split header with patient demographics (`text-lg font-bold text-slate-900`), clinical alerts (e.g., allergies marked with `bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded`), and export timestamp.
- **Directional Trend Indicators:** Inline lab metrics indicating trend trajectories using Heroicons Micro:
  - Rising: `ArrowUpIcon` (red-600 or emerald-600 depending on clinical desirability).
  - Falling: `ArrowDownIcon`.
  - Stable: `MinusIcon` (`text-slate-400`).