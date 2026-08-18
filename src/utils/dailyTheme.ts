import { Category, ALL_CATEGORIES } from '../types';
import { seededRandom, stringToSeed, getCategoryDisplayName } from './gameLogic';
import { ALL_ERAS } from './eras';
import { CuratedTheme, getCuratedThemeForDate } from './curatedThemes';

export type DailyTheme =
  | { type: 'all'; value: null }
  | { type: 'category'; value: Category }
  | { type: 'curated'; value: null; curated: CuratedTheme };

/**
 * Get the daily theme based on a seed string (typically YYYY-MM-DD date)
 *
 * A hand-authored theme scheduled for this date wins. Otherwise the day is derived
 * deterministically: either a single category or "Everything" (all categories), with
 * "Everything" coming up ~50% of the time and the other ~50% split evenly across the
 * individual categories.
 *
 * The curated lookup happens BEFORE the RNG is touched, and must stay there. Every future
 * day's theme is a function of how many random numbers have been drawn from the seed, so a
 * curated check that consumed one would silently re-theme every ordinary day — the same
 * failure mode as adding the 21st category, which re-rolled a year of dates (see
 * docs/leaderboard-daily). Returning early consumes nothing.
 */
export function getDailyTheme(seed: string): DailyTheme {
  const curated = getCuratedThemeForDate(seed);
  if (curated) return { type: 'curated', value: null, curated };

  const random = seededRandom(stringToSeed(seed));

  // ~50% "Everything", ~50% a single random category.
  if (random() < 0.5) {
    return { type: 'all', value: null };
  }

  const idx = Math.floor(random() * ALL_CATEGORIES.length);
  // eslint-disable-next-line security/detect-object-injection
  return { type: 'category', value: ALL_CATEGORIES[idx] };
}

/**
 * Get a human-readable display name for a theme
 */
export function getThemeDisplayName(theme: DailyTheme): string {
  if (theme.type === 'curated') return theme.curated.name;
  if (theme.type === 'all') return 'Everything';
  return getCategoryDisplayName(theme.value);
}

/**
 * Get the selected categories based on the daily theme
 * If theme is a single category, returns only that category
 * If theme is 'all', returns all categories
 *
 * A curated theme returns every category too. Its pool is an explicit list of events rather
 * than anything a category filter could express, so for a curated day this value is
 * informational only — `buildDailyPool` supplies the real pool, and `useWhenGame` routes the
 * daily through it rather than re-deriving one from these filters.
 */
export function getThemedCategories(theme: DailyTheme): Category[] {
  if (theme.type === 'category') return [theme.value];
  return [...ALL_CATEGORIES];
}

/**
 * Get the selected eras based on the daily theme
 * Always returns all eras (daily mode no longer filters by era)
 */
export function getThemedEras(_theme: DailyTheme) {
  return [...ALL_ERAS];
}
