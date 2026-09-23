import { useEffect } from 'react';
import { WhenGameState } from '../types';
import { saveDailyResult } from '../utils/playerStorage';
import { buildDailyBoardSnapshot, saveDailyBoard } from '../utils/dailyBoard';
import { buildDailyResult } from '../utils/dailyResult';

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
  useEffect(() => {
    if (state.isReview || state.phase !== 'gameOver') return;
    // Null for anything but a daily with a seed, which is exactly when there is nothing to save.
    const result = buildDailyResult(state);
    if (!result) return;

    saveDailyBoard(buildDailyBoardSnapshot(state));
    saveDailyResult({ ...result, bestStreak: state.bestStreak > 1 ? state.bestStreak : undefined });
    // The result and the board snapshot read `state` wholesale, so the linter wants the object
    // itself. The list below is the set of fields that can actually change what gets written,
    // and every one of them is frozen by the time the game is over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.isReview,
    state.phase,
    state.gameMode,
    state.lastConfig,
    state.winners,
    state.players,
    state.timeline,
    state.failedPlacements,
    state.seedEventName,
    state.placementHistory,
    state.bestStreak,
  ]);
}
