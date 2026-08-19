import { WhenGameState } from '../types';
import { DailyResult } from './playerStorage';
import { getDailyTheme, getThemeDisplayName } from './dailyTheme';
import { generateEmojiGrid } from './share';
import { getThemeOutcome } from './themeOutcome';

/**
 * The finished daily, in the shape the leaderboard API and the share both want.
 *
 * Lives here rather than in `playerStorage` so that module stays free of the share/theme
 * imports, and outside `GamePopup` because the game-over popup is no longer the only caller —
 * `Game` needs it to drive `useDailyLeaderboard`.
 *
 * Returns null for anything that is not a completed daily. `dailySeed` is the load-bearing
 * part: without it there is no date to submit against, so there is no result and no submit
 * step. Callers use that null to mean "this game has no leaderboard".
 */
export function buildDailyResult(state: WhenGameState): DailyResult | null {
  const { gameMode, lastConfig, winners, placementHistory } = state;
  if (gameMode !== 'daily' || !lastConfig?.dailySeed) return null;

  return {
    date: lastConfig.dailySeed,
    theme: getThemeDisplayName(getDailyTheme(lastConfig.dailySeed)),
    won: winners.length > 0,
    cleared: getThemeOutcome(state).survived,
    correctCount: placementHistory.filter(Boolean).length,
    totalAttempts: placementHistory.length,
    emojiGrid: generateEmojiGrid(placementHistory),
  };
}
