import React, { CSSProperties, useEffect, useMemo } from 'react';
import { motion, useReducedMotion, useAnimate } from 'framer-motion';
import { HistoricalEvent, AnimationPhase } from '../../types';
import { YearLabel, yearSizeClass } from './YearLabel';
import CardFace from '../CardFace';
import { type GlowIntensity } from '../../utils/streakFeedback';
import { AnimationTuning, useAnimationTuning } from './animationTuning';
import TimelineTick from './TimelineTick';
import type { Point } from './tickLanding';
import { sampleShock, shockDurationS } from './shockwave';

// One scheduled wave bump for this row: Timeline computes when (delay) and how hard
// (amplitudePx); trigger is a timestamp identifying the wave instance.
export interface RippleSpec {
  delay: number;
  /** Signed for a `shock` (negative lifts the row); the dip depth for an `impact`. */
  amplitudePx: number;
  trigger: number;
  /**
   * Unset: a miss-wake bump (push down, spring back). `shock`: a row kicked by the success
   * shockwave. `impact`: the placed card itself, which dips and glows and whose row stays put.
   */
  kind?: 'shock' | 'impact';
  /** `shock` only: when the rail light is on this row (s), and how bright it is here, 0..1. */
  flashDelay?: number;
  strength?: number;
  /** `impact` only: size multiplier for the card's glow. */
  glowScale?: number;
  /** The wave's colour, as a CSS colour. */
  color?: string;
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
}

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

// CSS custom properties, which React's CSSProperties does not know about.
type CssVars = CSSProperties & Record<`--${string}`, string | number>;

// The placed card's glow: one keyframe, coloured by the streak tier and sized by the streak.
function glowStyle(intensity: GlowIntensity | undefined, impact: RippleSpec | null): CssVars {
  return {
    '--shock-color': intensity === 'golden' ? 'var(--color-accent)' : 'var(--color-success)',
    '--shock-glow': impact?.glowScale ?? 1,
  };
}

// A row the shockwave passes: its year and tick flash as the rail light reaches it.
function flashStyle(shock: RippleSpec | null): CssVars | undefined {
  if (!shock) return undefined;
  const strength = shock.strength ?? 0;
  return {
    '--shock-color': shock.color ?? 'var(--color-success)',
    '--shock-delay': `${shock.flashDelay ?? 0}s`,
    '--shock-mix': `${Math.round(strength * 100)}%`,
    '--shock-strength': strength,
  };
}

// Compute animation states based on props (excludes ripple - handled separately with useAnimate)
function useEventAnimations(
  isAnimating: boolean,
  animationSuccess: boolean | undefined,
  animationPhase: AnimationPhase | undefined,
  shouldReduceMotion: boolean | null
) {
  const isFlashPhase = animationPhase === 'flash';
  const isMovingPhase = animationPhase === 'moving';

  // Card glow class. The success glow takes its colour and size from `glowStyle`.
  const cardAnimationClass =
    isAnimating && isFlashPhase
      ? animationSuccess
        ? 'animate-shock-glow'
        : 'animate-error-pulse'
      : '';

  // Exit animation (requires motion enabled)
  const canAnimate = isAnimating && !shouldReduceMotion;
  const isErrorAnimation = canAnimate && !animationSuccess && isMovingPhase;

  // Year pop (require motion enabled)
  const shouldPopYear = isAnimating && animationSuccess && isFlashPhase && !shouldReduceMotion;

  return {
    cardAnimationClass,
    isErrorAnimation,
    shouldPopYear,
    isMovingPhase,
  };
}

