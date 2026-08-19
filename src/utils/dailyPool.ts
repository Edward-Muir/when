import { HistoricalEvent, DEFAULT_DIFFICULTIES } from '../types';
import { DailyTheme, getDailyTheme, getThemedCategories, getThemedEras } from './dailyTheme';
import { filterByDifficulty, filterByCategory, filterByEra } from './eventLoader';
import type { BuildRampedDeckOptions } from './deckBuilder';

/**
 * The events today's daily is allowed to draw from.
 *
 * Lives in its own module because both the deck builder and the recency chain need
 * it, and having either import the other would be circular.
 */

// A pool depends only on the day's theme, and there are just 21 of those (20
// categories plus "Everything"). The recency chain builds a pool per day for weeks
// at a time, and `filterByEra` alone is a linear scan of the era table for every
// event, so without this the walk spends most of its time re-deriving 21 answers.
const poolCache = new Map<string, HistoricalEvent[]>();
let cachedFor: HistoricalEvent[] | null = null;

/**
 * How much of a curated pool must survive the seven-day exclusion for it to apply.
 *
 * Set just above the deck a strong run actually consumes: the seed card, a hand of five, and
 * ~30 correct placements. Below that the filter backs out and the whole theme stays
 * available, which is the right trade -- a short deck ends the game early, a repeated card
 * is only mildly annoying.
 */
export const CURATED_MIN_AFTER_EXCLUSION = 12;

export function buildDailyPool(
  allEvents: HistoricalEvent[],
  dateString: string
): HistoricalEvent[] {
  if (cachedFor !== allEvents) {
    poolCache.clear();
    cachedFor = allEvents;
  }

  const theme = getDailyTheme(dateString);
  const key = poolCacheKey(theme);
  const cached = poolCache.get(key);
  if (cached) return cached;

  // A curated theme names its events outright, so there is nothing to filter by. Slugs that
  // do not resolve just drop out: `allEvents` is already deduped and restricted to events
  // with custom art, so an unillustrated card is invisible here exactly as it is everywhere
  // else. scripts/publish-theme.js is what stops an unresolvable slug being stored at all.
  const pool =
    theme.type === 'curated'
      ? curatedPool(allEvents, theme.curated.eventNames)
      : filterByEra(
          filterByCategory(
            filterByDifficulty(allEvents, [...DEFAULT_DIFFICULTIES]),
            getThemedCategories(theme)
          ),
          getThemedEras(theme)
        );

  poolCache.set(key, pool);
  return pool;
}

function poolCacheKey(theme: DailyTheme): string {
  if (theme.type === 'curated') return `curated:${theme.curated.id}`;
  return theme.type === 'all' ? 'all' : `category:${theme.value}`;
}

function curatedPool(allEvents: HistoricalEvent[], eventNames: string[]): HistoricalEvent[] {
  const wanted = new Set(eventNames);
  return allEvents.filter((event) => wanted.has(event.name));
}

/**
 * Deck-builder options for a given day, derived from the date alone.
 *
 * MUST be the only source of these, and every `buildRampedDeck` call on the daily path has
 * to use it — `dailyConfig.buildDailyDeck` for the deck that gets dealt, and
 * `dailyRecency`'s chain walk for the decks it replays. If those two disagree, the chain
 * excludes cards nobody saw and fails to exclude cards everybody saw, which is the
 * "approximate history as a hard filter" failure dailyRecency's header comment calls
 * measurably worse than having no recency at all.
 *
 * Curated days get both escape hatches:
 *
 *   bandSpread: 1       -- lift the per-band cap. On a pool this small every band's budget
 *                          floors to 1, which forces the hardest quartile into the opening
 *                          hand almost every game. See BuildRampedDeckOptions.
 *   minAfterExclusion   -- a curated pool is far below the default floor, so without this
 *                          the seven-day no-repeat filter would always back out and a
 *                          curated day would get no protection at all.
 */
export function getDailyBuildOptions(
  dateString: string
): Pick<BuildRampedDeckOptions, 'bandSpread' | 'minAfterExclusion'> {
  const theme = getDailyTheme(dateString);
  if (theme.type !== 'curated') return {};
  return { bandSpread: 1, minAfterExclusion: CURATED_MIN_AFTER_EXCLUSION };
}

/** Test seam — the cache is a pure memo, so clearing it can only cost time. */
export function clearDailyPoolCache(): void {
  poolCache.clear();
  cachedFor = null;
}
