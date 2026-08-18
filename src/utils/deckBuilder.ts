import { HistoricalEvent } from '../types';
import { seededRandom, stringToSeed, shuffleArray, shuffleArraySeeded } from './gameLogic';
import { ALL_BANDS, DifficultyBand, buildDifficultyIndex } from './difficultyScore';

/**
 * Deck composition.
 *
 * Decks used to be a single shuffle of the whole eligible pool dealt off the top.
 * That pool is ~13% easy, so a game was usually hard and occasionally punishing, and
 * a first-timer's opening card was a coin flip. Worse, the *level* of a day swung
 * mostly with the daily theme — `trade` is 3.4% easy, `figures` is 33.6% — which is
 * far more variance than a player's skill moves in a day, so a score measured the
 * day rather than the player.
 *
 * Now the first RAMP_WINDOW cards are composed deliberately and the rest of the pool
 * follows as a plain shuffle. Selection multiplies two independent weights over a
 * pool that recency has already filtered:
 *
 *   P(pick c at position i)  ∝  bandWeight(band(c), i) · spacingWeight(c | picked)
 *
 * The two are orthogonal by construction: spacing only ever chooses *within* the
 * band the difficulty curve already picked, so adding it does not disturb the
 * difficulty mix at all.
 */

/** Positions that get composed. Beyond this the tail is a plain seeded shuffle. */
export const RAMP_WINDOW = 24;

/** How many cards of the chosen band the spacing kernel gets to choose between. */
export const CANDIDATE_SLATE = 40;

/**
 * A band may supply at most `bandSize / SPREAD` cards to one deck.
 *
 * This is what makes the ramp safe on thin pools. `trade` has only 6 events in the
 * easiest band, and the curve below wants ~4 easy cards per deck — without a cap it
 * would burn almost the whole band every time that theme came up, and the same few
 * cards would recur constantly. With the cap, a thin theme warms up on band 0 *and*
 * band 1 instead, which falls out for free rather than needing a special case.
 * On an "Everything" day the budget is in the hundreds, so this never binds.
 */
export const SPREAD = 6;

/** Spacing strength at position 0; decays linearly to 0 across the window. */
export const SPACING_ALPHA = 8;

/**
 * Distance (in CDF-rank space) beyond which spacing stops paying more.
 *
 * Load-bearing. An unsaturated `distance^alpha` rewards being *maximally* extreme,
 * so the same handful of temporal outliers win every single day — measured, that
 * nearly doubled repeat rates. Capping the reward at roughly one slot-width keeps
 * the dispersion benefit without the winner-takes-all behaviour.
 */
export const SPACING_TAU = 1 / RAMP_WINDOW;

/** Below this many cards we stop excluding recent ones rather than deal a short deck. */
export const MIN_POOL_AFTER_EXCLUSION = 72;

interface BandRow {
  /** This row applies to positions up to and including `upTo` (1-based). */
  upTo: number;
  /** Weight per band, indexed by DifficultyBand. */
  weights: number[];
}

/**
 * Probability of drawing from each band by position. Band 0 is the easiest quarter
 * of the catalogue, band 3 the hardest.
 */
const BAND_CURVE: BandRow[] = [
  { upTo: 2, weights: [0.72, 0.22, 0.05, 0.01] },
  { upTo: 5, weights: [0.42, 0.43, 0.13, 0.02] },
  { upTo: 9, weights: [0.14, 0.5, 0.3, 0.06] },
  { upTo: 14, weights: [0.05, 0.35, 0.45, 0.15] },
  { upTo: Number.MAX_SAFE_INTEGER, weights: [0.02, 0.22, 0.48, 0.28] },
];

function bandWeightsAt(position: number): number[] {
  const row = BAND_CURVE.find((r) => position + 1 <= r.upTo);
  return row?.weights ?? [0.25, 0.25, 0.25, 0.25];
}

/** Draw an index from `weights` using `random`. Assumes at least one is positive. */
function weightedPick(weights: number[], random: () => number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return Math.floor(random() * weights.length);
  let remaining = random() * total;
  for (let i = 0; i < weights.length; i++) {
    remaining -= weights.at(i) ?? 0;
    if (remaining <= 0) return i;
  }
  return weights.length - 1;
}

interface BandQueue {
  cards: HistoricalEvent[];
  /** Cards before this index have been dealt. */
  taken: number;
  /** Most cards this band may supply to one deck. */
  budget: number;
}

/**
 * Drop cards the caller wants kept out — the seven-day no-repeat rule.
 *
 * A hard filter rather than a weight, because a downweighted card can still be drawn
 * and the point of the rule is a guarantee. Backed out entirely if it would leave too
 * little to deal from, which only a very thin theme could ever trigger.
 */
