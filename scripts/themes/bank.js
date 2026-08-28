/**
 * The theme bank, and the date arithmetic for scheduling it.
 *
 * `themes/bank.json` holds the hand-authored decks — id, name and slug list, and nothing
 * else. Dates are deliberately NOT in the file: a deck is a fixed thing, a schedule is not,
 * and keeping them apart means re-running the same bank on a different start date is a
 * dispatch input rather than a commit.
 *
 * The bank is publish *input*, not a runtime source. The calendar still lives in exactly one
 * place — `themes:calendar` in Redis — so a theme can never be half-published; see
 * docs/curated-themes/index.md. Nothing the client loads reads this file.
 *
 * **Bank order is meaningful.** Themes are scheduled in the order they appear here, and the
 * seven-day no-repeat filter (src/utils/dailyRecency.ts, RECENCY_DAYS = 7) means a weekly
 * cadence tests each deck against its immediate predecessor — exactly 7 days back is inside
 * the window. Two adjacent decks sharing a card would silently shrink the second one, so the
 * order is kept adjacent-disjoint and src/utils/themeBank.test.ts fails if that stops holding.
 *
 * Dependency-free CommonJS, like the rest of scripts/themes: the publish workflow runs these
 * with a bare `node` and no `npm ci`.
 */

const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, '..', '..', 'themes', 'bank.json');

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Every deck in the bank, in scheduling order. */
function loadBank() {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed path
  const parsed = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
  if (!Array.isArray(parsed.themes)) throw new Error('themes/bank.json: expected { themes: [] }');
  return parsed.themes;
}

/**
 * Pick decks out of the bank. `all` takes every deck in bank order; a list takes exactly the
 * ids given, in the order given, so a caller can reorder a run without editing the bank.
 */
function selectThemes(bank, spec) {
  const wanted = String(spec || '')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (wanted.length === 1 && wanted[0] === 'all') return [...bank];

  const byId = new Map(bank.map((theme) => [theme.id, theme]));
  const unknown = wanted.filter((id) => !byId.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `not in themes/bank.json: ${unknown.join(', ')}\n` +
        `   available: ${bank.map((t) => t.id).join(', ')}`
    );
  }
  return wanted.map((id) => byId.get(id));
}

/** Shift a `YYYY-MM-DD` string by whole days. Parsed as UTC, so DST cannot skew it. */
function addDays(date, delta) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + delta * MS_PER_DAY).toISOString().slice(0, 10);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Weekday name of a `YYYY-MM-DD` string, for the run log — a schedule is easy to typo. */
function weekdayOf(date) {
  return WEEKDAYS[new Date(Date.parse(`${date}T00:00:00Z`)).getUTCDay()];
}

/** One date per theme: `start`, then every `everyDays` after it, in the order given. */
function assignDates(themes, start, everyDays) {
  if (!DATE_PATTERN.test(String(start)) || Number.isNaN(Date.parse(`${start}T00:00:00Z`))) {
    throw new Error(`start must be a real YYYY-MM-DD date, got ${JSON.stringify(start)}`);
  }
  const step = Number(everyDays);
  if (!Number.isInteger(step) || step < 1) {
    throw new Error(`everyDays must be a positive whole number, got ${JSON.stringify(everyDays)}`);
  }
  return themes.map((theme, i) => ({ ...theme, dates: [addDays(start, i * step)] }));
}

/**
 * The moment puzzle date `D` becomes playable anywhere on earth.
 *
 * Mirrors opensAtMs in lib/themes/schema.ts — the client seeds from the player's LOCAL
 * calendar date, so `D` opens at midnight in UTC+14. src/utils/themeBank.test.ts asserts the
 * two agree; this copy exists because lib/ is TypeScript and this runs under a bare `node`.
 */
function opensAtMs(date) {
  return Date.parse(`${date}T00:00:00Z`) - 14 * MS_PER_HOUR;
}

function hasDateOpened(date, now) {
  return now >= opensAtMs(date);
}

/**
 * Fold themes into a calendar document, replacing any deck with the same id.
 *
 * Dates that have already opened are **kept**, even when the incoming theme does not list
 * them. Rewriting a past date is the one thing the calendar must never do: dailyRecency
 * replays the last 28 days to build its exclusion chain, so dropping a date a deck really
 * ran on makes the following week exclude cards nobody saw. Re-running a deck on new dates
 * is therefore additive; removing it entirely is what THEME_REMOVE is for.
 */
function mergeThemes(calendar, themes, now) {
  const incoming = new Map(themes.map((theme) => [theme.id, theme]));
  const kept = (calendar.themes ?? []).map((stored) => {
    const next = incoming.get(stored.id);
    if (!next) return stored;
    const opened = (stored.dates ?? []).filter((date) => hasDateOpened(date, now));
    const dates = [...new Set([...opened, ...(next.dates ?? [])])].sort();
    incoming.delete(stored.id);
    return { ...next, dates };
  });
  return { ...calendar, themes: [...kept, ...incoming.values()] };
}

/** Drop a deck by id. */
function removeTheme(calendar, removeId) {
  return { ...calendar, themes: (calendar.themes ?? []).filter((t) => t.id !== removeId) };
}

module.exports = {
  BANK_PATH,
  addDays,
  assignDates,
  hasDateOpened,
  loadBank,
  mergeThemes,
  opensAtMs,
  removeTheme,
  selectThemes,
  weekdayOf,
};
