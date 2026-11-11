import React from 'react';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import AchievementCard from './AchievementCard';
import Modal, { ModalLayer } from './ui/Modal';

interface AchievementDetailPopupProps {
  /** The tapped badge, or null when the popup is closed. */
  achievement: AchievementDef | null;
  /** Whether the tapped badge is unlocked (locked badges render redacted). */
  unlocked: boolean;
  /** Event catalogue keyed by `name`, so the card can resolve its art. */
  eventsByName?: Map<string, HistoricalEvent>;
  onDismiss: () => void;
  /**
   * `reveal` when it opens over another `reveal` popup (the end-of-game achievements screen);
   * rendered after that popup, it wins the shared z-index by DOM order. Stats keeps `modal`.
   */
  layer?: ModalLayer;
}

/**
 * Inspection modal for a tapped achievement badge: the large-format card with the
 * high-res art. Locked badges keep the desaturated art + lock. No confetti.
 */
const AchievementDetailPopup: React.FC<AchievementDetailPopupProps> = ({
  achievement,
  unlocked,
  eventsByName,
  onDismiss,
  layer = 'modal',
}) => {
  return (
    // Tapping anywhere dismisses (tap-advance): there is nothing to interact with on the card.
    // The solid surface matters: the card itself is translucent (frosted), and without it the
    // badge grid bleeds through as dark blobs behind the text.
    <Modal
      open={!!achievement}
      onDismiss={onDismiss}
      dismiss="tap-advance"
      backdrop="celebration"
      layer={layer}
      rounded="2xl"
      bordered={false}
      scroll="card"
    >
      {achievement && (
        <AchievementCard
          achievement={achievement}
          unlocked={unlocked}
          eventsByName={eventsByName}
          size="lg"
        />
      )}
    </Modal>
  );
};

export default AchievementDetailPopup;
