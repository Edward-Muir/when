import { useEffect } from 'react';
import { WhenGameState } from '../types';
import { saveDailyResult } from '../utils/playerStorage';
import { buildDailyBoardSnapshot, saveDailyBoard } from '../utils/dailyBoard';
import { generateEmojiGrid } from '../utils/share';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { getThemeOutcome } from '../utils/themeOutcome';

/**
 * Persist a finished daily: the result the leaderboard and share want, and the board itself so
 * the player can re-open it from the Daily card.
 *
 * Idempotent by overwrite, so no ref guard — but it must NOT run for a board restored for
 * review (`dailyBoard.ts`), which re-enters `gameOver` with no rank and no fresh play. Writing
 * then would clear the `leaderboardRank` that `updateDailyResultWithLeaderboard` stored after
 * submission.
 */
export function useSaveDailyResult(state: WhenGameState) {
  // Derived out here rather than inside the effect so the dependency list can stay a list of
  // the state fields the effect actually reads. Passing `state` wholesale would make the
  // effect depend on every field of it.
  const cleared = getThemeOutcome(state).survived;

  useEffect(() => {
    if (state.isReview) return;
    if (state.phase === 'gameOver' && state.gameMode === 'daily' && state.lastConfig?.dailySeed) {
      const dailySeed = state.lastConfig.dailySeed;
      const theme = getDailyTheme(dailySeed);

      saveDailyBoard(buildDailyBoardSnapshot(state));
      saveDailyResult({
        date: dailySeed,
        theme: getThemeDisplayName(theme),
        won: state.winners.length > 0,
        cleared,
        correctCount: state.placementHistory.filter((p) => p).length,
        totalAttempts: state.placementHistory.length,
        emojiGrid: generateEmojiGrid(state.placementHistory),
        bestStreak: state.bestStreak > 1 ? state.bestStreak : undefined,
      });
    }
    // The board snapshot reads `state` wholesale, so the linter wants the object itself. The
    // list below is the set of fields that can actually change what gets written, and every
    // one of them is frozen by the time the game is over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cleared,
    state.isReview,
    state.phase,
    state.gameMode,
    state.lastConfig,
    state.winners,
    state.timeline,
    state.failedPlacements,
    state.seedEventName,
    state.placementHistory,
    state.bestStreak,
  ]);
}
