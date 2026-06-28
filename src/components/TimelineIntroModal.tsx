import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

interface TimelineIntroModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

/**
 * First-view explainer for the My Timeline page — mirrors the "How to Play" rules modal.
 * Shown once (gated by hasSeenTimelineIntro), explaining the personal collection.
 */
const TimelineIntroModal: React.FC<TimelineIntroModalProps> = ({ isOpen, onDismiss }) => {
  const textClass = 'text-sm text-text font-body leading-relaxed';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onDismiss}
          />
          <motion.div
            className="relative w-[85vw] max-w-[320px] overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <div className="border-b border-border px-4 py-3">
              <h2 className="font-display text-lg font-semibold text-text">My Timeline</h2>
            </div>
            <div className="space-y-3 p-4 text-left">
              <p className={textClass}>This is your personal timeline.</p>
              <p className={textClass}>
                Every event you place correctly is added here. Collect them all!
              </p>
              <p className={textClass}>
                Tap{' '}
                <span className="mx-0.5 inline-flex h-6 w-6 -translate-y-0.5 items-center justify-center rounded-md border border-border bg-surface align-middle">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-text" />
                </span>{' '}
                to filter by category, era, and difficulty.
              </p>
              <button
                onClick={onDismiss}
                className="mt-1 w-full rounded-xl bg-accent px-4 py-2 font-body font-semibold text-white transition-colors active:scale-95"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TimelineIntroModal;
