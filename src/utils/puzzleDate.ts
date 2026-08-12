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
