/**
 * Shape and structural validation for the curated-theme calendar.
 *
 * Not a route (no default export). Lives in lib/ rather than api/ because Vercel turns every
 * .ts file under api/ into its own Serverless Function and the Hobby plan caps a deployment at
 * 12 — helper files there burn the budget for nothing, while the bundler still follows imports
 * into lib/ perfectly well. src/utils/apiRoutes.test.ts fails if a non-route lands back under
 * api/.
 *
 * A curated theme is a hand-authored *pool* of event slugs pinned to explicit dates. The
 * deck builder still composes the deal order from it, so nothing here knows about decks.
 *
 * What this file deliberately does NOT do is look at the event catalogue. api/ is a separate
 * tsconfig project that cannot reach into src/, and public/events/ is served statically
 * rather than bundled into the function. Slug resolution, timeline spread and the opening
 * difficulty ramp are all checked by scripts/publish-theme.js, which runs inside the publish
 * GitHub Action with the repo checked out. This module owns only the checks that need no
 * catalogue.
 */

/** The single key holding the whole calendar. One document, so a write is atomic. */
export const CALENDAR_KEY = 'themes:calendar';

/**
 * Smallest theme we will store.
 *
 * The engine floor is lower (playerCount * handSize + 1 + playerCount * 2 = 8), but a theme
 * that thin caps everyone's score so low that the leaderboard's bots — which sample a
 * Poisson(6) correct-count — can beat every human. At 16 the human ceiling is 15 and the
 * chance of any bot exceeding it is well under 1%; lib/leaderboard/botGeneration.ts clamps
 * to the day's ceiling as well, so this is belt and braces.
 */
export const MIN_THEME_EVENTS = 16;

/**
 * Longest theme name.
 *
 * The name lands in the in-game TopBar pill beside the wordmark and in the Daily hero
 * band, neither of which has room to wrap on a 320px phone. Mirrors the
 * MAX_FRIENDLY_NAME_LENGTH precedent in src/utils/eventNameLength.ts.
 */
export const MAX_THEME_NAME_LENGTH = 20;

/**
 * Slug shape: lowercase ASCII, digits and dashes only.
 *
 * Flat rather than the tidier `[a-z0-9]+(-[a-z0-9]+)*` because that nests quantifiers and
 * trips security/detect-unsafe-regex. The security-relevant part is what it excludes — `:`
 * and uppercase — and this excludes both.
 */
const THEME_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `all` is the cache key src/utils/dailyPool.ts uses for an "Everything" day, and a `:` would
 * let an id forge the `category:x` form. Either would silently swap one day's pool for
 * another's, which is close to undebuggable from the outside.
 */
const RESERVED_THEME_IDS = new Set(['all']);

export interface CuratedTheme {
  id: string;
  name: string;
  eventNames: string[];
  dates: string[];
}

export interface ThemeCalendar {
  /** Bumped on every write; a publish carries the version it read (optimistic concurrency). */
  version: number;
  themes: CuratedTheme[];
}

export const EMPTY_CALENDAR: ThemeCalendar = { version: 0, themes: [] };

const MS_PER_HOUR = 3_600_000;

/**
 * The moment puzzle date `D` becomes playable anywhere on earth.
 *
 * The client seeds its puzzle from the player's LOCAL calendar date, so `D` opens at
 * `D 00:00` in UTC+14 — that is, `D-1 10:00Z`. See lib/leaderboard/dateWindow.ts, which
 * derives the ~50-hour submission window from the same fact.
 */
export function opensAtMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) - 14 * MS_PER_HOUR;
}

/**
 * True once *somebody* could already be playing `date`.
 *
 * Rewriting a theme past this point splits the day: two populations play different decks and
 * submit to the same leaderboard, and nothing downstream can tell them apart. It is also why
 * a past date may never be rewritten at all — src/utils/dailyRecency.ts replays the last 28
 * days to build the exclusion chain, and a retroactive edit makes it replay decks nobody saw.
 */
export function hasDateOpened(date: string, now: number): boolean {
  return now >= opensAtMs(date);
}

