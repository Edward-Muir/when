import { useCallback, useState } from 'react';
import { WhenGameState } from '../types';
import { setHomeNotice } from '../utils/homeNotice';
import { useBackHandler } from './useBackHandler';

type LeaveState = Pick<WhenGameState, 'gameMode' | 'phase' | 'isReview'>;

/**
 * What leaving does: 'confirm' asks first, 'saved' leaves and says so, 'leave' just leaves.
 *
 * Only a game whose progress would be lost asks. A Daily is saved as it is played
 * (utils/dailyProgress.ts) and resumes from the Daily card, so the prompt guarded nothing; a
 * finished game and a board being re-read have nothing to lose either. An Archive day runs as
 * `suddenDeath`, so it keeps the confirm along with Custom.
 */
export function leaveAction(state: LeaveState): 'confirm' | 'saved' | 'leave' {
  if (state.isReview || state.phase === 'gameOver') return 'leave';
  return state.gameMode === 'daily' ? 'saved' : 'confirm';
}

/**
 * Going home from a game, for the Home button and the system Back gesture alike. Lives in a
 * hook because `Game` sits on ESLint's complexity ceiling.
 */
export function useLeaveGame(state: LeaveState, onLeave: () => void) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestHome = () => {
    const action = leaveAction(state);
    if (action === 'confirm') return setConfirmOpen(true);
    if (action === 'saved') setHomeNotice('saved');
    onLeave();
  };

  // The bottom of the back stack: Back does this once no popup or menu is left to close.
  useBackHandler(true, requestHome, true);

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);
  return { requestHome, confirmOpen, closeConfirm };
}
