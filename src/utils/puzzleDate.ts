/**
 * The puzzle day, keyed to the player's calendar rather than Greenwich's.
 *
 * Every "puzzle day" boundary in the game runs through here: the daily seed, the
 * already-played check, the daily-streak cadence, the rollover timers, and the iOS
 * reminder copy.
 *
 * Never derive a puzzle date from `toISOString()`. That yields the UTC date, which rolls
 * over at 5pm in Los Angeles, 8pm in New York and 10am in Sydney — so an LA player who
 * plays at 4pm and again at 6pm is, in UTC, playing two different days (two puzzles two
 * hours apart, and a streak that increments twice in one evening), while an "after dinner"
 * player drifts across the boundary and silently loses a streak on a day they didn't miss.
 */

/** Local calendar date as `YYYY-MM-DD`. */
export function getLocalDateString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Milliseconds until the next local midnight — for scheduling the day-rollover timers.
 *
 * Built by local-calendar construction, deliberately not `DAY_MS - (now % DAY_MS)`: that
 * modulo measures to the next *UTC* midnight, and even offset-corrected it would be wrong
 * on the two DST days a year, which are 23 and 25 hours long. Constructing the next day's
 * midnight from local fields lets the Date constructor resolve the real instant.
 * Mirrors the same approach as `getNext8amDates` in `dailyReminder.ts`.
 */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

/**
 * Whole-day difference between two `YYYY-MM-DD` strings (b - a).
 *
 * Both operands parse as UTC midnight, so the difference stays exact whichever zone
 * produced the strings — what matters is only that callers pass dates from the same
 * source (i.e. `getLocalDateString`, never a mix of local and UTC).
 */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/**
 * The first daily puzzle, and therefore puzzle #1. v1.0.0 shipped on this date.
 *
 * Moving it renumbers every puzzle retroactively, which breaks the one thing the number is
 * for — two people comparing "did you do #49?". Treat it as immutable.
 */
const DAILY_EPOCH = '2026-06-28';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2026-08-15" -> 49. The share's puzzle identifier, replacing the date it used to print.
 *
 * A number rather than a date because a shared image is a forwardable object: "Aug 15" is
 * stale by the next morning and duplicates the timestamp the chat app already stamps on
 * the bubble, while "#49" is a reference point two players can compare with no shelf life.
 * Same reasoning as `Connections #768`.
 *
 * Returns null for anything unparseable or before the epoch, so callers can fall back to a
 * numberless label rather than printing "#NaN" or "#-3". `formatShareDate` takes the same
 * pass-through stance on junk input.
 *
 * `dayDiff` is the whole implementation: `Date.parse` reads a bare `YYYY-MM-DD` as UTC
 * midnight, so both operands land in the same frame and the delta is exact — including
 * across the two DST days a year, which is exactly what hand-rolled local-date arithmetic
 * gets wrong here (see the header note, and `formatShareDate` in `share.ts` for the same
 * trap in its display form).
 */
export function getDailyPuzzleNumber(isoDate: string): number | null {
  if (!ISO_DATE.test(isoDate)) return null;
  const days = dayDiff(DAILY_EPOCH, isoDate);
  if (!Number.isFinite(days) || days < 0) return null;
  return days + 1;
}