function applyExclusion(
  pool: HistoricalEvent[],
  exclude: ReadonlySet<string> | undefined,
  minAfterExclusion: number
): {
  dropRecent: boolean;
  keep: (event: HistoricalEvent) => boolean;
  eligible: HistoricalEvent[];
} {
  if (exclude === undefined || exclude.size === 0) {
    return { dropRecent: false, keep: () => true, eligible: pool };
  }
  const filtered = pool.filter((e) => !exclude.has(e.name));
  if (filtered.length < minAfterExclusion) {
    return { dropRecent: false, keep: () => true, eligible: pool };
  }
  return { dropRecent: true, keep: (e) => !exclude.has(e.name), eligible: filtered };
}

// Splitting a pool into bands means a Map lookup per event, and the recency chain
// re-derives the same handful of pools for weeks at a time. Pools are themselves
// memoised per theme, so keying on the array identity reuses the split for free.
const partitionCache = new WeakMap<HistoricalEvent[], HistoricalEvent[][]>();

function partitionByBand(
  pool: HistoricalEvent[],
  bandOf: (event: HistoricalEvent) => DifficultyBand
): HistoricalEvent[][] {
  const cached = partitionCache.get(pool);
  if (cached) return cached;

  const partition: HistoricalEvent[][] = [[], [], [], []];
  for (const event of pool) {
    partition.at(bandOf(event))?.push(event);
  }
  partitionCache.set(pool, partition);
  return partition;
}

/**
 * Bands still worth drawing from. Prefers those inside their budget, but falls back
 * to any non-empty band rather than cutting the deck short.
 */
function availableBands(queues: Map<DifficultyBand, BandQueue>): DifficultyBand[] {
  const nonEmpty = ALL_BANDS.filter((b) => {
    const q = queues.get(b);
    return q !== undefined && q.taken < q.cards.length;
  });
  const withinBudget = nonEmpty.filter((b) => {
    const q = queues.get(b);
    return q !== undefined && q.taken < q.budget;
  });
  return withinBudget.length > 0 ? withinBudget : nonEmpty;
}

/**
 * How far `u` sits from the nearest already-picked card, in CDF-rank space.
 * 1 (the whole timeline) when nothing has been picked yet.
 */
function nearestDistance(u: number, pickedU: number[]): number {
  let nearest = 1;
  for (const other of pickedU) {
    const distance = Math.abs(u - other);
    if (distance < nearest) nearest = distance;
  }
  return nearest;
}

/**
 * Pick a card from the front `CANDIDATE_SLATE` of a band, favouring ones far from
 * what's already been picked. Returns an index into `queue.cards`.
 */
function pickSpacedCard(
  queue: BandQueue,
  position: number,
  pickedU: number[],
  uOf: (event: HistoricalEvent) => number,
  random: () => number
): number {
  const slateEnd = Math.min(queue.taken + CANDIDATE_SLATE, queue.cards.length);
  if (slateEnd - queue.taken <= 1 || pickedU.length === 0) return queue.taken;

  const alpha = SPACING_ALPHA * Math.max(0, 1 - position / RAMP_WINDOW);
  const weights: number[] = [];
  for (let i = queue.taken; i < slateEnd; i++) {
    const card = queue.cards.at(i);
    if (!card) break;
    const nearest = nearestDistance(uOf(card), pickedU);
    weights.push(Math.pow(Math.min(nearest, SPACING_TAU), alpha) + Number.EPSILON);
  }
  return queue.taken + weightedPick(weights, random);
}

