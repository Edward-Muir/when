import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion, useAnimate } from 'framer-motion';
import { HistoricalEvent, AnimationPhase } from '../../types';
import { YearLabel, yearSizeClass } from './YearLabel';
import CardFace, { RevealFace } from '../CardFace';
import { type GlowIntensity } from '../../utils/streakFeedback';
import { AnimationTuning, useAnimationTuning } from './animationTuning';
import TimelineTick from './TimelineTick';
import type { Point } from './tickLanding';

// One scheduled wave bump for this row: Timeline computes when (delay) and how hard
// (amplitudePx); trigger is a timestamp identifying the wave instance.
export interface RippleSpec {
  delay: number;
  amplitudePx: number;
  trigger: number;
}

interface TimelineEventProps {
  event: HistoricalEvent;
  onTap: () => void;
  isNew?: boolean;
  index: number; // For data attribute used by closest-centroid algorithm
  // Animation props for placed cards
  isAnimating?: boolean;
  animationSuccess?: boolean;
  animationPhase?: AnimationPhase;
  // Wave ripple bump scheduled by Timeline (success wave or miss wake)
  ripple?: RippleSpec | null;
  // Streak-aware glow intensity
  glowIntensity?: GlowIntensity;
  // Above-the-fold cards: load eagerly + high priority so they don't drag LCP down.
  // Defaults to lazy so off-screen events keep deferring their image download.
  priority?: boolean;
  // Shared layout id so a rejected card can morph into its tombstone (FLIP reveal)
  layoutId?: string;
  // Miss-reveal wake: when set, this row's one-row displacement (the failed card vacating /
  // the tombstone inserting) is layout-animated with this delay (s) so cards ripple out of
  // the mover's way in passage order. Null/undefined = no layout animation (rows snap).
  layoutShiftDelay?: number | null;
  // Where the drag marker is painted, live. Threaded through to the tick.
  originRef?: React.RefObject<Point | null>;
  // Set only on the row a correct placement just created: the tick grows out of the marker
  // instead of simply being there.
  landing?: boolean;
  // Draw no tick at all. Set on the attempted slot while a wrong drop flashes there — the
  // marker is snuffing two pixels to the right and is standing in for it.
  hideTick?: boolean;
  /**
   * The full reveal: this is the card the player has just placed correctly, and nothing has
   * been dropped since. The card stands tall (REVEAL_CARD_HEIGHT) with the whole-width art,
   * the year stamped on it and the title in the display font, then folds back to a normal
   * row on the next drop. Timeline sets it on one row at most.
   */
  reveal?: boolean;
}

/** Height of the card in the tall reveal row, px. A normal card is 80 (96 from `sm`). */
export const REVEAL_CARD_HEIGHT = 176;
/**
 * How long the card takes to open and to fold, ms. Must stay well under the miss flash
 * (`tuning.miss.flashMs`, 400): a miss folds the tall row at the drop, and the tombstone's
 * FLIP, the camera follow and the wake all measure the board when the flash ends.
 */
export const REVEAL_FOLD_MS = 220;

/**
 * Drives the tall row. `tall` sets the height; `faceMounted` keeps the reveal face in the DOM
 * through the fold so it can fade out. A freshly placed row mounts short and goes tall on the
 * next frame, which is what makes the CSS height transition run as an opening.
 */
interface RevealFold {
  tall: boolean;
  faceMounted: boolean;
  ringClass: string;
}

const TALL_STYLE = { height: REVEAL_CARD_HEIGHT };

/** The card's two faces. Exactly one is exposed at a time, so the accessible name is the title once. */
const RowFaces: React.FC<{ event: HistoricalEvent; priority: boolean; fold: RevealFold }> = ({
  event,
  priority,
  fold,
}) => (
  <>
    <div aria-hidden={fold.tall || undefined} className="w-full h-full">
      <CardFace event={event} priority={priority} />
    </div>
    {fold.faceMounted && (
      <div
        aria-hidden={!fold.tall || undefined}
        className={`reveal-face absolute inset-0 ${fold.tall ? 'opacity-100' : 'opacity-0'}`}
      >
        <RevealFace event={event} />
      </div>
    )}
  </>
);

