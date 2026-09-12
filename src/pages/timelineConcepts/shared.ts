import type { CSSProperties } from 'react';
import type { Era, HistoricalEvent } from '../../types';
import { ALL_ERAS, ERA_DEFINITIONS, eraForYear } from '../../utils/eras';
import { filterByEra } from '../../utils/eventLoader';
import { formatYear } from '../../utils/gameLogic';

/*
 * Shared vocabulary for the /timeline-concepts mockups: the sample data, the per-row facts
 * every concept draws from, and the era wash/ink palette (CSS vars in index.css, named by
 * `Era` id). Presentation-only — nothing here is imported by the game.
 */

export type ConceptId = 'atlas' | 'dusk' | 'ledger';
export const CONCEPTS: { id: ConceptId; name: string; blurb: string }[] = [
  { id: 'atlas', name: 'Atlas', blurb: 'Editorial. Light and type carry the theme.' },
  { id: 'dusk', name: 'Dusk to Dawn', blurb: 'Cinematic. History as light; time takes space.' },
  { id: 'ledger', name: 'Ledger', blurb: 'Instrument. The gutter becomes a scale.' },
];

export interface ConceptRow {
  kind: 'event' | 'tombstone';
  event: HistoricalEvent;
  /** Display index (events and tombstones alike) — the screenshot script scrolls by it. */
  index: number;
  era: Era;
  prevEra: Era | null;
  /** Years since the row above; null on the first row. */
  gapYears: number | null;
  /** First row of a new era (row 0 counts). */
  eraStart: boolean;
  /** Rows this era runs for, counted from this row (only meaningful when eraStart). */
  eraSpan: number;
}

export function buildRows(
  events: HistoricalEvent[],
  tombstones: HistoricalEvent[] = []
): ConceptRow[] {
  const dead = new Set(tombstones.map((e) => e.name));
  const all = [...events, ...tombstones].sort(
    (a, b) => a.year - b.year || a.name.localeCompare(b.name)
  );
  const rows: ConceptRow[] = all.map((event, index) => {
    const era = eraForYear(event.year);
    const prev = all.at(index - 1);
    const prevEra = index === 0 || !prev ? null : eraForYear(prev.year);
    return {
      kind: dead.has(event.name) ? 'tombstone' : 'event',
      event,
      index,
      era,
      prevEra,
      gapYears: index === 0 || !prev ? null : event.year - prev.year,
      eraStart: prevEra !== era,
      eraSpan: 0,
    };
  });
  for (let i = 0; i < rows.length; i++) {
    const row = rows.at(i);
    if (!row?.eraStart) continue;
    let span = 1;
    while (rows.at(i + span)?.era === row.era) span++;
    row.eraSpan = span;
  }
  return rows;
}

export function eraName(era: Era): string {
  return ERA_DEFINITIONS.find((d) => d.id === era)?.name ?? era;
}

export function eraStartYear(era: Era): number {
  return ERA_DEFINITIONS.find((d) => d.id === era)?.startYear ?? 0;
}

/** Row-level CSS vars the concept stylesheets read: this row's wash/ink and the row above's. */
export function eraVars(row: ConceptRow): CSSProperties {
  const prev = row.prevEra ?? row.era;
  return {
    '--wash': `var(--era-wash-${row.era})`,
    '--wash-prev': `var(--era-wash-${prev})`,
    '--ink': `var(--era-ink-${row.era})`,
    '--ink-prev': `var(--era-ink-${prev})`,
  } as CSSProperties;
}

/** Vars for the runway above the first row / below the last (a solid wash, no blend). */
export function edgeVars(row: ConceptRow | undefined): CSSProperties {
  const era = row?.era ?? 'medieval';
  return {
    '--wash': `var(--era-wash-${era})`,
    '--wash-prev': `var(--era-wash-${era})`,
    '--ink': `var(--era-ink-${era})`,
    '--ink-prev': `var(--era-ink-${era})`,
  } as CSSProperties;
}

/** `formatYear` split for typesetting: "1,184" + "BCE", "4.5 billion" + "BCE", "1740" + null. */
export function yearParts(year: number): { main: string; suffix: string | null } {
  const text = formatYear(year);
  return text.endsWith(' BCE')
    ? { main: text.slice(0, -4), suffix: 'BCE' }
    : { main: text, suffix: null };
}

/** Log-scaled 0..1 for a gap in years: 1 yr → 0, a million years → 1. */
export function gapScale(years: number | null): number {
  if (years === null || years <= 1) return 0;
  return Math.min(1, Math.log10(years) / 6);
}

function trimZero(n: number, digits: number): string {
  return n.toFixed(digits).replace(/\.0$/, '');
}

/** "1,200 years" / "12k years" / "2.5M years" / "1.2B years". */
export function formatGap(years: number): string {
  if (years >= 1e9) return `${trimZero(years / 1e9, 1)}B years`;
  if (years >= 1e6) return `${trimZero(years / 1e6, 1)}M years`;
  if (years >= 1e4) return `${Math.round(years / 1e3)}k years`;
  return `${years.toLocaleString()} years`;
}

/** Evenly spaced picks from a sorted list, first and last always included. */
function spread<T>(sorted: T[], count: number): T[] {
  if (sorted.length <= count) return sorted;
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const item = sorted.at(Math.round((i * (sorted.length - 1)) / (count - 1)));
    if (item) out.push(item);
  }
  return out;
}

/** My-Timeline-shaped sample: `perEra` events per era, spread by year, art preferred. */
export function pickSample(all: HistoricalEvent[], perEra = 5): HistoricalEvent[] {
  const picked = new Map<string, HistoricalEvent>();
  for (const era of ALL_ERAS) {
    const inEra = filterByEra(all, [era]).sort(
      (a, b) => a.year - b.year || a.name.localeCompare(b.name)
    );
    const withArt = inEra.filter((e) => e.image_url);
    for (const e of spread(withArt.length >= perEra ? withArt : inEra, perEra)) {
      picked.set(e.name, e);
    }
  }
  return [...picked.values()].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
}

export interface GameSample {
  board: HistoricalEvent[];
  tombstones: HistoricalEvent[];
  hand: HistoricalEvent;
  handCount: number;
}

/** A mid-game board cut from the sample: six placed cards, two tombstones, one in hand. */
export function pickGame(sample: HistoricalEvent[]): GameSample | null {
  if (sample.length < 12) return null;
  const board = sample.filter((_, i) => i % 7 === 0);
  const names = new Set(board.map((e) => e.name));
  const rest = sample.filter((e) => !names.has(e.name));
  const [hand, ...others] = rest;
  return hand ? { board, tombstones: spread(others, 2), hand, handCount: 5 } : null;
}
