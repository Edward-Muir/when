import { Category, Era, ALL_CATEGORIES } from '../types';
import { seededRandom, stringToSeed, getCategoryDisplayName } from './gameLogic';
import { ERA_DEFINITIONS, ALL_ERAS } from './eras';

export interface DailyTheme {
  type: 'category' | 'era';
  value: Category | Era;
}

/**
 * Get the daily theme based on a seed string (typically YYYY-MM-DD date)
 * Deterministically selects either a category or an era for the day
 */
export function getDailyTheme(seed: string): DailyTheme {
  const random = seededRandom(stringToSeed(seed));
  const allOptions = [...ALL_CATEGORIES, ...ALL_ERAS]; // 14 total options
  const index = Math.floor(random() * allOptions.length);
  const value = allOptions[index];

  const isCategory = ALL_CATEGORIES.includes(value as Category);
  return {
    type: isCategory ? 'category' : 'era',
    value: value as Category | Era,
  };
}

/**
 * Get a human-readable display name for a theme
 */
export function getThemeDisplayName(theme: DailyTheme): string {
  if (theme.type === 'category') {
    return getCategoryDisplayName(theme.value as Category);
  }
  // For eras, use the friendly name from ERA_DEFINITIONS
  const eraDef = ERA_DEFINITIONS.find((e) => e.id === theme.value);
  return eraDef?.name || theme.value;
}

/**
 * Get the selected categories based on the daily theme
 * If theme is a category, returns only that category
 * If theme is an era, returns all categories
 */
export function getThemedCategories(theme: DailyTheme): Category[] {
  if (theme.type === 'category') {
    return [theme.value as Category];
  }
  return [...ALL_CATEGORIES];
}

/**
 * Get the selected eras based on the daily theme
 * If theme is an era, returns only that era
 * If theme is a category, returns all eras
 */
export function getThemedEras(theme: DailyTheme): Era[] {
  if (theme.type === 'era') {
    return [theme.value as Era];
  }
  return [...ALL_ERAS];
}
