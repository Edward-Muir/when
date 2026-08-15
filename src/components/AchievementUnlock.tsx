import React, { useCallback, useEffect, useState } from 'react';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import AchievementReveal from './AchievementReveal';
import Modal from './ui/Modal';

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
 * fires on each reveal. Sits on the `reveal` layer, above the game-over GamePopup.
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

  // `onDismiss` is called here rather than inside a `setIndex` updater. Updaters must be
  // pure: StrictMode invokes them twice to surface exactly this, so a side effect in there
  // fires twice. That was invisible while dismissing was idempotent, and became a real bug
  // the moment `onDismiss` advanced a queue — the end-of-game sequence skipped a step.
  const advance = useCallback(() => {
    if (index >= achievements.length - 1) onDismiss();
    else setIndex((i) => i + 1);
  }, [index, achievements.length, onDismiss]);

  // eslint-disable-next-line security/detect-object-injection -- numeric index into own array
  const current = achievements[index];
  const isLast = index >= achievements.length - 1;

  return (
    <Modal
      open={isVisible && !!current}
      onDismiss={advance}
      dismiss="tap-advance"
      backdrop="celebration"
      layer="reveal"
      scroll="card"
      cardClassName="px-5 py-8 flex flex-col items-center text-center"
    >
      {current && (
        <>
          <p className="font-display font-bold text-lg text-accent mb-1">Achievement Unlocked!</p>

          {/* Badge reveal — handles its own confetti + entrance animation. replayKey={index}
              re-triggers it as the player advances through multiple unlocks. */}
          <div className="relative w-full flex justify-center">
            <AchievementReveal
              variant="stagger"
              achievement={current}
              eventsByName={eventsByName}
              replayKey={index}
              size="lg"
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
        </>
      )}
    </Modal>
  );
};

export default AchievementUnlock;
