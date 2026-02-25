import { Category, ALL_CATEGORIES } from '../types';
import { seededRandom, stringToSeed, getCategoryDisplayName } from './gameLogic';
import { ALL_ERAS } from './eras';

export interface DailyTheme {
  type: 'category' | 'all';
  value: Category | null; // null when type is 'all'
}

/**
 * Get the daily theme based on a seed string (typically YYYY-MM-DD date)
 * Deterministically selects either a single category or "Everything" (all categories)
 * "Everything" has 2x the probability of any single category (25% vs 12.5% each)
 */
export function getDailyTheme(seed: string): DailyTheme {
  const random = seededRandom(stringToSeed(seed));
  // Weighted selection: categories (weight 1 each) + "Everything" (weight 2)
  const totalWeight = ALL_CATEGORIES.length + 2;
  const roll = Math.floor(random() * totalWeight);

  if (roll >= ALL_CATEGORIES.length) {
    // "Everything" - 2/totalWeight chance (~25%)
    return { type: 'all', value: null };
  } else {
    // Single category
    // eslint-disable-next-line security/detect-object-injection
    return { type: 'category', value: ALL_CATEGORIES[roll] };
  }
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
