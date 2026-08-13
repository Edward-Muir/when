import { HistoricalEvent, DEFAULT_DIFFICULTIES } from '../types';
import { getDailyTheme, getThemedCategories, getThemedEras } from './dailyTheme';
import { filterByDifficulty, filterByCategory, filterByEra } from './eventLoader';

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

export function buildDailyPool(
  allEvents: HistoricalEvent[],
  dateString: string
): HistoricalEvent[] {
  if (cachedFor !== allEvents) {
    poolCache.clear();
    cachedFor = allEvents;
  }

  const theme = getDailyTheme(dateString);
  const key = theme.type === 'all' ? 'all' : `category:${theme.value}`;
  const cached = poolCache.get(key);
  if (cached) return cached;

  const pool = filterByEra(
    filterByCategory(
      filterByDifficulty(allEvents, [...DEFAULT_DIFFICULTIES]),
      getThemedCategories(theme)
    ),
    getThemedEras(theme)
  );

  poolCache.set(key, pool);
  return pool;
}

/** Test seam — the cache is a pure memo, so clearing it can only cost time. */
export function clearDailyPoolCache(): void {
  poolCache.clear();
  cachedFor = null;
}
