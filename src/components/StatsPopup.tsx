import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Trophy, Layers } from 'lucide-react';

interface StatsPopupProps {
  isOpen: boolean;
  cardsInHand: number;
  timelineLength: number;
  highScore: number;
  onDismiss: () => void;
}

const StatsPopup: React.FC<StatsPopupProps> = ({
  isOpen,
  cardsInHand,
  timelineLength,
  highScore,
  onDismiss,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-lg font-display font-semibold text-text">Timeline Stats</h2>
            </div>

            {/* Stats content */}
            <div className="px-4 py-4 space-y-4">
              {/* Cards in hand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold font-mono text-text">{cardsInHand}</div>
                  <div className="text-sm text-text-muted font-body">Cards remaining in hand</div>
                </div>
              </div>

              {/* Current timeline length */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold font-mono text-text">{timelineLength}</div>
                  <div className="text-sm text-text-muted font-body">Events in your timeline</div>
                </div>
              </div>

              {/* High score */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold font-mono text-text">{highScore}</div>
                  <div className="text-sm text-text-muted font-body">
                    Your longest timeline ever
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatsPopup;
