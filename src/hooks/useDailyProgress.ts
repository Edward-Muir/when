import { useEffect } from 'react';
import { WhenGameState } from '../types';
import {
  buildDailyProgressSnapshot,
  clearDailyProgress,
  saveDailyProgress,
} from '../utils/dailyProgress';

/**
 * Keep today's unfinished daily saved (`utils/dailyProgress.ts`), and drop the save once the
 * game is over, by which point `useSaveDailyResult` has recorded the day as played.
 *
 * Only settled states are written here: the deal, a cycled hand, the end of each placement.
 * The placement itself is saved earlier, from `placeCard`, the moment the card is dropped; see
 * `settleDailyPlacement` for why waiting for the animation would reopen the cheat.
 */
export function useDailyProgress(state: WhenGameState) {
  const { phase, gameMode, isReview, isAnimating } = state;

  useEffect(() => {
    if (gameMode !== 'daily' || isReview) return;
    if (phase === 'gameOver') {
      clearDailyProgress();
    } else if (phase === 'playing' && !isAnimating) {
      saveDailyProgress(buildDailyProgressSnapshot(state));
    }
    // The snapshot reads `state` wholesale; these are the fields that change between moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase,
    gameMode,
    isReview,
    isAnimating,
    state.lastConfig,
    state.timeline,
    state.players,
    state.failedPlacements,
    state.placementHistory,
  ]);
}
