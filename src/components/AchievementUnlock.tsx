import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import AchievementReveal from './AchievementReveal';

interface AchievementUnlockProps {
  /** Whether the modal is visible. Self-gates so the caller adds no render branch. */
  open: boolean;
  /** The badges unlocked this game, in display order. */
  achievements: AchievementDef[];
  /** Event catalogue keyed by `name`, so each card can resolve its art. */
  eventsByName: Map<string, HistoricalEvent>;
  /** Called once the player advances past the last badge. */
  onDismiss: () => void;
}

/**
 * Celebratory modal shown after the game-over popup is dismissed when the player
 * crossed one or more achievement thresholds. Reveals one badge at a time; tapping
 * anywhere (or ESC) advances, and advancing past the last one dismisses. Confetti
 * fires on each reveal. Sits at z-[60], above the game-over GamePopup (z-50).
 */
const AchievementUnlock: React.FC<AchievementUnlockProps> = ({
  open,
  achievements,
  eventsByName,
  onDismiss,
}) => {
  const [index, setIndex] = useState(0);
  const isVisible = open && achievements.length > 0;

  // Restart the reveal from the first badge each time the modal opens.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= achievements.length - 1) {
        onDismiss();
        return i;
      }
      return i + 1;
    });
  }, [achievements.length, onDismiss]);

  useEffect(() => {
    if (!isVisible) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') advance();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, advance]);

  // eslint-disable-next-line security/detect-object-injection -- numeric index into own array
  const current = achievements[index];
  const isLast = index >= achievements.length - 1;

  return (
    <AnimatePresence>
      {isVisible && current && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
          onClick={advance}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm transition-colors px-5 py-6 flex flex-col items-center text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <p className="font-display font-bold text-lg text-accent mb-1">Achievement Unlocked!</p>

            {/* Badge reveal — handles its own confetti + entrance animation. replayKey={index}
                re-triggers it as the player advances through multiple unlocks. */}
            <div className="relative w-full flex justify-center">
              <AchievementReveal
                variant="stagger"
                achievement={current}
                eventsByName={eventsByName}
                replayKey={index}
              />
            </div>

            <p className="mt-4 font-body text-sm text-text-muted">
              {achievements.length > 1 && (
                <span className="mr-2 font-mono text-xs">
                  {index + 1} / {achievements.length}
                </span>
              )}
              {isLast ? 'Tap to close' : 'Tap to continue'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementUnlock;
