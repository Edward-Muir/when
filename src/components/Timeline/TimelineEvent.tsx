import React, { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion, useAnimate } from 'framer-motion';
import { HistoricalEvent, AnimationPhase, Category } from '../../types';
import { formatYear } from '../../utils/gameLogic';
import CategoryIcon from '../CategoryIcon';
import { type GlowIntensity } from '../../utils/streakFeedback';
import { getEventColorStyle, getEventTextClass } from '../../utils/eventColor';
import { getImageUrl } from '../../utils/cloudinaryImage';
import { useImagePreload } from '../../hooks/useImagePreload';
import { AnimationTuning, useAnimationTuning } from './animationTuning';

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
  // Whether to preload the full-size detail image (disabled on the View Timeline page)
  preloadDetailImages?: boolean;
  // Above-the-fold cards: load eagerly + high priority so they don't drag LCP down.
  // Defaults to lazy so off-screen events keep deferring their image download.
  priority?: boolean;
  // Shared layout id so a rejected card can morph into its tombstone (FLIP reveal)
  layoutId?: string;
  // Miss-reveal wake: when set, this row's one-row displacement (the failed card vacating /
  // the tombstone inserting) is layout-animated with this delay (s) so cards ripple out of
  // the mover's way in passage order. Null/undefined = no layout animation (rows snap).
  layoutShiftDelay?: number | null;
}

// Extracted image section to reduce component complexity
const EventImage: React.FC<{
  imageUrl?: string;
  category: Category;
  priority?: boolean;
}> = ({ imageUrl, category, priority = false }) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = imageUrl && !imageError;

  if (hasImage) {
    return (
      <img
        src={getImageUrl(imageUrl, 'thumbnail')}
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onError={() => setImageError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-border/30">
      <CategoryIcon category={category} className="text-text-muted w-8 h-8" />
    </div>
  );
};

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
  preloadDetailImages = true,
  priority = false,
  layoutId,
  layoutShiftDelay = null,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const tuning = useAnimationTuning();
  const hasLayoutShift = layoutShiftDelay !== null && !shouldReduceMotion;

  // Tuning is the stable DEFAULT_TUNING in the game (module constant context default),
  // so these memos behave exactly like the former module-level constants.
  const springBounce = useMemo(() => makeSpringBounce(tuning), [tuning]);
  const rejectionExit = useMemo(() => makeRejectionExit(tuning), [tuning]);
  const yearPopVariants = useMemo(() => makeYearPopVariants(tuning), [tuning]);

  // Warm the full-size detail image so tapping this event opens its popup instantly.
  // Disabled on the View Timeline page, where every event renders at once.
  useImagePreload(preloadDetailImages ? getImageUrl(event.image_url, 'detail') : undefined);

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
      className={`w-full py-1 ${isNew ? 'animate-entrance' : ''} ${isMovingPhase ? 'transition-all duration-400' : ''}`}
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
            className="text-text font-bold text-sm font-mono pr-2 text-right leading-tight"
          >
            {formatYear(event.year)}
          </motion.span>
          <div className="w-3 h-1 bg-accent shrink-0" />
        </div>

        {/* Card area - landscape card */}
        <div className="flex-1 pl-3">
          <motion.button
            onClick={onTap}
            layoutId={layoutId}
            initial={isSuccessAnimation ? springBounce.initial : false}
            animate={isSuccessAnimation ? springBounce.animate : undefined}
            exit={isErrorAnimation ? rejectionExit.exit : undefined}
            className={`w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg overflow-hidden border border-border bg-surface flex flex-row shadow-sm touch-manipulation active:scale-95 z-10 transition-colors duration-200 ${cardAnimationClass}`}
          >
            {/* Image section (40% width) */}
            <div className="w-[40%] h-full relative overflow-hidden">
              <EventImage
                imageUrl={event.image_url}
                category={event.category}
                priority={priority}
              />
            </div>
            {/* Title section (60% width) */}
            <div
              className="w-[60%] h-full flex items-center px-2 py-1"
              style={getEventColorStyle(event)}
            >
              <span
                className={`${getEventTextClass(event)} text-sm leading-tight line-clamp-3 font-body`}
              >
                {event.friendly_name}
              </span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TimelineEvent;
