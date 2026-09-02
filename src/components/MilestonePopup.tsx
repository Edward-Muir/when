import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Zap, Flame, Archive } from 'lucide-react';
import type { GameMilestone, MilestoneKind } from '../utils/statsStorage';
import Modal from './ui/Modal';

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
  bestThemeScore: { Icon: Archive, label: 'Best on this deck', unit: 'placed' },
};

/**
 * Lightweight celebratory modal shown after the game-over popup when the player set one or more
 * personal bests. Text + icon only (no badge art, no confetti) — a quieter sibling of
 * AchievementUnlock. Reveals one milestone at a time; tap anywhere (or ESC) advances, and advancing
 * past the last one dismisses. Sits on the `reveal` layer, above the game-over GamePopup.
 */
const MilestonePopup: React.FC<MilestonePopupProps> = ({ open, milestones, onDismiss }) => {
  const [index, setIndex] = useState(0);
  const isVisible = open && milestones.length > 0;

  // Restart the reveal from the first milestone each time the modal opens.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // `onDismiss` is called here rather than inside a `setIndex` updater — updaters must be
  // pure, and StrictMode double-invokes them, so a side effect in there fires twice. See the
  // matching note in `AchievementUnlock`.
  const advance = useCallback(() => {
    if (index >= milestones.length - 1) onDismiss();
    else setIndex((i) => i + 1);
  }, [index, milestones.length, onDismiss]);

  // eslint-disable-next-line security/detect-object-injection -- numeric index into own array
  const current = milestones[index];
  const isLast = index >= milestones.length - 1;
  const meta = current ? MILESTONE_META[current.kind] : null;

  return (
    <Modal
      open={isVisible && !!current && !!meta}
      onDismiss={advance}
      dismiss="tap-advance"
      backdrop="celebration"
      layer="reveal"
      cardClassName="px-5 py-6 flex flex-col items-center text-center"
    >
      {current && meta && (
        <>
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
        </>
      )}
    </Modal>
  );
};

export default MilestonePopup;
