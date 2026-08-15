import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Share2 } from 'lucide-react';
import { WhenGameState } from '../types';
import { shareResults } from '../utils/share';
import DailyReminderPrompt from './DailyReminderPrompt';
import NextDailyCountdown from './NextDailyCountdown';

/**
 * The last screen of the end-of-game sequence: gameOver → milestones → achievements → here.
 *
 * The share used to live inside the game-over popup, i.e. the *first* screen, so it went out
 * before the player knew what they had unlocked, and the genuinely final beat was a button in
 * the bottom bar nobody looks at. This is the finale instead, and it always renders — see
 * `useEndOfGameSequence`.
 *
 * The daily's return hooks (reminder opt-in, next-daily countdown) moved here with it. They
 * are the "come back tomorrow" beat, so they belong on the last screen rather than three
 * screens earlier.
 *
 * No preview of the story card: rendering it would mean a `renderShareCard` canvas pass on
 * every single game over rather than only when someone actually taps Share, and this surface
 * has real Cloudinary cost discipline behind it (docs/cloudinary-cost-controls.md).
 *
 * Shell matches `MilestonePopup` / `AchievementUnlock` — z-[60] over the game-over popup's
 * z-50, 0.15s backdrop fade, 500/30 spring on the card.
 */
const ShareStepPopup: React.FC<{
  open: boolean;
  gameState: WhenGameState;
  leaderboardRank?: number;
  onDismiss: () => void;
}> = ({ open, gameState, leaderboardRank, onDismiss }) => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onDismiss]);

  const isDaily = gameState.gameMode === 'daily';
  const isChallenge = !!gameState.lastConfig?.challengeCode;
  const correctCount = gameState.placementHistory.filter(Boolean).length;
  // The daily counts the pre-placed seed card, matching the share text and the story card.
  const timelineLength = isDaily ? correctCount + 1 : correctCount;

  const handleShare = async () => {
    const copied = await shareResults(gameState, { leaderboardRank });
    if (copied) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="relative w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm transition-colors px-5 py-6 flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <p className="font-body text-text">
              <span className="font-mono text-3xl font-bold">{timelineLength}</span>
              <span className="text-text-muted"> {timelineLength === 1 ? 'event' : 'events'}</span>
            </p>
            {leaderboardRank && (
              <p className="mt-1 font-body text-sm text-accent">#{leaderboardRank} globally</p>
            )}

            {isChallenge && (
              <p className="mt-4 text-xs text-text-muted font-body">
                They&apos;ll play with the same cards in the same order.
              </p>
            )}

            <button
              onClick={handleShare}
              className={`w-full py-2.5 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body bg-accent-secondary hover:bg-accent-secondary/90 text-white ${
                isChallenge ? 'mt-3' : 'mt-5'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            {isDaily && (
              <div className="w-full">
                <DailyReminderPrompt />
                <p className="text-center text-text-muted text-sm mt-4 font-body">
                  Come back tomorrow · <NextDailyCountdown />
                </p>
              </div>
            )}

            {showToast && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 font-body whitespace-nowrap">
                <Check className="w-4 h-4" />
                Copied to clipboard!
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareStepPopup;