function useRevealFold(reveal: boolean): RevealFold {
  const [tall, setTall] = useState(false);
  const [faceMounted, setFaceMounted] = useState(reveal);

  useEffect(() => {
    if (reveal) {
      setFaceMounted(true);
      const frame = requestAnimationFrame(() => setTall(true));
      return () => cancelAnimationFrame(frame);
    }
    setTall(false);
    const timer = setTimeout(() => setFaceMounted(false), REVEAL_FOLD_MS + 40);
    return () => clearTimeout(timer);
  }, [reveal]);

  const isTall = reveal && tall;
  return {
    tall: isTall,
    faceMounted: reveal || faceMounted,
    ringClass: isTall ? 'reveal-card-open border-success' : 'border-border',
  };
}

// Spring animation for newly placed cards
const makeSpringBounce = (t: AnimationTuning) => ({
  initial: { scale: 0.95, opacity: 0.8 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      ...t.success.bounceSpring,
    },
  },
});

// Enhanced exit animation for rejected cards
const makeRejectionExit = (t: AnimationTuning) => ({
  exit: {
    scale: 0.9,
    opacity: 0,
    rotate: -3,
    x: -20,
    transition: {
      type: 'spring' as const,
      ...t.miss.rejectionSpring,
      duration: 0.3,
    },
  },
});

// Year pop animation for successful placement
const makeYearPopVariants = (t: AnimationTuning) => ({
  idle: { scale: 1 },
  pop: {
    scale: [1, t.success.yearPopPeakScale, 1],
    transition: {
      duration: t.success.yearPopDurationS,
      times: [0, 0.4, 1],
      ease: 'easeOut' as const,
    },
  },
});

function getGlowClass(intensity: GlowIntensity): string {
  switch (intensity) {
    case 'bright':
      return 'animate-success-glow-bright';
    case 'golden':
      return 'animate-success-glow-golden';
    default:
      return 'animate-success-glow';
  }
}

// Compute animation states based on props (excludes ripple - handled separately with useAnimate)
function useEventAnimations(
  isAnimating: boolean,
  animationSuccess: boolean | undefined,
  animationPhase: AnimationPhase | undefined,
  shouldReduceMotion: boolean | null,
  glowIntensity: GlowIntensity = 'normal'
) {
  const isFlashPhase = animationPhase === 'flash';
  const isMovingPhase = animationPhase === 'moving';

  // Card glow class - use streak-aware glow intensity
  const cardAnimationClass =
    isAnimating && isFlashPhase
      ? animationSuccess
        ? getGlowClass(glowIntensity)
        : 'animate-error-pulse'
      : '';

  // Spring/exit animations (require motion enabled)
  const canAnimate = isAnimating && !shouldReduceMotion;
  const isSuccessAnimation = canAnimate && animationSuccess;
  const isErrorAnimation = canAnimate && !animationSuccess && isMovingPhase;

  // Year pop (require motion enabled)
  const shouldPopYear = isAnimating && animationSuccess && isFlashPhase && !shouldReduceMotion;

  return {
    cardAnimationClass,
    isSuccessAnimation,
    isErrorAnimation,
    shouldPopYear,
    isMovingPhase,
  };
}