// The success shockwave: one damped pulse, played as a single linear tween through its samples.
// A passing row is kicked along `y`; the placed card dips and squashes into the rail.
function shockKeyframes(
  kind: 'shock' | 'impact',
  amplitudePx: number,
  shock: AnimationTuning['shock']
) {
  const pulse = sampleShock(1, shock);
  const y = pulse.map((p) => p * amplitudePx);
  if (kind === 'shock') return { y };
  const squash = 0.012 * amplitudePx;
  return {
    y,
    scaleX: pulse.map((p) => 1 + 0.5 * squash * p),
    scaleY: pulse.map((p) => 1 - squash * p),
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
  const kind = ripple?.kind;
  const { ripplePushDurationS, rippleReturnSpring } = tuning.success;
  const shock = tuning.shock;

  useEffect(() => {
    if (
      delay === undefined ||
      amplitudePx === undefined ||
      trigger === undefined ||
      amplitudePx === 0 ||
      shouldReduceMotion
    ) {
      return;
    }
    if (kind) {
      animate(scope.current, shockKeyframes(kind, amplitudePx, shock), {
        duration: shockDurationS(shock),
        ease: 'linear',
        delay,
      });
      return;
    }
    // The miss wake. Two-phase animation: quick push down, then spring back with oscillations
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
    // trigger is the key dependency - it changes each time a new wave starts
  }, [
    trigger,
    delay,
    amplitudePx,
    kind,
    shock,
    animate,
    scope,
    shouldReduceMotion,
    ripplePushDurationS,
    rippleReturnSpring,
  ]);

  return scope;
}

// Everything a wave does to this row. The placed card's own dip is an `impact` and moves only
// the card; anything else moves the whole row. Each animation triggers once and self-completes.
function useRowWaves(
  ripple: RippleSpec | null,
  shouldReduceMotion: boolean | null,
  tuning: AnimationTuning
) {
  const impact = ripple?.kind === 'impact' ? ripple : null;
  const shock = ripple?.kind === 'shock' && !shouldReduceMotion ? ripple : null;
  const rippleScope = useRippleAnimation(impact ? null : ripple, shouldReduceMotion, tuning);
  const impactScope = useRippleAnimation(impact, shouldReduceMotion, tuning);
  return {
    rippleScope,
    impactScope,
    impact,
    shock,
    flash: flashStyle(shock),
    // Re-keyed per wave so the CSS flash restarts on every placement.
    flashKey: shock ? `shock-${shock.trigger}` : 'rest',
  };
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
}) => {
  const shouldReduceMotion = useReducedMotion();
  const tuning = useAnimationTuning();
  const hasLayoutShift = layoutShiftDelay !== null && !shouldReduceMotion;

  // Tuning is the stable DEFAULT_TUNING in the game (module constant context default),
  // so these memos behave exactly like the former module-level constants.
  const rejectionExit = useMemo(() => makeRejectionExit(tuning), [tuning]);
  const yearPopVariants = useMemo(() => makeYearPopVariants(tuning), [tuning]);

  const { cardAnimationClass, isErrorAnimation, shouldPopYear, isMovingPhase } = useEventAnimations(
    isAnimating,
    animationSuccess,
    animationPhase,
    shouldReduceMotion
  );

  const { rippleScope, impactScope, impact, shock, flash, flashKey } = useRowWaves(
    ripple,
    shouldReduceMotion,
    tuning
  );

  return (
    <motion.div
      data-timeline-index={index}
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
            key={`year-${flashKey}`}
            data-timeline-year={event.year}
            variants={yearPopVariants}
            animate={shouldPopYear ? 'pop' : 'idle'}
            style={flash}
            className={`text-text font-bold font-mono pr-2 text-right leading-tight ${yearSizeClass(event)} ${shock ? 'shock-flash-year' : ''}`}
          >
            <YearLabel event={event} />
          </motion.span>
          {!hideTick && (
            <TimelineTick
              key={`tick-${flashKey}`}
              originRef={originRef}
              landing={landing}
              glow={landing}
              flash={flash}
            />
          )}
        </div>

        {/* Card area - landscape card. The entrance lives on the CARD, not on the row: a
            row-level opacity fade composites onto the gutter, and the tick has to be at full
            strength from its first frame to take the drag marker's place (see TimelineTick).
            Each part of the row now arrives in its own way — the card slides up, the year pops,
            the tick grows out of the marker. A correct landing skips the slide: that card drops
            INTO the rail (the `impact` dip), and rising up from below would contradict it. */}
        <div className={`flex-1 pl-3 ${isNew && !landing ? 'animate-entrance' : ''}`}>
          <motion.button
            // What the game-over gallery measures to fly this card's art from. See
            // `useGalleryTravel`.
            data-board-card={event.name}
            onClick={onTap}
            layoutId={layoutId}
            ref={impactScope}
            style={
              cardAnimationClass === 'animate-shock-glow'
                ? glowStyle(glowIntensity, impact)
                : undefined
            }
            exit={isErrorAnimation ? rejectionExit.exit : undefined}
            className={`w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg overflow-hidden border border-border bg-surface flex flex-row shadow-sm touch-manipulation active:scale-95 z-10 transition-colors duration-200 ${cardAnimationClass}`}
          >
            <CardFace event={event} priority={priority} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TimelineEvent;
