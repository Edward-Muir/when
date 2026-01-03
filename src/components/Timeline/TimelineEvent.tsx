import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, useAnimate } from 'framer-motion';
import { HistoricalEvent, AnimationPhase, Category } from '../../types';
import { formatYear } from '../../utils/gameLogic';
import CategoryIcon from '../CategoryIcon';

// Export ripple duration for Timeline.tsx to use
export const RIPPLE_DURATION_MS = 2000;

interface TimelineEventProps {
  event: HistoricalEvent;
  onTap: () => void;
  isNew?: boolean;
  index: number; // For data attribute used by closest-centroid algorithm
  // Animation props for placed cards
  isAnimating?: boolean;
  animationSuccess?: boolean;
  animationPhase?: AnimationPhase;
  // Wave ripple: distance from placed card (1 = adjacent, 2 = two away, etc.)
  rippleDistance?: number;
  // Unique ID to trigger ripple animation (timestamp)
  rippleTrigger?: number;
}

// Extracted image section to reduce component complexity
const EventImage: React.FC<{
  imageUrl?: string;
  category: Category;
}> = ({ imageUrl, category }) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = imageUrl && !imageError;

  if (hasImage) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        onError={() => setImageError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-light-border/30 dark:bg-dark-border/30">
      <CategoryIcon category={category} className="text-light-muted dark:text-dark-muted w-8 h-8" />
    </div>
  );
};

// Spring animation for newly placed cards
const springBounce = {
  initial: { scale: 0.95, opacity: 0.8 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

// Enhanced exit animation for rejected cards
const rejectionExit = {
  exit: {
    scale: 0.9,
    opacity: 0,
    rotate: -3,
    x: -20,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
      duration: 0.3,
    },
  },
};

// Year pop animation for successful placement
const yearPopVariants = {
  idle: { scale: 1 },
  pop: {
    scale: [1, 1.3, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.4, 1],
      ease: 'easeOut' as const,
    },
  },
};

// Wave ripple animation constants
const RIPPLE_STAGGER_S = 0.2; // 100ms stagger per card distance
const BASE_Y_OFFSET = 6; // Push DOWN initially (impact effect)
const HALF_LIFE_CARDS = 1.0; // Amplitude halves every 1.25 card distances

// Compute animation states based on props (excludes ripple - handled separately with useAnimate)
function useEventAnimations(
  isAnimating: boolean,
  animationSuccess: boolean | undefined,
  animationPhase: AnimationPhase | undefined,
  shouldReduceMotion: boolean | null
) {
  const isFlashPhase = animationPhase === 'flash';
  const isMovingPhase = animationPhase === 'moving';

  // Card glow class
  const cardAnimationClass =
    isAnimating && isFlashPhase
      ? animationSuccess
        ? 'animate-success-glow'
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
  rippleDistance: number | undefined,
  rippleTrigger: number | undefined,
  shouldReduceMotion: boolean | null
) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (
      rippleDistance !== undefined &&
      rippleDistance > 0 &&
      rippleTrigger !== undefined &&
      !shouldReduceMotion
    ) {
      // Exponential decay: amplitude halves every HALF_LIFE_CARDS distance
      const decayFactor = Math.pow(0.5, (rippleDistance - 1) / HALF_LIFE_CARDS);
      const yOffset = BASE_Y_OFFSET * decayFactor;
      const delay = rippleDistance * RIPPLE_STAGGER_S;

      // Two-phase animation: quick push down, then spring back with oscillations
      // Phase 1: Push down quickly
      animate(
        scope.current,
        { y: yOffset },
        {
          duration: 0.15,
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
            stiffness: 150,
            damping: 4,
            mass: 1,
          }
        );
      });
    }
    // rippleTrigger is the key dependency - it changes each time a new ripple starts
  }, [rippleTrigger, rippleDistance, animate, scope, shouldReduceMotion]);

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
  rippleDistance,
  rippleTrigger,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { cardAnimationClass, isSuccessAnimation, isErrorAnimation, shouldPopYear, isMovingPhase } =
    useEventAnimations(isAnimating, animationSuccess, animationPhase, shouldReduceMotion);

  // Imperative ripple animation - triggers once and self-completes
  const rippleScope = useRippleAnimation(rippleDistance, rippleTrigger, shouldReduceMotion);

  return (
    <motion.div
      ref={rippleScope}
      data-timeline-index={index}
      className={`flex items-center w-full py-1 ${isNew ? 'animate-entrance' : ''} ${isMovingPhase ? 'transition-all duration-400' : ''}`}
    >
      {/* Year column (fixed 96px width) with tick */}
      <div className="w-24 flex items-center justify-end shrink-0">
        <motion.span
          data-timeline-year={event.year}
          variants={yearPopVariants}
          animate={shouldPopYear ? 'pop' : 'idle'}
          className="text-light-text dark:text-dark-text font-bold text-xs sm:text-sm font-mono pr-2 text-right leading-tight"
        >
          {formatYear(event.year)}
        </motion.span>
        <div className="w-3 h-0.5 bg-accent dark:bg-accent-dark shrink-0" />
      </div>

      {/* Card area - landscape card */}
      <div className="flex-1 pl-3">
        <motion.button
          onClick={onTap}
          initial={isSuccessAnimation ? springBounce.initial : false}
          animate={isSuccessAnimation ? springBounce.animate : undefined}
          exit={isErrorAnimation ? rejectionExit.exit : undefined}
          className={`w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card flex flex-row shadow-md dark:shadow-card-rest-dark touch-manipulation active:scale-95 z-10 transition-colors duration-200 ${cardAnimationClass}`}
        >
          {/* Image section (40% width) */}
          <div className="w-[40%] h-full relative overflow-hidden">
            <EventImage imageUrl={event.image_url} category={event.category} />
          </div>
          {/* Title section (60% width) */}
          <div className="w-[60%] h-full flex items-center px-2 py-1">
            <span className="text-light-text dark:text-dark-text text-[11px] sm:text-xs leading-tight line-clamp-3 font-body">
              {event.friendly_name}
            </span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TimelineEvent;
