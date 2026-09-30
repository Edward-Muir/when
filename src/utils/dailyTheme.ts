import { Category, ALL_CATEGORIES } from '../types';
import { seededRandom, stringToSeed, getCategoryDisplayName } from './gameLogic';
import { ALL_ERAS } from './eras';
import { CuratedTheme, getCuratedThemeForDate } from './curatedThemes';
import { ALL_REGIONS, countryMacros, isRegionName } from './regions';
import menu from '../data/dailyThemeMenu.json';

export type DailyTheme =
  | { type: 'all'; value: null }
  | { type: 'category'; value: Category }
  /** A region ("East Asia") or a country ("Italy"), told apart by the taxonomy. */
  | { type: 'place'; value: null; place: string }
  /** A category within a place: "Art in Italy". */
  | { type: 'mix'; value: Category; place: string }
  | { type: 'curated'; value: null; curated: CuratedTheme };

/** Integer shares of the seeded days; only their ratio matters. */
interface MenuWeights {
  all: number;
  category: number;
  region: number;
  country: number;
  mix: number;
}

/**
 * One frozen menu the seeded daily draws from, in force from `from` until the next epoch.
 * Written by scripts/daily-theme-menu.js, which applies the size and easy-card gates.
 */
export interface MenuEpoch {
  from: string;
  weights: MenuWeights;
  categories: string[];
  regions: string[];
  countries: string[];
  mixes: string[][];
}

export const MENU_EPOCHS: readonly MenuEpoch[] = menu.epochs;

/** The epoch in force on `seed`, or undefined before the first (the original generator). */
export function menuEpochFor(seed: string): MenuEpoch | undefined {
  let found: MenuEpoch | undefined;
  for (const epoch of MENU_EPOCHS) {
    if (epoch.from <= seed) found = epoch;
  }
  return found;
}

/**
 * Get the daily theme based on a seed string (typically YYYY-MM-DD date)
 *
 * A hand-authored theme scheduled for this date wins. Otherwise the day is derived
 * deterministically from the seed, by one of two generators chosen by date:
 *
 * - Before the first menu epoch, the original one: "Everything" ~50% of the time, the rest
 *   split evenly across the categories. It must never change, because past days are replayed
 *   by the recency chain and shown in stored results.
 * - From an epoch's `from` date, a draw from that epoch's frozen menu (see `menuTheme`).
 *
 * The curated lookup happens BEFORE the RNG is touched, and must stay there. Every future
 * day's theme is a function of how many random numbers have been drawn from the seed, so a
 * curated check that consumed one would silently re-theme every ordinary day — the same
 * failure mode as adding the 21st category, which re-rolled a year of dates (see
 * docs/leaderboard-daily). Returning early consumes nothing. The dated menu exists for the
 * same reason: a change to what can be drawn applies only from a date nobody has played.
 */
export function getDailyTheme(seed: string): DailyTheme {
  const curated = getCuratedThemeForDate(seed);
  if (curated) return { type: 'curated', value: null, curated };

  const random = seededRandom(stringToSeed(seed));
  const epoch = menuEpochFor(seed);
  return epoch ? menuTheme(epoch, random) : legacyTheme(random);
}

/** The original generator, for every date before the first menu epoch. Frozen. */
function legacyTheme(random: () => number): DailyTheme {
  // ~50% "Everything", ~50% a single random category.
  if (random() < 0.5) {
    return { type: 'all', value: null };
  }

  const idx = Math.floor(random() * ALL_CATEGORIES.length);
  // eslint-disable-next-line security/detect-object-injection
  return { type: 'category', value: ALL_CATEGORIES[idx] };
}

type MenuKind = keyof MenuWeights;
const MENU_KINDS: readonly MenuKind[] = ['all', 'category', 'region', 'country', 'mix'];

function kindSize(epoch: MenuEpoch, kind: MenuKind): number {
  if (kind === 'all') return 1;
  if (kind === 'category') return epoch.categories.length;
  if (kind === 'region') return epoch.regions.length;
  if (kind === 'country') return epoch.countries.length;
  return epoch.mixes.length;
}

