import React, { useCallback, useEffect, useState } from 'react';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import AchievementReveal from './AchievementReveal';
import AchievementsSummary from './AchievementsSummary';
import AchievementDetailPopup from './AchievementDetailPopup';
import Modal from './ui/Modal';
import ContinueButton from './ui/ContinueButton';

interface AchievementUnlockProps {
  /** Whether the modal is visible. Self-gates so the caller adds no render branch. */
  open: boolean;
  /** The badges unlocked this game, in display order. */
  achievements: AchievementDef[];
  /** Event catalogue keyed by `name`, so each card can resolve its art. */
  eventsByName: Map<string, HistoricalEvent>;
  /** Called once the player continues past the badges. */
  onDismiss: () => void;
}

/**
 * The achievements step of the end-of-game sequence, on the `reveal` layer above the game-over
 * popup.
 *
 * **One badge** gets the full reveal: the large card, confetti, and Continue (a tap anywhere,
 * ESC or Back also continues). **Two or more** share one screen, `AchievementsSummary`, rather
 * than a reveal each; a first Daily unlocks five. That screen holds buttons, so it is not
 * tap-anywhere: Continue, the backdrop, ESC and Back leave it, and a tapped badge opens
 * `AchievementDetailPopup` over it.
 */
const AchievementUnlock: React.FC<AchievementUnlockProps> = ({
  open,
  achievements,
  eventsByName,
  onDismiss,
}) => {
  const [selected, setSelected] = useState<AchievementDef | null>(null);
  const isVisible = open && achievements.length > 0;
  const many = achievements.length > 1;

  // A fresh screen each time the step opens.
  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  // ESC reaches every open Modal's listener at once, so with the detail popup up the same key
  // would also leave this screen. Only the top one acts. (Back already goes to the top one only.)
  const leave = useCallback(() => {
    if (!selected) onDismiss();
  }, [selected, onDismiss]);

  const single = achievements[0];

  return (
    <>
      <Modal
        open={isVisible}
        onDismiss={leave}
        dismiss={many ? 'backdrop' : 'tap-advance'}
        backdrop="celebration"
        layer="reveal"
        scroll="card"
        cardClassName={`px-5 flex flex-col items-center text-center ${many ? 'py-6' : 'py-8'}`}
      >
        {many ? (
          <AchievementsSummary
            achievements={achievements}
            eventsByName={eventsByName}
            onSelect={setSelected}
            onContinue={onDismiss}
          />
        ) : (
          single && (
            <>
              <p className="font-display font-bold text-lg text-accent mb-1">
                Achievement Unlocked!
              </p>
              {/* Badge reveal — handles its own confetti + entrance animation. */}
              <div className="relative w-full flex justify-center">
                <AchievementReveal
                  variant="stagger"
                  achievement={single}
                  eventsByName={eventsByName}
                  size="lg"
                />
              </div>
              <ContinueButton onClick={onDismiss} className="mt-5" />
            </>
          )
        )}
      </Modal>

      {/* A sibling, not a child: inside the card it would be clipped by it and its clicks would
          reach this screen. Same `reveal` layer, later in the DOM, so it sits on top. */}
      <AchievementDetailPopup
        achievement={selected}
        unlocked
        eventsByName={eventsByName}
        onDismiss={() => setSelected(null)}
        layer="reveal"
      />
    </>
  );
};

export default AchievementUnlock;
