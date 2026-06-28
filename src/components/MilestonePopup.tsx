import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Zap, Flame } from 'lucide-react';
import type { GameMilestone, MilestoneKind } from '../utils/statsStorage';

interface MilestonePopupProps {
  /** Whether the modal is visible. Self-gates so the caller adds no render branch. */
  open: boolean;
  /** Personal bests set this game, in display order. */
  milestones: GameMilestone[];
  /** Called once the player advances past the last milestone. */
  onDismiss: () => void;
}

/** Display metadata per milestone kind: icon, label, and the unit shown after the value. */
const MILESTONE_META: Record<
  MilestoneKind,
  { Icon: React.ComponentType<{ className?: string }>; label: string; unit: string }
> = {
  longestTimelineDaily: { Icon: Ruler, label: 'Longest daily timeline', unit: 'cards' },
  longestTimelineCustom: { Icon: Ruler, label: 'Longest custom timeline', unit: 'cards' },
  longestStreakDaily: { Icon: Zap, label: 'Longest daily streak', unit: '' },
  longestStreakCustom: { Icon: Zap, label: 'Longest custom streak', unit: '' },
  longestDailyRun: { Icon: Flame, label: 'Longest daily run', unit: 'days' },
};

/**
 * Lightweight celebratory modal shown after the game-over popup when the player set one or more
 * personal bests. Text + icon only (no badge art, no confetti) — a quieter sibling of
 * AchievementUnlock. Reveals one milestone at a time; tap anywhere (or ESC) advances, and advancing
 * past the last one dismisses. Sits at z-[60], above the game-over GamePopup (z-50).
 */
const MilestonePopup: React.FC<MilestonePopupProps> = ({ open, milestones, onDismiss }) => {
  const [index, setIndex] = useState(0);
  const isVisible = open && milestones.length > 0;

  // Restart the reveal from the first milestone each time the modal opens.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i >= milestones.length - 1) {
        onDismiss();
        return i;
      }
      return i + 1;
    });
  }, [milestones.length, onDismiss]);

  useEffect(() => {
    if (!isVisible) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') advance();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, advance]);

  // eslint-disable-next-line security/detect-object-injection -- numeric index into own array
  const current = milestones[index];
  const isLast = index >= milestones.length - 1;
  const meta = current ? MILESTONE_META[current.kind] : null;

  return (
    <AnimatePresence>
      {isVisible && current && meta && (
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
            <p className="font-display font-bold text-lg text-accent mb-3">New Personal Best!</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.kind}
                className="flex flex-col items-center"
                initial={{ scale: 0.8, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              >
                <meta.Icon className="h-8 w-8 text-accent" />
                <p className="mt-3 font-body text-sm text-text-muted">{meta.label}</p>
                <p className="mt-1 font-mono text-3xl font-bold text-text">
                  {current.value}
                  {meta.unit && <span className="ml-1 text-base text-text-muted">{meta.unit}</span>}
                </p>
                <p className="mt-1 font-body text-xs text-text-muted">
                  previous best {current.previous}
                </p>
              </motion.div>
            </AnimatePresence>

            <p className="mt-4 font-body text-sm text-text-muted">
              {milestones.length > 1 && (
                <span className="mr-2 font-mono text-xs">
                  {index + 1} / {milestones.length}
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

export default MilestonePopup;
