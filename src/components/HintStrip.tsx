import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';

interface HintStripProps {
  /** The hint to show, or null for hidden. Keep the component mounted and drive this. */
  text: string | null;
  onDismiss: () => void;
  /**
   * `floating`: pinned to the bottom of the game's timeline area, just above the hand.
   * `inline`: a block under a home-tab heading.
   */
  placement?: 'floating' | 'inline';
}

/**
 * The one-line hint pill every one-shot hint renders in. The whole pill is the dismiss
 * target (the X is only the affordance), and the wrapper is a polite live region so a
 * screen reader announces the hint once without stealing focus.
 *
 * Floating: sits at z-[35], above the timeline's z-30 "Later" fade and below the z-40
 * bottom bar, so it never covers the hand card and tracks the bar's height. Not a
 * `fixed bottom-20` toast: that lands on the card. The positioned wrapper is a plain div
 * because framer writes `transform` inline, which would override a Tailwind translate.
 */
const HintStrip: React.FC<HintStripProps> = ({ text, onDismiss, placement = 'inline' }) => {
  const reduceMotion = useReducedMotion();
  const floating = placement === 'floating';
  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 } };

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        floating
          ? 'absolute bottom-2 inset-x-0 z-[35] flex justify-center px-2 pointer-events-none'
          : 'w-full'
      }
    >
      <AnimatePresence>
        {text && (
          <motion.div
            {...motionProps}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className={floating ? 'max-w-full pointer-events-auto' : 'mt-2 w-full'}
          >
            <button
              type="button"
              onClick={onDismiss}
              title="Dismiss"
              className={`flex w-full items-center gap-2 border border-border bg-surface px-4 py-2 text-left text-sm font-body text-text shadow-sm transition-colors hover:bg-border active:scale-[0.98] ${
                floating ? 'rounded-2xl' : 'rounded-xl'
              }`}
            >
              <Lightbulb className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="flex-1">{text}</span>
              <X className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HintStrip;
