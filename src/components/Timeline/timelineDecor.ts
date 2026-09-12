import { createContext, useContext } from 'react';
import type { CSSProperties } from 'react';
import type { Era } from '../../types';
import { eraForYear } from '../../utils/eras';
import type { TimelineRow } from '../../utils/timelineRows';

/**
 * Decoration layers for the timeline spine. Every layer lives INSIDE the rows (so it
 * scrolls with the cards) and carries no `data-timeline-*` attribute, so the drag
 * insertion math, centering and the miss camera never see it.
 *
 * The context default is what ships; only the /spine-preview harness provides a value.
 * (Same shape as AnimationTuningContext — Game.tsx never learns about it.)
 */
export interface TimelineDecor {
  /** Per-row rail segment and tick coloured by the row's era (`--era-*` vars). */
  eraRail: boolean;
  /** The segment's stroke texture changes with the era (mask keyed on `data-era`). */
  eraStroke: boolean;
  /** Hatch marks in the gutter between rows, more for a bigger jump in years. */
  gapRuler: boolean;
  /** A "+1,200 yrs" whisper next to the hatches at jumps of a millennium or more. */
  gapLabels: boolean;
  /** The static outer rail under everything: today's gold, a faint version, or none. */
  baseRail: 'accent' | 'muted' | 'none';
}

/** Today's look: one gold rail, gold ticks, nothing else. */
export const DECOR_OFF: TimelineDecor = {
  eraRail: false,
  eraStroke: false,
  gapRuler: false,
  gapLabels: false,
  baseRail: 'accent',
};

export const DEFAULT_DECOR: TimelineDecor = DECOR_OFF;

export const TimelineDecorContext = createContext<TimelineDecor>(DEFAULT_DECOR);
export const useTimelineDecor = () => useContext(TimelineDecorContext);

/** Per-row facts the decorations draw from; derived from the row order alone. */
export interface RowDecor {
  era: Era;
  /** Era of the row above, so the rail can blend into this row's colour. Null on row 0. */
  prevEra: Era | null;
  /** Years since the row above. Null on row 0. */
  gapYears: number | null;
}

function rowYear(row: TimelineRow): number {
  return row.kind === 'event' ? row.event.year : row.failed.event.year;
}

/** O(n) over the rendered rows (events and tombstones alike, in display order). */
export function buildRowDecor(rows: TimelineRow[]): RowDecor[] {
  const out: RowDecor[] = [];
  let prevYear: number | null = null;
  let prevEra: Era | null = null;
  for (const row of rows) {
    const year = rowYear(row);
    const era = eraForYear(year);
    out.push({ era, prevEra, gapYears: prevYear === null ? null : year - prevYear });
    prevYear = year;
    prevEra = era;
  }
  return out;
}

/** Hatch-mark count for a gap: 0 for none, then one per order of magnitude, capped at 6. */
export function gapTicks(years: number): number {
  if (!(years > 0)) return 0;
  return Math.min(6, Math.floor(Math.log10(years)) + 1);
}

function trimZero(n: number, digits: number): string {
  return n.toFixed(digits).replace(/\.0$/, '');
}

/** "+1,200 yrs" / "+12k yrs" / "+2.5M yrs" / "+1.2B yrs" — tiers mirror formatYear. */
export function formatGap(years: number): string {
  if (years >= 1e9) return `+${trimZero(years / 1e9, 1)}B yrs`;
  if (years >= 1e6) return `+${trimZero(years / 1e6, 1)}M yrs`;
  if (years >= 1e4) return `+${Math.round(years / 1e3)}k yrs`;
  return `+${years.toLocaleString()} yrs`;
}

/** Tailwind classes for the static outer rail (Timeline.tsx). */
export function baseRailClass(decor: TimelineDecor): string {
  switch (decor.baseRail) {
    case 'muted':
      return 'rail-base-muted';
    case 'none':
      return 'hidden';
    default:
      return 'bg-accent';
  }
}

/** True when the row should draw its own rail segment. */
export function hasRailSegment(decor: TimelineDecor): boolean {
  return decor.eraRail || decor.eraStroke;
}

/** Classes for a row's gutter tick: era-coloured when the rail is, gold otherwise. */
export function tickClass(decor: TimelineDecor, extra = ''): string {
  return `w-3 h-1 shrink-0 ${decor.eraRail ? 'tick-era' : 'bg-accent'} ${extra}`.trim();
}

/**
 * The CSS vars a row exposes to its decorations: `--row-era` (this row's colour) and
 * `--row-era-prev` (the row above's, for the blend). With eraRail off both resolve to
 * the accent, so a texture-only look stays gold.
 */
export function rowDecorStyle(decor: TimelineDecor, row: RowDecor | undefined): CSSProperties {
  if (!row || !decor.eraRail) {
    return {
      '--row-era': 'var(--color-accent)',
      '--row-era-prev': 'var(--color-accent)',
    } as CSSProperties;
  }
  return {
    '--row-era': `var(--era-${row.era})`,
    '--row-era-prev': `var(--era-${row.prevEra ?? row.era})`,
  } as CSSProperties;
}
