import type { HistoricalEvent } from '../../types';
import { yearScale } from '../../utils/yearScale';

/*
 * Sample data for the /timeline-lab harness.
 *
 * The point of the lab is PROGRESSION: every shot of a direction at 5, 14 and 30 cards has
 * to read as the same game later on, not three unrelated boards. So a single deterministic
 * draw order is cut at each length — board(n) is always a prefix of board(n+1), sorted by
 * year, exactly like the real board.
 *
 * Presentation only. Nothing in the game imports this file.
 */

/** mulberry32 — small deterministic PRNG so every run of the screenshot script matches. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAX_BOARD = 30;
/** Cards drawn beyond the longest board, so the hand is never empty at MAX_BOARD. */
const DRAW_DEPTH = MAX_BOARD + 6;
/** No slice of history may supply more than this, so an unlucky shuffle can't flatten the ramp. */
const PER_SLICE_CAP = Math.ceil(MAX_BOARD / 3);
const SLICES = 6;

/**
 * A plausible draw order: a seeded shuffle of the pool, capped per slice of the paper ramp so
 * no single stretch of history dominates — eight consecutive medieval cards would say nothing
 * about whether a tint that keys off year is working.
 */
export function drawOrder(all: HistoricalEvent[], seed = 20260914): HistoricalEvent[] {
  const r = rng(seed);
  // Decorate-sort-undecorate rather than an in-place Fisher-Yates: indexed assignment trips
  // the repo's `security/detect-object-injection` rule, which CI promotes to an error.
  const shuffled = all
    .filter((e) => e.image_url)
    .map((event) => ({ event, key: r() }))
    .sort((a, b) => a.key - b.key)
    .map((d) => d.event);

  const used = new Map<number, number>();
  const picked: HistoricalEvent[] = [];
  for (const e of shuffled) {
    if (picked.length >= DRAW_DEPTH) break;
    const slice = Math.min(SLICES - 1, Math.floor(yearScale(e.year) * SLICES));
    const count = used.get(slice) ?? 0;
    if (count >= PER_SLICE_CAP) continue;
    used.set(slice, count + 1);
    picked.push(e);
  }
  return picked;
}

export interface LabBoard {
  /** The placed cards, sorted by year — Timeline's `events` prop. */
  events: HistoricalEvent[];
  firstYear: number;
  lastYear: number;
  /** Years between the earliest and latest card. */
  spanYears: number;
}

function trimZero(n: number, digits: number): string {
  return n.toFixed(digits).replace(/\.0$/, '');
}

/** "648" / "12k" / "2.5M" / "1.2B" — the unit is written by the caller. */
export function compactYears(years: number): string {
  if (years >= 1e9) return `${trimZero(years / 1e9, 1)}B`;
  if (years >= 1e6) return `${trimZero(years / 1e6, 1)}M`;
  if (years >= 1e4) return `${Math.round(years / 1e3)}k`;
  return Math.round(years).toLocaleString();
}

/** The first `count` cards of the draw, sorted by year — a real mid-game board. */
export function buildBoard(draw: HistoricalEvent[], count: number): LabBoard {
  const events = draw
    .slice(0, Math.max(0, count))
    .sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
  const firstYear = events.at(0)?.year ?? 0;
  const lastYear = events.at(-1)?.year ?? 0;
  return { events, firstYear, lastYear, spanYears: lastYear - firstYear };
}
