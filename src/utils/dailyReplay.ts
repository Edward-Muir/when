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
import { getCuratedThemeForDate } from './curatedThemes';
import { buildThemeReplayConfig, REPLAY_MIN_POOL } from './themeReplay';

/**
 * Playing a past day's daily from the Archive calendar.
 *
 * Like an Archive replay of a curated theme, a past day runs as a `suddenDeath` game, never
 * as a `daily` with an old seed: the daily's stored result, board, in-progress save,
 * leaderboard and reminder are all single slots holding *today's* game, and the leaderboard
 * accepts yesterday's date, so a past day dealt as a daily would overwrite today's result or
 * post to a board it was never played on. `GameConfig.dailyReplayDate` names the day instead.
 *
 * What the day deals:
 * - **An ordinary day** deals that date's own deck, `buildDailyDeck(date)`, rebuilt from
 *   today's catalogue, so it can differ slightly from the deck dealt on the day. Accepted:
 *   the point is to play the day, not to reproduce it.
 * - **A curated day** deals the Archive's reshuffled replay of the whole theme, so its
 *   "High score" stays a placement test rather than a memory test (see `themeReplay.ts`).
 *   A theme whose resolved pool has fallen under `REPLAY_MIN_POOL` deals the date's deck
 *   instead, which is what the day itself dealt through the curated escape hatches.
 *
 * A **missed** day then counts as that day's daily in the stats, so it fills the calendar
 * and rejoins the daily run; a day already played is practice and leaves the day's record
 * alone. That split happens once, in the recorder, through `asRecordedDaily`.
 */

/** The first day the calendar offers to play. */
export const DAILY_REPLAY_FROM = '2026-07-01';

/** A day that can be played from the Archive calendar: from the floor up to yesterday. */
export function isReplayableDay(date: string, today: string): boolean {
  return date >= DAILY_REPLAY_FROM && date < today;
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
