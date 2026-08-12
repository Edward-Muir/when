/**
 * Which puzzle dates the server will accept right now.
 *
 * The client seeds its puzzle from the player's LOCAL calendar date (see
 * src/utils/puzzleDate.ts), so a single date string `D` is legitimately in play across a
 * ~50-hour wall-clock span: it opens at `D 00:00` in UTC+14 (= `D-1 10:00Z`) and closes at
 * `D 23:59` in UTC-12 (= `D+1 11:59Z`). Both extremes sit inside `utcToday ± 1`, which is
 * why an exact `body.date === utcToday` match — what this replaced — rejected honest
 * submissions from most of the planet for most of the day.
 *
 * Duplicated rather than imported from src/: api/ is a separate tsconfig project that
 * cannot reach into src/ (same reason submit.ts keeps its own getDailyTheme/seededRandom).
 * Unit-tested from src/utils/dateWindow.test.ts — CRA's Jest only roots there.
 */

const DAY_MS = 86_400_000;

/**
 * TTL for the `submission:{date}:{deviceId}` dedupe keys, in seconds.
 *
 * Must outlive the ~50-hour span above, or the guard expires while the date is still
 * accepted and a device can submit to the same board twice. 72h leaves clear headroom.
 * Shared by submit.ts and botGeneration.ts so the two can never drift apart — they were
 * both on 25h, which was correct only while dates were UTC.
 */
export const SUBMISSION_DEDUPE_TTL_SECONDS = 72 * 60 * 60;

/** UTC calendar date as `YYYY-MM-DD`. Deliberately UTC: this is the server's own clock. */
function utcDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * True when `date` is a well-formed `YYYY-MM-DD` that some timezone could currently be
 * calling today — i.e. within one day either side of the server's UTC date.
 */
export function isDateWithinSubmissionWindow(date: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const nowMs = now.getTime();
  for (let offset = -1; offset <= 1; offset++) {
    if (date === utcDateString(new Date(nowMs + offset * DAY_MS))) return true;
  }
  return false;
}
