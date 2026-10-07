import {
  GameConfig,
  HistoricalEvent,
  WhenGameState,
  ALL_CATEGORIES,
  DEFAULT_DIFFICULTIES,
} from '../types';
import { ALL_ERAS } from './eras';
import { DAILY_HAND_SIZE } from './dailyConfig';
import { buildCuratedPool } from './dailyPool';
import { CuratedTheme, getCuratedThemeForDate, listCuratedThemes } from './curatedThemes';
import { DailyTheme, getDailyTheme } from './dailyTheme';
import { dayDiff, getDailyPuzzleNumber } from './puzzleDate';
import { addDays } from './statsDerived';
import type { GameRecord } from './gameHistory';
import { buildThemeReplayConfig, REPLAY_MIN_POOL } from './themeReplay';

/**
 * Playing a past day's daily from the Archive.
 *
 * The Archive lists every daily from the last `ARCHIVE_DAYS` days on the game's own
 * timeline, and any past one can be played. Like a replay of a curated theme, a past day
 * runs as a `suddenDeath` game, never as a `daily` with an old seed: the daily's stored
 * result, board, in-progress save, leaderboard and reminder are all single slots holding
 * *today's* game, and the leaderboard accepts yesterday's date, so a past day dealt as a
 * daily would overwrite today's result or post to a board it was never played on.
 * `GameConfig.dailyReplayDate` names the day instead.
 *
 * What the day deals:
 * - **An ordinary day** deals that date's own deck, `buildDailyDeck(date)`, rebuilt from
 *   today's catalogue, so it can differ slightly from the deck dealt on the day. Accepted:
 *   the point is to play the day, not to reproduce it.
 * - **A curated day** deals the reshuffled replay of the whole theme, so its "High score"
 *   stays a placement test rather than a memory test (see `themeReplay.ts`). A theme whose
 *   resolved pool has fallen under `REPLAY_MIN_POOL` deals the date's deck instead, which is
 *   what the day itself dealt through the curated escape hatches.
 *
 * A **missed** day then counts as that day's daily in the stats, so it rejoins the daily
 * run; a day already played is practice and leaves the day's record alone. That split
 * happens once, in the recorder, through `asRecordedDaily`.
 */

/** How many days the Archive lists, today included. */
export const ARCHIVE_DAYS = 30;

/** A day the Archive offers to play: one of the listed days before today. */
export function isReplayableDay(date: string, today: string): boolean {
  return date < today && dayDiff(date, today) < ARCHIVE_DAYS;
}

export type ArchiveDayStatus =
  /** A past day: playable. */
  | 'replayable'
  /** Today: the ordinary daily while unplayed, then replayable from tomorrow. */
  | 'today'
  /** The next scheduled curated deck, teased but not yet playable. */
  | 'upcoming';

/** One row of the Archive. */
export interface ArchiveDay {
  date: string;
  theme: DailyTheme;
  /** The curated theme, on a curated day. */
  curated?: CuratedTheme;
  status: ArchiveDayStatus;
  /** In `playedDates`: played on the day, or filled in from the Archive since. */
  played: boolean;
  /** Curated days: the events the theme resolves to in the current catalogue. */
  cardCount?: number;
}

/**
 * The Archive's rows, oldest first: each of the last `ARCHIVE_DAYS` days ending today
 * (never before the first puzzle), then the next scheduled curated deck as a locked teaser.
 * The rest of the calendar stays hidden so it is teased rather than laid bare.
 */
export function getArchiveDays(
  allEvents: HistoricalEvent[],
  today: string,
  playedDates: string[]
): ArchiveDay[] {
  const played = new Set(playedDates);
  const row = (date: string, status: ArchiveDayStatus): ArchiveDay => {
    const theme = getDailyTheme(date);
    const curated = theme.type === 'curated' ? theme.curated : undefined;
    return {
      date,
      theme,
      status,
      played: played.has(date),
      ...(curated && { curated, cardCount: buildCuratedPool(allEvents, curated).length }),
    };
  };

  const days: ArchiveDay[] = [];
  for (let back = ARCHIVE_DAYS - 1; back >= 0; back--) {
    const date = addDays(today, -back);
    if (getDailyPuzzleNumber(date) === null) continue;
    days.push(row(date, back === 0 ? 'today' : 'replayable'));
  }

  let upcoming: string | undefined;
  for (const theme of listCuratedThemes()) {
    for (const date of theme.dates ?? []) {
      if (date > today && (!upcoming || date < upcoming)) upcoming = date;
    }
  }
  if (upcoming) days.push(row(upcoming, 'upcoming'));
  return days;
}

/**
 * The most events placed in any game of `date`: that day's daily record (played on the
 * day or filled in later) and every practice replay of it. Undefined when none is recorded.
 */
export function dayBest(history: GameRecord[], date: string): number | undefined {
  let best: number | undefined;
  for (const record of history) {
    const ofDay = record.mode === 'daily' ? record.date === date : record.replayOf === date;
    if (ofDay) best = Math.max(best ?? 0, record.correct.length);
  }
  return best;
}

/** The GameConfig that plays `date`'s daily as a past day (see the module comment). */
export function buildDayReplayConfig(date: string, allEvents: HistoricalEvent[]): GameConfig {
  const theme = getCuratedThemeForDate(date);
  if (theme && buildCuratedPool(allEvents, theme).length >= REPLAY_MIN_POOL) {
    return { ...buildThemeReplayConfig(theme), dailyReplayDate: date };
  }
  return {
    mode: 'suddenDeath',
    selectedDifficulties: [...DEFAULT_DIFFICULTIES],
    selectedCategories: [...ALL_CATEGORIES],
    selectedEras: [...ALL_ERAS],
    dailyReplayDate: date,
    playerCount: 1,
    playerNames: ['Player 1'],
    cardsPerHand: DAILY_HAND_SIZE,
    suddenDeathHandSize: DAILY_HAND_SIZE,
  };
}

/**
 * The finished game as the stats should record it. A past day the player missed is
 * recorded as that day's daily: the mode becomes `daily` and the replay date becomes the
 * `dailySeed`, so the cadence, the daily buckets, the per-game history and the milestones
 * all key on the replayed date with no change to their signatures. Anything else, a day
 * already played included, is returned untouched and records as an ordinary replay.
 *
 * Only the recorder calls this. The live game state never changes mode, which is what keeps
 * the daily-only single slots (result, board, progress, leaderboard) out of reach.
 */
export function asRecordedDaily(state: WhenGameState, playedDates: string[]): WhenGameState {
  const date = state.lastConfig?.dailyReplayDate;
  if (!date || !state.lastConfig || playedDates.includes(date)) return state;
  return {
    ...state,
    gameMode: 'daily',
    lastConfig: { ...state.lastConfig, dailySeed: date },
  };
}
