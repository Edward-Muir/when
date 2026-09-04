import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';

interface HintStripProps {
  /** The hint to show, or null for hidden. Keep the component mounted and drive this. */
  text: string | null;
  onDismiss: () => void;
  /**
   * When set, tapping the body does this instead of dismissing (the X still dismisses).
   * For a strip that is an invitation, like the Daily tab's "tap for how to play".
   */
  onSelect?: () => void;
  /**
   * `floating`: pinned to the bottom of the game's timeline area, just above the hand.
   * `inline`: a block under a home-tab heading.
   */
  placement?: 'floating' | 'inline';
}

/**
 * The one-line hint pill every one-shot hint renders in. The whole pill is the dismiss
 * target (the X is only the affordance) unless `onSelect` is given, in which case the body
 * acts and the X is its own button. The wrapper is a polite live region so a screen reader
 * announces the hint once without stealing focus.
 *
 * Floating: sits at z-[35], above the timeline's z-30 "Later" fade and below the z-40
 * bottom bar, so it never covers the hand card and tracks the bar's height. It is one line
 * and never grows: the copy in `hintCopy.ts` is kept short enough for a 375px phone, and
 * `truncate` is only the safety net. Not a `fixed bottom-20` toast: that lands on the card.
 * The positioned wrapper is a plain div because framer writes `transform` inline, which
 * would override a Tailwind translate.
 */
const HintStrip: React.FC<HintStripProps> = ({
  text,
  onDismiss,
  onSelect,
  placement = 'inline',
}) => {
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
            <div
              className={`flex w-full items-center border border-border bg-surface shadow-sm ${
                floating ? 'rounded-full whitespace-nowrap' : 'rounded-xl'
              }`}
            >
              <button
                type="button"
                onClick={onSelect ?? onDismiss}
                title={onSelect ? undefined : 'Dismiss'}
                className={`flex min-w-0 flex-1 items-center gap-2 py-2 pl-4 text-left text-sm font-body text-text transition-colors hover:bg-border active:scale-[0.98] ${
                  onSelect ? 'pr-2' : 'pr-4'
                } ${floating ? 'rounded-full' : 'rounded-xl'}`}
              >
                <Lightbulb className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span className={floating ? 'truncate' : 'flex-1'}>{text}</span>
                {!onSelect && <X className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />}
              </button>
              {onSelect && (
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label="Dismiss hint"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-border"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HintStrip;
