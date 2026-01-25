import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface UpdatePopupProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function UpdatePopup({ isVisible, onDismiss }: UpdatePopupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-[85vw] max-w-[340px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-lg font-display font-semibold text-text">Update Available</h2>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              <div className="flex justify-center mb-4">
                <RefreshCw className="w-10 h-10 text-accent" />
              </div>
              <p className="text-center text-text-muted text-sm">
                A new version of When? is available. Reload to get the latest features and fixes.
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-border flex gap-2">
              <button
                onClick={onDismiss}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-text font-medium hover:bg-border/50 active:scale-95 transition-all"
              >
                Later
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 active:scale-95 transition-all"
              >
                Reload
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
