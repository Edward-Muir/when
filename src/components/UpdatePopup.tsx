import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpdatePopupProps {
  isVisible: boolean;
  onDismiss: () => void;
  /** The version being offered, when the check knows it. */
  version?: string | null;
  /** One short sentence per notable change, from public/version.json. */
  notes?: string[];
}

export function UpdatePopup({ isVisible, onDismiss, version, notes = [] }: UpdatePopupProps) {
  // A refresh icon says a new build exists; it never says why anyone should want it. When
  // the release carried notes, they take the icon's place. The icon stays as the fallback
  // for a build released before the notes existed, or one whose notes failed to load.
  const hasNotes = notes.length > 0;

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
              <h2 className="text-lg font-display font-semibold text-text">
                {hasNotes && version ? `What's new in v${version}` : 'Update Available'}
              </h2>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              {hasNotes ? (
                <>
                  {/* Capped and scrollable: a release with a lot to say must not push the
                      buttons off the bottom of a phone screen. */}
                  <ul className="list-disc pl-5 space-y-2 mb-3 max-h-[40vh] overflow-y-auto">
                    {notes.map((note) => (
                      <li key={note} className="text-sm font-body text-text-muted leading-relaxed">
                        {note}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/changelog"
                    onClick={onDismiss}
                    className="block text-sm font-body text-accent-secondary underline"
                  >
                    See all changes
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <RefreshCw className="w-10 h-10 text-accent" />
                  </div>
                  <p className="text-center text-text-muted text-sm">
                    A new version of When? is available. Reload to get the latest features and
                    fixes.
                  </p>
                </>
              )}
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
