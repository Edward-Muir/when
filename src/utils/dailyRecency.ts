import { HistoricalEvent } from '../types';
import { buildRampedDeck } from './deckBuilder';
import { buildDailyPool, getDailyBuildOptions } from './dailyPool';
import { dayDiff } from './puzzleDate';

/**
 * The seven-day no-repeat guarantee.
 *
 * A card used in any of the last 7 dailies must not appear in today's. Left alone,
 * 53.8% of days repeat at least one card from the previous week (63.7% when the same
 * theme comes round again), which is exactly the kind of thing a daily player
 * notices.
 *
 * The awkward part is that the daily has to be identical for everyone, so "what did
 * we use recently" cannot be per-player state — it has to be a pure function of the
 * date. Two cheaper approaches were measured and are not enough:
 *
 *   - Downweighting recent cards instead of excluding them only gets to ~45%. A
 *     weight is a nudge; there is no guarantee in it.
 *   - Excluding the previous days' decks as computed *without* exclusion is cheap and
 *     non-recursive, but those decks are not the ones that were played, so it
 *     excludes a set nobody saw and only gets to ~50%.
 *
 * What works is chaining: day N excludes the real decks of N-1..N-7, each of which
 * excluded its own predecessors. That measures at exactly 0% repeats. It costs one
 * deck build per day of chain, and a deck build over the largest pool is ~0.6ms, so
 * the whole walk is tens of milliseconds.
 */

/** How many days back a card is barred from reappearing. */
export const RECENCY_DAYS = 7;

/**
 * Chain length is bounded by anchoring to a rolling block rather than to a fixed
 * launch date, which would grow forever. The walk starts one block *before* the
 * current one, so every day has at least this many days of real history behind it —
 * comfortably more than RECENCY_DAYS.
 */
export const CHAIN_ANCHOR_DAYS = 28;

/** Arbitrary fixed reference for block alignment; only its stability matters. */
const BLOCK_EPOCH = '2024-01-01';

const DAY_MS = 86400000;

/** Shift a `YYYY-MM-DD` string by whole days. Parses as UTC, so DST cannot skew it. */
function addDays(dateString: string, delta: number): string {
  const shifted = new Date(Date.parse(dateString) + delta * DAY_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** First day of the chain for `dateString`: the start of the previous block. */
function chainStart(dateString: string): string {
  const offset = dayDiff(BLOCK_EPOCH, dateString);
  if (!Number.isFinite(offset)) return addDays(dateString, -CHAIN_ANCHOR_DAYS);
  const blockIndex = Math.floor(offset / CHAIN_ANCHOR_DAYS);
  const anchor = addDays(BLOCK_EPOCH, (blockIndex - 1) * CHAIN_ANCHOR_DAYS);
  // Guard against a date before the epoch producing an anchor after today.
  return dayDiff(anchor, dateString) > 0 ? anchor : addDays(dateString, -CHAIN_ANCHOR_DAYS);
}

// Walking the chain is the same work for every caller on a given day, and both the
// mode-select preview and the game start hit it in one session.
const chainCache = new Map<string, Set<string>>();
let cachedFor: HistoricalEvent[] | null = null;

/**
 * Card names used by the dailies of the `RECENCY_DAYS` days before `dateString`.
 *
 * Pure in (`allEvents`, `dateString`) — the cache only avoids repeating work, and a
 * miss recomputes the identical answer.
 */
export function getRecentDailyCardNames(
  allEvents: HistoricalEvent[],
  dateString: string
): Set<string> {
  if (cachedFor !== allEvents) {
    chainCache.clear();
    cachedFor = allEvents;
  }
  const cached = chainCache.get(dateString);
  if (cached) return cached;

  const start = chainStart(dateString);
  const length = dayDiff(start, dateString);
  if (!Number.isFinite(length) || length <= 0) {
    const empty = new Set<string>();
    chainCache.set(dateString, empty);
    return empty;
  }

  // Walk forward, each day excluding the decks the chain has already produced.
  const windowsByDay: string[][] = [];
  for (let offset = 0; offset < length; offset++) {
    const day = addDays(start, offset);
    const exclude = new Set<string>();
    for (let back = 1; back <= RECENCY_DAYS && offset - back >= 0; back++) {
      for (const name of windowsByDay.at(offset - back) ?? []) exclude.add(name);
    }
    // The options must match what buildDailyDeck uses for the same day, or the chain
    // replays a deck nobody was dealt -- see getDailyBuildOptions.
    const deck = buildRampedDeck(buildDailyPool(allEvents, day), day, {
      allEvents,
      exclude,
      windowOnly: true,
      ...getDailyBuildOptions(day),
    });
    windowsByDay.push(deck.map((e) => e.name));
  }

  const recent = new Set<string>();
  for (let back = 1; back <= RECENCY_DAYS && length - back >= 0; back++) {
    for (const name of windowsByDay.at(length - back) ?? []) recent.add(name);
  }

  chainCache.set(dateString, recent);
  return recent;
}

/** Test seam — the cache is a pure memo, so clearing it can only cost time. */
export function clearRecencyCache(): void {
  chainCache.clear();
  cachedFor = null;
}