/**
 * A draw from a frozen menu: one random number picks the kind by weight, a second picks the
 * entry within it. An empty kind gets no share rather than a slot it cannot fill.
 */
function menuTheme(epoch: MenuEpoch, random: () => number): DailyTheme {
  const kinds = MENU_KINDS.filter((k) => kindSize(epoch, k) > 0);
  // eslint-disable-next-line security/detect-object-injection -- k is a MenuKind
  const weightOf = (k: MenuKind) => epoch.weights[k];
  const total = kinds.reduce((sum, k) => sum + weightOf(k), 0);
  let remaining = random() * total;
  let kind = kinds[kinds.length - 1];
  for (const k of kinds) {
    remaining -= weightOf(k);
    if (remaining < 0) {
      kind = k;
      break;
    }
  }

  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)];
  if (kind === 'all') return { type: 'all', value: null };
  if (kind === 'category') return { type: 'category', value: pick(epoch.categories) as Category };
  if (kind === 'region') return { type: 'place', value: null, place: pick(epoch.regions) };
  if (kind === 'country') return { type: 'place', value: null, place: pick(epoch.countries) };
  const [category, place] = pick(epoch.mixes);
  return { type: 'mix', value: category as Category, place };
}

/**
 * Taxonomy names that read with "the" after "in": "Art in the United States". Covers every
 * such name in src/data/regions.json, not just today's menu, so a later epoch needs no edit.
 */
export const PLACES_WITH_THE: ReadonlySet<string> = new Set([
  'Middle East & North Africa',
  'Bahamas',
  'Central African Republic',
  'Democratic Republic of the Congo',
  'Dominican Republic',
  'Falkland Islands',
  'Faroe Islands',
  'Gambia',
  'Maldives',
  'Marshall Islands',
  'Netherlands',
  'Philippines',
  'Republic of the Congo',
  'Solomon Islands',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
]);

/**
 * Get a human-readable display name for a theme
 */
export function getThemeDisplayName(theme: DailyTheme): string {
  if (theme.type === 'curated') return theme.curated.name;
  if (theme.type === 'all') return 'Everything';
  if (theme.type === 'place') return theme.place;
  const category = getCategoryDisplayName(theme.value);
  if (theme.type === 'category') return category;
  return `${category} in ${PLACES_WITH_THE.has(theme.place) ? 'the ' : ''}${theme.place}`;
}

/**
 * Get the selected categories based on the daily theme
 * If theme is a single category (or a category within a place), returns only that category
 * Otherwise returns all categories
 *
 * A curated theme returns every category too. Its pool is an explicit list of events rather
 * than anything a category filter could express, so for a curated day this value is
 * informational only — `buildDailyPool` supplies the real pool, and `useWhenGame` routes the
 * daily through it rather than re-deriving one from these filters.
 */
export function getThemedCategories(theme: DailyTheme): Category[] {
  if (theme.type === 'category' || theme.type === 'mix') return [theme.value];
  return [...ALL_CATEGORIES];
}

/**
 * The region filter a theme implies, in the shape the Custom page's filter takes
 * (`filterByRegion`): a region theme selects that region; a country theme selects the
 * region(s) it sits in and picks the country, which narrows them to it. Anything else is
 * every region and no countries, which `filterByRegion` treats as no filter at all.
 */
export function getThemedPlaces(theme: DailyTheme): { regions: string[]; countries: string[] } {
  if (theme.type === 'place' || theme.type === 'mix') {
    if (isRegionName(theme.place)) return { regions: [theme.place], countries: [] };
    return { regions: countryMacros(theme.place), countries: [theme.place] };
  }
  return { regions: [...ALL_REGIONS], countries: [] };
}

/**
 * Get the selected eras based on the daily theme
 * Always returns all eras (daily mode no longer filters by era)
 */
export function getThemedEras(_theme: DailyTheme) {
  return [...ALL_ERAS];
}
