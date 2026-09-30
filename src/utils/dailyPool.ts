import { HistoricalEvent, DEFAULT_DIFFICULTIES } from '../types';
import { DailyTheme, getDailyTheme, getThemedCategories, getThemedEras } from './dailyTheme';
import { filterPool } from './eventLoader';
import { eventInPlace } from './regions';
import type { BuildRampedDeckOptions } from './deckBuilder';
import type { CuratedTheme } from './curatedThemes';

/**
 * The events today's daily is allowed to draw from.
 *
 * Lives in its own module because both the deck builder and the recency chain need
 * it, and having either import the other would be circular.
 */

// A pool depends only on the day's theme, and there are a bounded number of those
// (the categories, "Everything", and the menu's places and pairings). The recency chain
// builds a pool per day for weeks at a time, and `filterByEra` alone is a linear scan of
// the era table for every event, so without this the walk re-derives the same answers.
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

/**
 * Band-0 cards a place or pairing day keeps however many the last week used.
 *
 * The number the ramp's opening actually consumes: positions 0-5 draw about 3 from band 0 and
 * the composed window about 4. See `footholdFloor` in BuildRampedDeckOptions.
 */
export const FOOTHOLD_FLOOR = 4;

export function buildDailyPool(
  allEvents: HistoricalEvent[],
  dateString: string
): HistoricalEvent[] {
  const theme = getDailyTheme(dateString);
  if (theme.type === 'curated') return buildCuratedPool(allEvents, theme.curated);

  const key = poolCacheKey(theme);
  const cached = readPoolCache(allEvents, key);
  if (cached) return cached;

  // The Custom page's filter chain with every region, which is no region filter at all, then the
  // theme's place. Deliberately not the Custom region filter: a daily's pool must never move, and
  // that filter's rules are the picker's to change.
  const themed = filterPool(allEvents, {
    difficulties: [...DEFAULT_DIFFICULTIES],
    categories: getThemedCategories(theme),
    eras: getThemedEras(theme),
  });
  const place = theme.type === 'place' || theme.type === 'mix' ? theme.place : undefined;
  const pool = place ? themed.filter((event) => eventInPlace(event, place)) : themed;

  poolCache.set(key, pool);
  return pool;
}

/**
 * The events a curated theme resolves to, memoised under the same `curated:<id>` key the
 * daily uses, so the day it ran and an Archive replay of it share one array identity (which
 * is also what the deck builder's partition cache keys on).
 *
 * A curated theme names its events outright, so there is nothing to filter by. Slugs that do
 * not resolve just drop out: `allEvents` is already deduped and restricted to events with
 * custom art, so an unillustrated card is invisible here exactly as it is everywhere else.
 * scripts/publish-theme.js is what stops an unresolvable slug being stored at all.
 */
export function buildCuratedPool(
  allEvents: HistoricalEvent[],
  theme: CuratedTheme
): HistoricalEvent[] {
  const key = `curated:${theme.id}`;
  const cached = readPoolCache(allEvents, key);
  if (cached) return cached;

  const wanted = new Set(theme.eventNames);
  const pool = allEvents.filter((event) => wanted.has(event.name));
  poolCache.set(key, pool);
  return pool;
}

function readPoolCache(allEvents: HistoricalEvent[], key: string): HistoricalEvent[] | undefined {
  if (cachedFor !== allEvents) {
    poolCache.clear();
    cachedFor = allEvents;
  }
  return poolCache.get(key);
}

function poolCacheKey(theme: DailyTheme): string {
  if (theme.type === 'place') return `place:${theme.place}`;
  if (theme.type === 'mix') return `mix:${theme.value}:${theme.place}`;
  return theme.type === 'all' ? 'all' : `category:${theme.value}`;
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
 *
 * Place and pairing days get both, for the same reasons (a pairing can be 30 cards), plus
 * `footholdFloor`: the menu admits them on 8+ band-0 cards, but the week before may have used
 * some, and those are what the opening is made of. On a big place (Europe) all three are
 * no-ops in practice.
 *
 * "Everything" and category days get the defaults, and curated days keep exactly the two
 * options above: past days' decks are replayed by the recency chain, so their options must
 * never move.
 */
export function getDailyBuildOptions(
  dateString: string
): Pick<BuildRampedDeckOptions, 'bandSpread' | 'minAfterExclusion' | 'footholdFloor'> {
  const theme = getDailyTheme(dateString);
  if (theme.type === 'curated') {
    return { bandSpread: 1, minAfterExclusion: CURATED_MIN_AFTER_EXCLUSION };
  }
  if (theme.type === 'place' || theme.type === 'mix') {
    return {
      bandSpread: 1,
      minAfterExclusion: CURATED_MIN_AFTER_EXCLUSION,
      footholdFloor: FOOTHOLD_FLOOR,
    };
  }
  return {};
}

/** Test seam — the cache is a pure memo, so clearing it can only cost time. */
export function clearDailyPoolCache(): void {
  poolCache.clear();
  cachedFor = null;
}
