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
 * Longest intro blurb and fact.
 *
 * Both are read in the intro popup before the first card is dragged, so they are sized to sit
 * in its 340px column on a 320px phone without scrolling: a one-sentence plaque line and a
 * one- or two-sentence fact. The copy rules (no dates, no bookends) are the publish script's,
 * since the date check is shared with the event catalogue's.
 */
export const MAX_THEME_BLURB_LENGTH = 120;
export const MAX_THEME_FACT_LENGTH = 200;

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

/**
 * The popup a curated game opens with. Display-only: nothing that composes or judges a deck
 * reads it, so editing it after a date has opened re-deals nothing.
 */
export interface ThemeIntro {
  /** One sentence stating the theme's scope. */
  blurb: string;
  /** One surprising, specific detail. */
  fact: string;
}

export interface CuratedTheme {
  id: string;
  name: string;
  eventNames: string[];
  dates: string[];
  intro?: ThemeIntro;
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

function validateIntroPart(
  value: unknown,
  label: string,
  max: number,
  where: string,
  errors: string[]
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${where}: intro.${label} must be a non-empty string`);
  } else if (value !== value.trim()) {
    errors.push(`${where}: intro.${label} has leading or trailing whitespace`);
  } else if (value.length > max) {
    errors.push(`${where}: intro.${label} is ${value.length} chars, max ${max}`);
  }
}

function validateThemeIntro(theme: CuratedTheme, where: string, errors: string[]): void {
  if (theme.intro === undefined) return;
  if (!theme.intro || typeof theme.intro !== 'object') {
    errors.push(`${where}: intro must be { blurb, fact }`);
    return;
  }
  validateIntroPart(theme.intro.blurb, 'blurb', MAX_THEME_BLURB_LENGTH, where, errors);
  validateIntroPart(theme.intro.fact, 'fact', MAX_THEME_FACT_LENGTH, where, errors);
}

function validateTheme(theme: CuratedTheme, where: string, errors: string[]): void {
  validateThemeIdentity(theme, where, errors);
  validateThemeEvents(theme, where, errors);
  validateThemeDates(theme, where, errors);
  validateThemeIntro(theme, where, errors);
}

export interface ValidateOptions {
  now: number;
  /** Skip the "date has already opened" guard. Splits the day for UTC+13/+14 players. */
  force?: boolean;
  /** Dates already live before this write; unchanged entries are not re-checked. */
  previousDates?: ReadonlySet<string>;
  /** The stored themes before this write, for the opened-theme lock. */
  previousThemes?: readonly CuratedTheme[];
}

function sameList(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((value, i) => value === b.at(i));
}

/**
 * A theme someone may already have played keeps its deck. Once any of a stored theme's dates
 * has opened, a write that keeps its id may change its intro and add or drop unopened dates,
 * but not its name, its events, or an opened date: changing those would split a day already
 * being played, and `dailyRecency.ts` would replay decks nobody was dealt. Removing the theme
 * outright is the publish workflow's separate `remove` input, and is not gated here.
 */
function validateOpenedThemeLock(
  incoming: CuratedTheme,
  stored: CuratedTheme | undefined,
  now: number,
  where: string,
  errors: string[]
): void {
  const opened = (stored?.dates ?? []).filter((date) => hasDateOpened(date, now));
  if (!stored || opened.length === 0) return;

  const why = `once a date has opened only its intro and unopened dates may change`;
  if (incoming.name !== stored.name) {
    errors.push(`${where}: name changed from "${stored.name}", but ${why}`);
  }
  if (!sameList(incoming.eventNames, stored.eventNames)) {
    errors.push(`${where}: eventNames changed, but ${why}`);
  }
  const dropped = opened.filter((date) => !(incoming.dates ?? []).includes(date));
  if (dropped.length > 0) {
    errors.push(`${where}: opened date(s) ${dropped.join(', ')} dropped, but ${why}`);
  }
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
  const storedById = new Map((options.previousThemes ?? []).map((t) => [t.id, t]));

  calendar.themes.forEach((theme, i) => {
    const where = `themes[${i}]${theme?.id ? ` (${theme.id})` : ''}`;
    validateTheme(theme, where, errors);
    if (theme?.id && !options.force) {
      validateOpenedThemeLock(theme, storedById.get(theme.id), options.now, where, errors);
    }

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
