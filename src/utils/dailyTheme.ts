import { Category, ALL_CATEGORIES } from '../types';
import { seededRandom, stringToSeed, getCategoryDisplayName } from './gameLogic';
import { ALL_ERAS } from './eras';

export interface DailyTheme {
  type: 'category' | 'all';
  value: Category | null; // null when type is 'all'
}

/**
 * Get the daily theme based on a seed string (typically YYYY-MM-DD date)
 * Deterministically selects either a single category or "Everything" (all categories).
 * "Everything" comes up ~50% of the time; the other ~50% is split evenly across the
 * individual categories.
 */
export function getDailyTheme(seed: string): DailyTheme {
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
  if (theme.type === 'all') {
    return 'Everything';
  }
  return getCategoryDisplayName(theme.value as Category);
}

/**
 * Get the selected categories based on the daily theme
 * If theme is a single category, returns only that category
 * If theme is 'all', returns all categories
 */
export function getThemedCategories(theme: DailyTheme): Category[] {
  if (theme.type === 'all') {
    return [...ALL_CATEGORIES];
  }
  return [theme.value as Category];
}

/**
 * Get the selected eras based on the daily theme
 * Always returns all eras (daily mode no longer filters by era)
 */
export function getThemedEras(_theme: DailyTheme) {
  return [...ALL_ERAS];
}
