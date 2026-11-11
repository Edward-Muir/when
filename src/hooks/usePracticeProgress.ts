import { useEffect } from 'react';
import { WhenGameState } from '../types';
import {
  buildPracticeProgressSnapshot,
  clearPracticeProgress,
  isPracticeGame,
  savePracticeProgress,
} from '../utils/practiceProgress';

/**
 * Keep the practice game in progress saved (`utils/practiceProgress.ts`), the daily's
 * `useDailyProgress` for every other single-player game.
 *
 * Settled `playing` states are written here: the deal, a cycled hand, the end of each placement
 * (the placement itself is saved earlier, from `placeCard`, at the drop). The slot is dropped
 * at game over, while a new deal's intro plays, and as soon as any game that is not a practice
 * game deals (a Daily, a
 * multiplayer challenge), since only one game is ever the one in progress. A review board
 * touches nothing. Leaving through Home clears it in `App`, which owns every way home.
 */
export function usePracticeProgress(state: WhenGameState) {
  const { phase, isReview, isAnimating } = state;

  useEffect(() => {
    if (isReview || (phase !== 'transitioning' && phase !== 'playing' && phase !== 'gameOver')) {
      return;
    }
    // A deal still dealing is dropped too: a reload mid-intro after Restart must not bring
    // back the game the player just restarted.
    if (phase !== 'playing' || !isPracticeGame(state)) {
      clearPracticeProgress();
    } else if (!isAnimating) {
      savePracticeProgress(buildPracticeProgressSnapshot(state));
    }
    // The snapshot reads `state` wholesale; these are the fields that change between moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase,
    isReview,
    isAnimating,
    state.gameMode,
    state.lastConfig,
    state.timeline,
    state.players,
    state.failedPlacements,
    state.placementHistory,
  ]);
}
