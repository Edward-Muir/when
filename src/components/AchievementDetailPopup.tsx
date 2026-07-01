import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import AchievementCard from './AchievementCard';

interface AchievementDetailPopupProps {
  /** The tapped badge, or null when the popup is closed. */
  achievement: AchievementDef | null;
  /** Whether the tapped badge is unlocked (locked badges render redacted). */
  unlocked: boolean;
  /** Event catalogue keyed by `name`, so the card can resolve its art. */
  eventsByName?: Map<string, HistoricalEvent>;
  onDismiss: () => void;
}

/**
 * Inspection modal for a tapped achievement badge: the large-format card with the
 * high-res art. Locked badges keep the desaturated art + lock. Container styling and
 * timings mirror GamePopup/AchievementUnlock (0.15s fade, 500/30 spring), no confetti.
 */
const AchievementDetailPopup: React.FC<AchievementDetailPopupProps> = ({
  achievement,
  unlocked,
  eventsByName,
  onDismiss,
}) => {
  const isVisible = !!achievement;

  useEffect(() => {
    if (!isVisible) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Solid surface behind the card: the card itself is translucent (frosted), and
              without this the badge grid bleeds through as dark blobs behind the text. */}
          <motion.div
            className="w-[85vw] max-w-[340px] sm:max-w-[400px] max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-sm"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <AchievementCard
              achievement={achievement}
              unlocked={unlocked}
              eventsByName={eventsByName}
              size="lg"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementDetailPopup;
