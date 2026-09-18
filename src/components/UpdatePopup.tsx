import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, History } from 'lucide-react';
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
                  <ul className="list-disc pl-5 space-y-2 max-h-[40vh] overflow-y-auto">
                    {notes.map((note) => (
                      <li key={note} className="text-sm font-body text-text-muted leading-relaxed">
                        {note}
                      </li>
                    ))}
                  </ul>
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

            {/* The way out to the full history. Styled as the same quiet full-width row
                ReportIssueButton uses in the card popup, rather than an underlined text
                link: it is a tertiary action sitting next to two real buttons, and an
                underline is the one thing this design language does not use. */}
            {hasNotes && (
              <div className="px-4 border-t border-border">
                <Link
                  to="/changelog"
                  onClick={onDismiss}
                  className="w-full min-h-[44px] flex items-center justify-center gap-1.5 font-body text-xs text-text opacity-60 hover:opacity-100 active:scale-95 transition-all"
                >
                  <History className="w-3.5 h-3.5" />
                  See all changes
                </Link>
              </div>
            )}

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