// Hook for one-shot ripple animation using useAnimate
function useRippleAnimation(
  ripple: RippleSpec | null,
  shouldReduceMotion: boolean | null,
  tuning: AnimationTuning
) {
  const [scope, animate] = useAnimate();
  const delay = ripple?.delay;
  const amplitudePx = ripple?.amplitudePx;
  const trigger = ripple?.trigger;
  const { ripplePushDurationS, rippleReturnSpring } = tuning.success;

  useEffect(() => {
    if (
      delay !== undefined &&
      amplitudePx !== undefined &&
      trigger !== undefined &&
      amplitudePx > 0 &&
      !shouldReduceMotion
    ) {
      // Two-phase animation: quick push down, then spring back with oscillations
      // Phase 1: Push down quickly
      animate(
        scope.current,
        { y: amplitudePx },
        {
          duration: ripplePushDurationS,
          ease: 'easeOut',
          delay,
        }
      ).then(() => {
        // Phase 2: Spring back to rest with oscillations
        animate(
          scope.current,
          { y: 0 },
          {
            type: 'spring',
            ...rippleReturnSpring,
          }
        );
      });
    }
    // trigger is the key dependency - it changes each time a new wave starts
  }, [
    trigger,
    delay,
    amplitudePx,
    animate,
    scope,
    shouldReduceMotion,
    ripplePushDurationS,
    rippleReturnSpring,
  ]);

  return scope;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({
  event,
  onTap,
  isNew = false,
  index,
  isAnimating = false,
  animationSuccess,
  animationPhase,
  ripple = null,
  glowIntensity,
  priority = false,
  layoutId,
  layoutShiftDelay = null,
  originRef,
  landing = false,
  hideTick = false,
  reveal = false,
}) => {
  const fold = useRevealFold(reveal);
  const shouldReduceMotion = useReducedMotion();
  const tuning = useAnimationTuning();
  const hasLayoutShift = layoutShiftDelay !== null && !shouldReduceMotion;

  // Tuning is the stable DEFAULT_TUNING in the game (module constant context default),
  // so these memos behave exactly like the former module-level constants.
  const springBounce = useMemo(() => makeSpringBounce(tuning), [tuning]);
  const rejectionExit = useMemo(() => makeRejectionExit(tuning), [tuning]);
  const yearPopVariants = useMemo(() => makeYearPopVariants(tuning), [tuning]);

  const { cardAnimationClass, isSuccessAnimation, isErrorAnimation, shouldPopYear, isMovingPhase } =
    useEventAnimations(
      isAnimating,
      animationSuccess,
      animationPhase,
      shouldReduceMotion,
      glowIntensity
    );

  // Imperative ripple animation - triggers once and self-completes
  const rippleScope = useRippleAnimation(ripple, shouldReduceMotion, tuning);

  return (
    <motion.div
      data-timeline-index={index}
      data-reveal-row={reveal || undefined}
      layout={hasLayoutShift ? 'position' : undefined}
      transition={
        hasLayoutShift
          ? {
              layout: {
                type: 'spring',
                ...tuning.wake.layoutShiftSpring,
                delay: layoutShiftDelay,
              },
            }
          : undefined
      }
      className={`w-full py-1 ${isMovingPhase ? 'transition-all duration-400' : ''}`}
    >
      {/* Ripple bump lives on an inner wrapper: animating `y` on the outer row would
          overwrite the layout projection's transform and snap an in-flight wake shift */}
      <motion.div ref={rippleScope} className="flex items-center w-full">
        {/* Year column (fixed 96px width) with tick */}
        <div className="w-24 pl-2 flex items-center justify-end shrink-0">
          <motion.span
            data-timeline-year={event.year}
            variants={yearPopVariants}
            animate={shouldPopYear ? 'pop' : 'idle'}
            className={`text-text font-bold font-mono pr-2 text-right leading-tight ${yearSizeClass(event)}`}
          >
            <YearLabel event={event} />
          </motion.span>
          {!hideTick && <TimelineTick originRef={originRef} landing={landing} glow={landing} />}
        </div>

        {/* Card area - landscape card. The entrance lives on the CARD, not on the row: a
            row-level opacity fade composites onto the gutter, and the tick has to be at full
            strength from its first frame to take the drag marker's place (see TimelineTick).
            Each part of the row now arrives in its own way — the card slides up, the year pops,
            the tick grows out of the marker. */}
        <div className={`flex-1 pl-3 ${isNew ? 'animate-entrance' : ''}`}>
          <motion.button
            onClick={onTap}
            layoutId={layoutId}
            initial={isSuccessAnimation ? springBounce.initial : false}
            animate={isSuccessAnimation ? springBounce.animate : undefined}
            exit={isErrorAnimation ? rejectionExit.exit : undefined}
            // The tall height is inline so it wins over the size classes; `reveal-card` (index.css)
            // transitions between the two and is switched off under reduced motion.
            style={fold.tall ? TALL_STYLE : undefined}
            className={`reveal-card relative w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg overflow-hidden border bg-surface flex flex-row shadow-sm touch-manipulation active:scale-95 z-10 ${fold.ringClass} ${cardAnimationClass}`}
          >
            <RowFaces event={event} priority={priority} fold={fold} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TimelineEvent;
