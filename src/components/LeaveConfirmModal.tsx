import React from 'react';
import { RotateCcw } from 'lucide-react';
import Modal from './ui/Modal';

interface LeaveConfirmModalProps {
  open: boolean;
  onClose: () => void;
  /** Leave the game. */
  onConfirm: () => void;
  /**
   * Start this game over, when the game allows it (`midGameRestart` in Game.tsx). The games
   * that ask before leaving are the ones that can restart, so the prompt offers both ways of
   * giving up the run and the board needs no second button.
   */
  onRestart?: () => void;
  /** Restart is held while a placement animates, so it never lands mid-choreography. */
  restartDisabled?: boolean;
}

/**
 * "Leave game?", asked only where leaving loses something: see `leaveAction` in
 * hooks/useLeaveGame.ts. Home and the system Back gesture both open it.
 */
const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  onRestart,
  restartDisabled = false,
}) => (
  <Modal
    open={open}
    onDismiss={onClose}
    backdrop="scrim"
    widthClass="w-full max-w-sm"
    rounded="2xl"
    shadow="xl"
    bordered={false}
    cardClassName="p-6"
  >
    <h2 className="text-lg font-display text-text mb-2">Leave game?</h2>
    <p className="text-text-muted text-sm mb-6 font-body">Your current progress will be lost.</p>
    <div className="flex gap-3">
      <button
        onClick={onClose}
        className="flex-1 py-3 px-4 bg-border text-text rounded-xl font-medium transition-colors active:scale-95 font-body"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 py-3 px-4 bg-accent text-white rounded-xl font-medium transition-colors active:scale-95 font-body"
      >
        Leave
      </button>
    </div>
    {onRestart && (
      <button
        onClick={() => {
          onClose();
          onRestart();
        }}
        disabled={restartDisabled}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 px-4 font-body font-medium text-text transition-colors active:scale-95 disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        Restart instead
      </button>
    )}
  </Modal>
);

export default LeaveConfirmModal;
