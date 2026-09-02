import { getLocalDateString } from './puzzleDate';

/**
 * Personal bests on curated themes, keyed by theme id — the number the Archive shows beside
 * each deck and the record a replay tries to beat.
 *
 * Written for every finished game that belongs to a curated theme: the daily on the day the
 * theme ran, and every Archive replay after it. So a player's daily score is the first best
 * and a replay has something to beat. Plays from before this existed are gone — the daily
 * keeps exactly one result record, overwritten each day, and the cadence keeps dates rather
 * than scores — which is accepted rather than migrated around.
 *
 * `correctCount` is the same number the leaderboard ranks and `DailyResult` stores, not the
 * timeline length (which counts the seed card too). Same storage discipline as
 * statsStorage.ts: one key, fail-silent accessors, a full default rather than null.
 */
export interface ThemeBest {
  /** Most events correctly placed in one run of this theme. */
  correctCount: number;
  /** The deck has been run dry at least once. */
  cleared: boolean;
  /** Run dry without a single mistake at least once. */
  perfect: boolean;
  plays: number;
  /** Local `YYYY-MM-DD` of the most recent run. */
  lastPlayed: string;
}

export type ThemeBests = Record<string, ThemeBest>;

const THEME_BESTS_KEY = 'when-theme-bests';

function isThemeBest(value: unknown): value is ThemeBest {
  if (!value || typeof value !== 'object') return false;
  const best = value as Partial<ThemeBest>;
  return Number.isFinite(best.correctCount) && Number.isFinite(best.plays);
}

export function getThemeBests(): ThemeBests {
  try {
    const stored = localStorage.getItem(THEME_BESTS_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return {};

    const bests: ThemeBests = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!isThemeBest(value)) continue;
      // eslint-disable-next-line security/detect-object-injection -- id is a key of our own record
      bests[id] = {
        correctCount: value.correctCount,
        cleared: value.cleared === true,
        perfect: value.perfect === true,
        plays: value.plays,
        lastPlayed: typeof value.lastPlayed === 'string' ? value.lastPlayed : '',
      };
    }
    return bests;
  } catch {
    return {};
  }
}

export function getThemeBest(themeId: string): ThemeBest | undefined {
  const bests = getThemeBests();
  if (!Object.prototype.hasOwnProperty.call(bests, themeId)) return undefined;
  // eslint-disable-next-line security/detect-object-injection -- guarded by hasOwnProperty
  return bests[themeId];
}

function saveThemeBests(bests: ThemeBests): void {
  try {
    localStorage.setItem(THEME_BESTS_KEY, JSON.stringify(bests));
  } catch {
    console.warn('Failed to save theme bests to localStorage');
  }
}

export interface ThemeRunResult {
  correctCount: number;
  cleared: boolean;
  perfect: boolean;
}

/**
 * Fold one finished run into the theme's record. Not idempotent (`plays` increments), so
 * callers record each game exactly once — `useGameStatsRecorder` owns that guard.
 *
 * @returns the record as saved.
 */
export function recordThemeResult(themeId: string, result: ThemeRunResult): ThemeBest {
  const bests = getThemeBests();
  const previous = getThemeBest(themeId);
  const next: ThemeBest = {
    correctCount: Math.max(previous?.correctCount ?? 0, result.correctCount),
    cleared: (previous?.cleared ?? false) || result.cleared,
    perfect: (previous?.perfect ?? false) || result.perfect,
    plays: (previous?.plays ?? 0) + 1,
    lastPlayed: getLocalDateString(),
  };
  // eslint-disable-next-line security/detect-object-injection -- id is a key of our own record
  bests[themeId] = next;
  saveThemeBests(bests);
  return next;
}