export interface BuildRampedDeckOptions {
  /**
   * Full catalogue, used to build the global difficulty index. Defaults to the pool
   * itself, which is only correct when the pool *is* the whole catalogue — callers
   * with a filtered pool should always pass this.
   */
  allEvents?: HistoricalEvent[];
  /** Card names to keep out of the deck entirely (the 7-day no-repeat guarantee). */
  exclude?: ReadonlySet<string>;
  /**
   * Divisor behind each band's per-deck budget: `max(1, floor(bandSize / bandSpread))`.
   *
   * Curated-day escape hatch. The default is the measured tuning and must not move — see
   * SPREAD above for why the cap exists at all.
   *
   * It exists because the cap misbehaves badly on a small pool. Every band's budget lands
   * on 1, and since `availableBands` prefers bands still inside their budget, positions 0-3
   * become a forced round-robin of one card per band — so the *hardest* quartile is dealt
   * into the opening hand almost every time (measured: 99.7% on a 30-card pool, against
   * 11.7% on the full catalogue). The trigger is a band-0 population under ~12, not pool
   * size, so no size floor protects against it.
   *
   * Passing `1` — a band may supply all of its cards — disables the cap and restores the
   * full-catalogue opening profile exactly. (Not `Infinity`: that floors the budget to 0 and
   * `max(1, 0)` lands straight back on the pathological value.)
   *
   * That is right for a curated theme: the cap guards against a *recurring* thin
   * category theme burning the same few band-0 cards day after day, and a curated theme
   * fires on a handful of explicit dates. A band that does run dry already cascades into
   * its neighbours via `availableBands`.
   */
  bandSpread?: number;
  /**
   * Below this many cards after exclusion, the recency filter is backed out entirely.
   *
   * Curated-day escape hatch; the default is the measured tuning. A curated pool is far
   * smaller than MIN_POOL_AFTER_EXCLUSION, so without lowering this the seven-day filter
   * would always back out and the day would get no protection at all. Lowering it keeps the
   * guarantee on curated days too.
   */
  minAfterExclusion?: number;
  /**
   * Return only the composed window, skipping the tail shuffle.
   *
   * Nobody plays past the window, but a real deck still needs the tail so the game
   * can keep dealing. The recency chain, which builds a deck per day for weeks, only
   * ever reads the window — and the tail is about half the work.
   */
  windowOnly?: boolean;
}

/**
 * Build a deck whose opening cards give the player a foothold and whose difficulty
 * ramps from there.
 *
 * Deterministic for a given `seed`; falls back to an unseeded shuffle without one.
 * Index 0 is the starting timeline card, so callers deal the hand from index 1 on —
 * the same contract the plain shuffle had.
 */
export function buildRampedDeck(
  pool: HistoricalEvent[],
  seed?: string,
  options: BuildRampedDeckOptions = {}
): HistoricalEvent[] {
  const {
    allEvents = pool,
    exclude,
    windowOnly = false,
    bandSpread = SPREAD,
    minAfterExclusion = MIN_POOL_AFTER_EXCLUSION,
  } = options;
  if (pool.length === 0) return [];

  const { dropRecent, keep, eligible } = applyExclusion(pool, exclude, minAfterExclusion);

  // Without a seed there is nothing to be deterministic about, so keep it simple.
  if (!seed) return shuffleArray(eligible);

  const index = buildDifficultyIndex(allEvents);
  const random = seededRandom(stringToSeed(`${seed}:ramp`));

  // Partition the *unfiltered* pool so the split can be cached across days, then drop
  // excluded cards per band. Filtering preserves order either way, so the shuffled
  // queues come out identical to partitioning the filtered pool directly.
  const partition = partitionByBand(pool, index.bandOf);
  const queues = new Map<DifficultyBand, BandQueue>();
  for (const band of ALL_BANDS) {
    const banded = partition.at(band) ?? [];
    const cards = shuffleArraySeeded(
      dropRecent ? banded.filter(keep) : banded,
      `${seed}:band${band}`
    );
    queues.set(band, {
      cards,
      taken: 0,
      budget: Math.max(1, Math.floor(cards.length / bandSpread)),
    });
  }

  const window: HistoricalEvent[] = [];
  const pickedU: number[] = [];
  const target = Math.min(RAMP_WINDOW, eligible.length);

  for (let position = 0; position < target; position++) {
    const available = availableBands(queues);
    if (available.length === 0) break;

    // Factor 1: difficulty curve. Bands with nothing left drop out and the rest are
    // renormalised, which is how an empty band cascades into its neighbours.
    const curve = bandWeightsAt(position);
    const bandWeights = available.map((b) => curve.at(b) ?? 0);
    const chosenBand = available.at(weightedPick(bandWeights, random)) ?? available[0];

    const queue = queues.get(chosenBand);
    if (!queue) break;

    // Factor 2: spacing. Prefer cards far from everything already picked, so early
    // placements land in wide gaps and get harder as the timeline fills in.
    const chosenIndex = pickSpacedCard(queue, position, pickedU, index.uOf, random);

    // Swap the winner to the front of the unused region so `taken` still partitions
    // the queue into dealt and undealt.
    const card = queue.cards.at(chosenIndex);
    const head = queue.cards.at(queue.taken);
    if (!card || !head) break;
    queue.cards.splice(chosenIndex, 1, head);
    queue.cards.splice(queue.taken, 1, card);
    queue.taken++;

    window.push(card);
    pickedU.push(index.uOf(card));
  }

  if (windowOnly) return window;

  // Everything the window didn't consume follows in plain seeded-shuffle order.
  const used = new Set(window.map((e) => e.name));
  const tail = shuffleArraySeeded(
    eligible.filter((e) => !used.has(e.name)),
    `${seed}:tail`
  );

  return [...window, ...tail];
}