function validateThemeIdentity(theme: CuratedTheme, where: string, errors: string[]): void {
  if (typeof theme.id !== 'string' || !THEME_ID_PATTERN.test(theme.id)) {
    errors.push(`${where}: id must be lowercase kebab ascii, got ${JSON.stringify(theme.id)}`);
  } else if (RESERVED_THEME_IDS.has(theme.id)) {
    errors.push(`${where}: id "${theme.id}" is reserved (it collides with a pool cache key)`);
  }

  if (typeof theme.name !== 'string' || theme.name.trim().length === 0) {
    errors.push(`${where}: name must be a non-empty string`);
  } else if (theme.name.length > MAX_THEME_NAME_LENGTH) {
    errors.push(
      `${where}: name is ${theme.name.length} chars, max ${MAX_THEME_NAME_LENGTH} ("${theme.name}")`
    );
  }
}

function validateThemeEvents(theme: CuratedTheme, where: string, errors: string[]): void {
  if (!Array.isArray(theme.eventNames)) {
    errors.push(`${where}: eventNames must be an array`);
    return;
  }
  if (theme.eventNames.length < MIN_THEME_EVENTS) {
    errors.push(`${where}: has ${theme.eventNames.length} events, minimum ${MIN_THEME_EVENTS}`);
  }

  const seen = new Set<string>();
  for (const slug of theme.eventNames) {
    if (typeof slug !== 'string' || slug.length === 0) {
      errors.push(`${where}: eventNames contains a non-string entry`);
      return;
    }
    if (seen.has(slug)) errors.push(`${where}: duplicate event "${slug}"`);
    seen.add(slug);
  }
}

function validateThemeDates(theme: CuratedTheme, where: string, errors: string[]): void {
  if (!Array.isArray(theme.dates) || theme.dates.length === 0) {
    errors.push(`${where}: dates must be a non-empty array`);
    return;
  }
  for (const date of theme.dates) {
    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) {
      errors.push(`${where}: bad date ${JSON.stringify(date)}, want YYYY-MM-DD`);
    }
  }
}

function validateTheme(theme: CuratedTheme, where: string, errors: string[]): void {
  validateThemeIdentity(theme, where, errors);
  validateThemeEvents(theme, where, errors);
  validateThemeDates(theme, where, errors);
}

export interface ValidateOptions {
  now: number;
  /** Skip the "date has already opened" guard. Splits the day for UTC+13/+14 players. */
  force?: boolean;
  /** Dates already live before this write; unchanged entries are not re-checked. */
  previousDates?: ReadonlySet<string>;
}

/**
 * Structural validation of a whole calendar document. Returns every problem it finds rather
 * than the first, so one publish attempt reports the full list.
 */
export function validateCalendar(
  calendar: ThemeCalendar,
  options: ValidateOptions
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!calendar || typeof calendar !== 'object' || !Array.isArray(calendar.themes)) {
    return { ok: false, errors: ['calendar must be { version, themes: [] }'] };
  }

  const ids = new Set<string>();
  const datesSeen = new Map<string, string>();
  const previous = options.previousDates ?? new Set<string>();

  calendar.themes.forEach((theme, i) => {
    const where = `themes[${i}]${theme?.id ? ` (${theme.id})` : ''}`;
    validateTheme(theme, where, errors);

    if (theme?.id) {
      if (ids.has(theme.id)) errors.push(`${where}: duplicate theme id "${theme.id}"`);
      ids.add(theme.id);
    }

    for (const date of theme?.dates ?? []) {
      if (!DATE_PATTERN.test(String(date))) continue;

      const claimedBy = datesSeen.get(date);
      if (claimedBy) {
        errors.push(`${where}: ${date} is already claimed by "${claimedBy}"`);
      }
      datesSeen.set(date, theme.id);

      // Only newly scheduled dates are gated. A date already stored stays valid as it ages,
      // so an unrelated edit does not have to strip the calendar's history to be accepted.
      if (!previous.has(date) && !options.force && hasDateOpened(date, options.now)) {
        errors.push(
          `${where}: ${date} has already opened (it went live at ` +
            `${new Date(opensAtMs(date)).toISOString()}, UTC+14 midnight). ` +
            `Changing it now would split the day between two different decks.`
        );
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

/** Every date the calendar currently schedules. */
export function scheduledDates(calendar: ThemeCalendar): Set<string> {
  const dates = new Set<string>();
  for (const theme of calendar.themes) {
    for (const date of theme.dates ?? []) dates.add(date);
  }
  return dates;
}
