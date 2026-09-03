import { DailyCadence, LifetimeStats } from './statsStorage';

/**
 * Pure derivations for the stats page: the calendar grid, the score buckets and the two
 * record cards. Nothing here touches storage — the panel reads the primitives once and
 * hands them in — so every shape the page draws is unit-testable with literal inputs.
 *
 * Dates are `YYYY-MM-DD` strings from `getLocalDateString`. All arithmetic on them runs in
 * the UTC frame (`Date.UTC` in, `getUTC*` out) so a step of one day is exactly one day
 * whatever the zone or the DST date — the same trap `puzzleDate.ts` documents. Never build
 * a local `Date` from one of these strings.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function utcDate(iso: string): Date {
  const [y, m, d] = parts(iso);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** `iso` moved by `days` whole days. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = parts(iso);
  return toIso(new Date(Date.UTC(y, m - 1, d + days)));
}

/** "2026-06-28" -> "28 Jun". Junk passes through unchanged. */
export function formatShortDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [, m, d] = parts(iso);
  return `${d} ${MONTHS.at(m - 1) ?? ''}`.trim();
}

/** "2026-08-14" -> "Fri 14 Aug". */
export function formatWeekdayDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return `${WEEKDAYS.at(utcDate(iso).getUTCDay())} ${formatShortDate(iso)}`;
}

/** Days since the Monday of `iso`'s week: Monday 0 … Sunday 6. */
function daysIntoWeek(iso: string): number {
  return (utcDate(iso).getUTCDay() + 6) % 7;
}

export interface HeatCell {
  date: string;
  played: boolean;
  /** Achievement ids unlocked on this day. */
  badgeIds: string[];
  isToday: boolean;
  /** After today: drawn blank so the current week keeps its shape. */
  isFuture: boolean;
}

export interface HeatmapModel {
  /** Columns, oldest first; each is Monday to Sunday. */
  weeks: HeatCell[][];
  /**
   * Month name over the first column that touches a new month. A label that would sit
   * within two columns of the previous one replaces it rather than colliding with it.
   */
  monthLabels: { col: number; label: string }[];
  todayCol: number;
}

export interface HeatmapInput {
  playedDates: string[];
  /** `Achievements.unlocked`: id -> unlock date. */
  unlocked: Record<string, string>;
  firstPlayedDate?: string;
  today: string;
  /** Never more than this many columns. */
  maxWeeks?: number;
  /** Never fewer, so a new player sees a strip rather than a stub. */
  minWeeks?: number;
}

/**
 * The calendar as columns of weeks, ending on the week that holds today. Starts at the
 * earliest date the player has any trace of (first game, first daily, first badge),
 * clamped between `minWeeks` and `maxWeeks` back from today, and snapped to a Monday.
 */
export function buildHeatmapWeeks(input: HeatmapInput): HeatmapModel {
  const { playedDates, unlocked, firstPlayedDate, today, maxWeeks = 53, minWeeks = 20 } = input;

  const badgesByDate = new Map<string, string[]>();
  for (const [id, date] of Object.entries(unlocked)) {
    badgesByDate.set(date, [...(badgesByDate.get(date) ?? []), id]);
  }
  const played = new Set(playedDates);

  const traces = [...playedDates, ...badgesByDate.keys(), firstPlayedDate ?? ''].filter(
    (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today
  );
  const earliestTrace = traces.length ? traces.reduce((a, b) => (a < b ? a : b)) : today;
  const oldestAllowed = addDays(today, -(maxWeeks - 1) * 7);
  const youngestAllowed = addDays(today, -(minWeeks - 1) * 7);
  const clamped =
    earliestTrace < oldestAllowed
      ? oldestAllowed
      : earliestTrace > youngestAllowed
        ? youngestAllowed
        : earliestTrace;
  const start = addDays(clamped, -daysIntoWeek(clamped));
  const end = addDays(today, 6 - daysIntoWeek(today));

  const weeks: HeatCell[][] = [];
  const monthLabels: HeatmapModel['monthLabels'] = [];
  let todayCol = 0;
  let lastMonth = -1;
  for (let monday = start; monday <= end; monday = addDays(monday, 7)) {
    const col = weeks.length;
    const month = utcDate(addDays(monday, 6)).getUTCMonth();
    if (month !== lastMonth) {
      const previous = monthLabels.at(-1);
      if (previous && col - previous.col < 3) monthLabels.pop();
      monthLabels.push({ col, label: MONTHS.at(month) ?? '' });
      lastMonth = month;
    }
    const week: HeatCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i);
      if (date === today) todayCol = col;
      week.push({
        date,
        played: played.has(date),
        badgeIds: badgesByDate.get(date) ?? [],
        isToday: date === today,
        isFuture: date > today,
      });
    }
    weeks.push(week);
  }
  return { weeks, monthLabels, todayCol };
}

/** The game-over tiers (`GamePopup`) spread a little wider, so a regular player's days are not all in the top bar. */
export const SCORE_BUCKETS = [
  { label: '0–3', min: 0, max: 3 },
  { label: '4–7', min: 4, max: 7 },
  { label: '8–12', min: 8, max: 12 },
  { label: '13–17', min: 13, max: 17 },
  { label: '18+', min: 18, max: Infinity },
] as const;

export interface ScoreBucket {
  label: string;
  count: number;
  /** Today's daily landed here. */
  isToday: boolean;
}

/** Daily results per tier, from `dailyCorrectHistogram` (index = events placed). */
export function scoreBuckets(histogram: number[], todayCorrect?: number): ScoreBucket[] {
  return SCORE_BUCKETS.map(({ label, min, max }) => {
    let count = 0;
    histogram.forEach((days, correct) => {
      if (correct >= min && correct <= max) count += days || 0;
    });
    const isToday = todayCorrect !== undefined && todayCorrect >= min && todayCorrect <= max;
    return { label, count, isToday };
  });
}

/** Mean events placed per daily, or null before the first daily. */
export function dailyAverage(cadence: DailyCadence): number | null {
  const days = cadence.playedDates.length;
  return days > 0 ? cadence.dailyCorrectSum / days : null;
}

export interface Records {
  longestTimeline: number;
  bestStreak: number;
  longestDailyRun: number;
  bestDailyScore: number;
}

/** The four personal bests, each the max across daily and custom play where both exist. */
export function recordsFrom(lifetime: LifetimeStats, cadence: DailyCadence): Records {
  return {
    longestTimeline: Math.max(lifetime.longestTimeline.daily, lifetime.longestTimeline.suddenDeath),
    bestStreak: Math.max(lifetime.bestInGameStreakEver, lifetime.bestCustomStreakEver),
    longestDailyRun: cadence.maxDailyStreak,
    bestDailyScore: cadence.bestDailyCorrect,
  };
}

export interface Lifetime {
  gamesPlayed: number;
  dailyGames: number;
  eventsPlaced: number;
  /** One decimal place; null before the first game. */
  averageTimeline: number | null;
}

/** The volume numbers: totals over every game ever recorded. */
export function lifetimeFrom(lifetime: LifetimeStats, cadence: DailyCadence): Lifetime {
  const gamesPlayed = lifetime.gamesPlayed.daily + lifetime.gamesPlayed.suddenDeath;
  const timelineSum = lifetime.timelineLengthSum.daily + lifetime.timelineLengthSum.suddenDeath;
  return {
    gamesPlayed,
    dailyGames: cadence.playedDates.length,
    eventsPlaced: lifetime.eventsPlacedCorrect,
    averageTimeline: gamesPlayed > 0 ? Math.round((timelineSum / gamesPlayed) * 10) / 10 : null,
  };
}
