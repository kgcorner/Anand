import { NgClass } from '@angular/common';
import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowDownTray,
  heroArrowPath,
  heroArrowUpTray,
  heroBeaker,
  heroCheck,
  heroChartBar,
  heroChevronDown,
  heroClock,
  heroDocumentPlus,
  heroDocumentText,
  heroExclamationTriangle,
  heroHeart,
  heroMagnifyingGlass,
  heroMagnifyingGlassPlus,
  heroPlus,
  heroPrinter,
  heroQuestionMarkCircle,
  heroShieldCheck,
  heroTrash,
  heroXMark,
} from '@ng-icons/heroicons/outline';

type ReactionSeverity = 'mild' | 'moderate' | 'severe';
type ProfileId = 'self' | 'mother' | 'son';

interface CatalogIcon {
  readonly name: string;
  readonly usage: string;
  readonly tone: string;
}

interface CatalogProfile {
  readonly id: ProfileId;
  readonly initials: string;
  readonly name: string;
  readonly meta: string;
  readonly avatarClass: string;
}

interface CatalogLabRow {
  readonly test: string;
  readonly organ: string;
  readonly source: string;
  readonly stale: boolean;
  readonly staleLabel?: string;
  readonly value: string;
  readonly arrow: string;
  readonly valueClass: string;
  readonly badge: string;
  readonly badgeClass: string;
  readonly reference: string;
}

const CORE_ICONS: readonly CatalogIcon[] = [
  { name: 'heroDocumentText', usage: 'Reports', tone: 'text-teal-600' },
  { name: 'heroHeart', usage: 'Cardio / Vitals', tone: 'text-rose-500' },
  { name: 'heroChartBar', usage: 'Trends', tone: 'text-sky-600' },
  { name: 'heroBeaker', usage: 'Lab tests', tone: 'text-violet-600' },
  { name: 'heroMagnifyingGlassPlus', usage: 'Inspect', tone: 'text-slate-600' },
  { name: 'heroPrinter', usage: 'Print', tone: 'text-slate-600' },
  { name: 'heroClock', usage: 'Freshness', tone: 'text-amber-600' },
  { name: 'heroShieldCheck', usage: 'Privacy', tone: 'text-emerald-600' },
  { name: 'heroTrash', usage: 'Destructive', tone: 'text-rose-600' },
  { name: 'heroXMark', usage: 'Dismiss', tone: 'text-slate-500' },
  { name: 'heroPlus', usage: 'Add', tone: 'text-teal-600' },
  { name: 'heroCheck', usage: 'Confirm', tone: 'text-emerald-600' },
  { name: 'heroArrowPath', usage: 'Retry', tone: 'text-slate-500' },
  { name: 'heroArrowDownTray', usage: 'Export', tone: 'text-slate-500' },
  { name: 'heroArrowUpTray', usage: 'Upload', tone: 'text-teal-600' },
  { name: 'heroChevronDown', usage: 'Select', tone: 'text-slate-500' },
  { name: 'heroExclamationTriangle', usage: 'Warning', tone: 'text-amber-600' },
  { name: 'heroQuestionMarkCircle', usage: 'Help', tone: 'text-slate-500' },
  { name: 'heroDocumentPlus', usage: 'New record', tone: 'text-teal-600' },
  { name: 'heroMagnifyingGlass', usage: 'Search', tone: 'text-slate-500' },
];

const PROFILES: readonly CatalogProfile[] = [
  {
    id: 'self',
    initials: 'KG',
    name: 'Keshav G. (Self)',
    meta: 'Male • 42 yrs • Primary',
    avatarClass:
      'flex size-8 items-center justify-center rounded-full border-2 border-teal-500 bg-teal-100 text-xs font-bold text-teal-800',
  },
  {
    id: 'mother',
    initials: 'SG',
    name: 'Sunita G. (Mother)',
    meta: 'Female • 68 yrs • Family',
    avatarClass:
      'flex size-8 items-center justify-center rounded-full border border-sky-300 bg-sky-100 text-xs font-semibold text-sky-800',
  },
  {
    id: 'son',
    initials: 'AG',
    name: 'Aarav G. (Son)',
    meta: 'Male • 9 yrs • Family',
    avatarClass:
      'flex size-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-xs font-medium text-indigo-700',
  },
];

const LAB_ROWS: readonly CatalogLabRow[] = [
  {
    test: 'HbA1c',
    organ: 'PANCREAS',
    source: 'Lab report • 28 Oct 2026',
    stale: false,
    value: '7.2%',
    arrow: '↑',
    valueClass: 'text-rose-700',
    badge: 'Significant',
    badgeClass: 'status-significant',
    reference: 'Ref: 4.0 – 5.6 %',
  },
  {
    test: 'LDL Cholesterol',
    organ: 'HEART',
    source: 'Lipid panel • 28 Oct 2026',
    stale: false,
    value: '148 mg/dL',
    arrow: '↑',
    valueClass: 'text-amber-700',
    badge: 'Borderline',
    badgeClass: 'status-borderline',
    reference: 'Ref: < 100 mg/dL',
  },
  {
    test: 'TSH',
    organ: 'THYROID',
    source: 'Thyroid panel • 14 Jul 2026',
    stale: true,
    staleLabel: '4 mo',
    value: '6.8 µIU/mL',
    arrow: '↑',
    valueClass: 'text-slate-500',
    badge: 'Stale High',
    badgeClass: 'status-stale',
    reference: 'Ref: 0.4 – 4.0 µIU/mL',
  },
];

const SKELETON_ROWS = [
  { title: 70, subtitle: 40 },
  { title: 55, subtitle: 30 },
  { title: 80, subtitle: 50 },
] as const;

/**
 * Dev-only living style guide for the shared clinical UI kit.
 * Reference: client/templates/components.html (Anand HealthPulse v1.1).
 *
 * All data shown is illustrative sample data, not patient data. Only the
 * switch, the severity radios, the profile switcher and the toast controls are
 * stateful; every other control is a visual specimen with no side effects.
 */
@Component({
  selector: 'app-component-catalog',
  imports: [NgClass, NgIcon],
  providers: [
    provideIcons({
      heroArrowDownTray,
      heroArrowPath,
      heroArrowUpTray,
      heroBeaker,
      heroCheck,
      heroChartBar,
      heroChevronDown,
      heroClock,
      heroDocumentPlus,
      heroDocumentText,
      heroExclamationTriangle,
      heroHeart,
      heroMagnifyingGlass,
      heroMagnifyingGlassPlus,
      heroPlus,
      heroPrinter,
      heroQuestionMarkCircle,
      heroShieldCheck,
      heroTrash,
      heroXMark,
    }),
  ],
  templateUrl: './component-catalog.html',
})
export class ComponentCatalog {
  protected readonly coreIcons = CORE_ICONS;
  protected readonly profiles = PROFILES;
  protected readonly labRows = LAB_ROWS;
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly activeProfileId = signal<ProfileId>('self');
  protected readonly localInferenceEnabled = signal(true);
  protected readonly severity = signal<ReactionSeverity>('moderate');
  protected readonly savedToastOpen = signal(true);
  protected readonly remoteToastOpen = signal(true);

  protected setSeverity(severity: ReactionSeverity): void {
    this.severity.set(severity);
  }

  protected selectProfile(id: ProfileId): void {
    this.activeProfileId.set(id);
  }

  protected toggleLocalInference(): void {
    this.localInferenceEnabled.update((enabled) => !enabled);
  }

  protected resetToasts(): void {
    this.savedToastOpen.set(true);
    this.remoteToastOpen.set(true);
  }
}
