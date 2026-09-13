import { ERA_DEFINITIONS } from './eras';

/**
 * The board's sense of time, as two pure rules the physical board renders from.
 *
 * 1. `markTimeGaps`: which gaps between consecutive placed cards are big jumps. Judged
 *    relative to the board, not in absolute years, so a game of modern events and a game
 *    of prehistory both get a few marked gaps rather than none or all. A gap counts when it
 *    is at least ten times the board's median gap (log space, +1) and at least
 *    `MIN_JUMP_YEARS`; with fewer than three gaps there is no median worth trusting and an
 *    absolute `SMALL_BOARD_JUMP_YEARS` applies. `strength` (0..1) says how much taller the
 *    gap should draw: a third at the threshold, full at a hundred times over it.
 *
 * 2. `eraIndexForYear`: which of the eight eras a year falls in, as an index into
 *    `ERA_DEFINITIONS`, for the background wash.
 *
 * Years span -4.5e9 to 30000, so nothing here does raw-year arithmetic beyond a difference:
 * everything else is in log10.
 */

export interface TimeGapMark {
  /** "80 years", "12,000 years", "2 million years", "1.5 billion years". */
  label: string;
  /** 0..1, how much extra room the gap earns on the board. */
  strength: number;
}

const MIN_JUMP_YEARS = 50;
const SMALL_BOARD_JUMP_YEARS = 500;
const MIN_STRENGTH = 1 / 3;
/** Decades over the threshold that reach full strength. */
const FULL_STRENGTH_DECADES = 2;

export function formatSpan(years: number): string {
  const y = Math.max(0, Math.round(years));
  if (y >= 1_000_000_000) return `${(y / 1_000_000_000).toFixed(1)} billion years`;
  if (y >= 1_000_000) return `${Math.round(y / 1_000_000)} million years`;
  if (y === 1) return '1 year';
  return `${y.toLocaleString('en-US')} years`;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const hi = sorted.at(mid) ?? 0;
  return sorted.length % 2 === 1 ? hi : ((sorted.at(mid - 1) ?? 0) + hi) / 2;
}

/**
 * One entry per gap between consecutive years (length `years.length - 1`), null where the
 * gap is unremarkable. `years` must be ascending, as the timeline is.
 */
export function markTimeGaps(years: number[]): (TimeGapMark | null)[] {
  if (years.length < 2) return [];
  const spans = years.slice(1).map((y, i) => Math.max(1, y - (years.at(i) ?? y)));
  const logs = spans.map((s) => Math.log10(s));
  const threshold =
    spans.length >= 3
      ? Math.max(median(logs) + 1, Math.log10(MIN_JUMP_YEARS))
      : Math.log10(SMALL_BOARD_JUMP_YEARS);
  return spans.map((span, i) => {
    const over = (logs.at(i) ?? 0) - threshold;
    if (over < 0) return null;
    const strength = Math.min(1, MIN_STRENGTH + over / FULL_STRENGTH_DECADES);
    return { label: formatSpan(span), strength };
  });
}

/** Index into `ERA_DEFINITIONS` for a year; clamps beyond either end of the table. */
export function eraIndexForYear(year: number): number {
  const idx = ERA_DEFINITIONS.findIndex((era) => year >= era.startYear && year <= era.endYear);
  if (idx !== -1) return idx;
  const first = ERA_DEFINITIONS.at(0);
  return first && year < first.startYear ? 0 : ERA_DEFINITIONS.length - 1;
}

export const ERA_COUNT = ERA_DEFINITIONS.length;
