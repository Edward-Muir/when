import { Difficulty, HistoricalEvent } from '../types';

/**
 * Composite difficulty scoring.
 *
 * The `difficulty` label in the event data grades *recognition* — would a general
 * audience know this event? But how hard a card is to place depends mostly on
 * *placeability*: how crowded the timeline is where the card belongs. Those two are
 * not the same thing, and in this catalogue they actively disagree: the median
 * `easy` event has 325 other events within +/-25 years, while the median `very-hard`
 * event has 114. Fame concentrates in the modern era, so the most recognisable cards
 * sit in the most crowded stretch of the timeline.
 *
 * The moon landing is `easy` with 634 neighbours — famous, genuinely hard to place.
 * "Archean Eon Begins" is `very-hard` with 0 — unrecognisable, impossible to get
 * wrong. Ordering a deck on the raw label alone would open a game with the most
 * crowded cards on the board.
 *
 * So we blend the two into a composite score and sort events into four bands by its
 * global quartiles. Bands are absolute (quartiles of the whole catalogue, not of the
 * day's filtered pool) so that a card's band means the same thing on every theme,
 * which is what keeps difficulty consistent from day to day.
 */

/** How much the recognition label counts relative to placeability. */
export const W_RECOGNITION = 0.6;

/** Half-width, in years, of the window used to measure how crowded a card's era is. */
export const DENSITY_WINDOW_YEARS = 25;

/** Band 0 is the easiest quarter of the catalogue, band 3 the hardest. */
export type DifficultyBand = 0 | 1 | 2 | 3;

export const ALL_BANDS: DifficultyBand[] = [0, 1, 2, 3];

/** Recognition component, normalised to 0 (most familiar) .. 1 (least). */
const RECOGNITION_RANK: Record<Difficulty, number> = {
  easy: 0,
  medium: 1 / 3,
  hard: 2 / 3,
  'very-hard': 1,
};

export interface EventMetrics {
  /**
   * The event's position in the catalogue's year distribution, 0..1 (empirical CDF).
   *
   * This is the coordinate the deck builder measures spacing in. Raw years are
   * useless here — the catalogue spans 4.5 billion of them — and log-age assumes
   * density falls off exponentially, which it doesn't. CDF rank makes the catalogue
   * uniform by construction, so a distance in this space reads directly as "how many
   * catalogue events lie between these two", which is exactly placement ambiguity.
   */
  u: number;
  /** Local crowding: how many other events fall within DENSITY_WINDOW_YEARS. */
  density: number;
  /** Blended recognition + placeability, 0..1. */
  score: number;
  band: DifficultyBand;
}

export interface DifficultyIndex {
  get(event: HistoricalEvent): EventMetrics;
  bandOf(event: HistoricalEvent): DifficultyBand;
  uOf(event: HistoricalEvent): number;
}

/**
 * Count events whose year falls within +/-window of `year`, excluding the event
 * itself. `sortedYears` must be ascending.
 */
function countWithin(sortedYears: number[], year: number, window: number): number {
  const lowerBound = (target: number): number => {
    let lo = 0;
    let hi = sortedYears.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if ((sortedYears.at(mid) ?? 0) < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return Math.max(0, lowerBound(year + window + 1) - lowerBound(year - window) - 1);
}

// Building the index is O(n log n) over the whole catalogue, so memoise it against
// the array we were handed. `loadAllEvents` caches its result, so in practice this
// computes once per session.
const indexCache = new WeakMap<HistoricalEvent[], DifficultyIndex>();

/**
 * Build the composite difficulty index for a catalogue.
 *
 * Always pass the *full* event list, not a filtered pool: `u` and the band
 * thresholds are meant to be global, so that a card keeps the same coordinates and
 * the same band no matter which theme is being played.
 */
export function buildDifficultyIndex(allEvents: HistoricalEvent[]): DifficultyIndex {
  const cached = indexCache.get(allEvents);
  if (cached) return cached;

  const byYear = [...allEvents].sort((a, b) => a.year - b.year);
  const sortedYears = byYear.map((e) => e.year);

  const metrics = new Map<string, EventMetrics>();
  const denominator = Math.max(1, byYear.length - 1);

  // Pass 1: CDF coordinate and local density.
  const densities: number[] = [];
  byYear.forEach((event, i) => {
    const density = countWithin(sortedYears, event.year, DENSITY_WINDOW_YEARS);
    densities.push(density);
    metrics.set(event.name, { u: i / denominator, density, score: 0, band: 0 });
  });

  // Pass 2: blend into a composite score. Density is log-compressed because it spans
  // three orders of magnitude across eras.
  const maxLogDensity = Math.log1p(Math.max(0, ...densities)) || 1;
  for (const event of byYear) {
    const m = metrics.get(event.name);
    if (!m) continue;
    const placeability = Math.log1p(m.density) / maxLogDensity;
    const recognition = RECOGNITION_RANK[event.difficulty] ?? 0.5;
    m.score = W_RECOGNITION * recognition + (1 - W_RECOGNITION) * placeability;
  }

  // Pass 3: assign bands by global quartile of the composite score.
  const ascending = [...metrics.values()].map((m) => m.score).sort((a, b) => a - b);
  const quartile = (p: number): number =>
    ascending.at(Math.min(ascending.length - 1, Math.floor(ascending.length * p))) ?? 0;
  const q1 = quartile(0.25);
  const q2 = quartile(0.5);
  const q3 = quartile(0.75);
  for (const m of metrics.values()) {
    m.band = m.score < q1 ? 0 : m.score < q2 ? 1 : m.score < q3 ? 2 : 3;
  }

  // Events absent from the index (e.g. a synthetic card in a test) fall back to the
  // middle of the timeline and the middle band rather than throwing.
  const fallback: EventMetrics = { u: 0.5, density: 0, score: 0.5, band: 1 };
  const index: DifficultyIndex = {
    get: (event) => metrics.get(event.name) ?? fallback,
    bandOf: (event) => (metrics.get(event.name) ?? fallback).band,
    uOf: (event) => (metrics.get(event.name) ?? fallback).u,
  };

  indexCache.set(allEvents, index);
  return index;
}
