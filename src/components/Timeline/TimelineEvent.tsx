import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HistoricalEvent, AnimationPhase, Category } from '../../types';
import { formatYear } from '../../utils/gameLogic';
import CategoryIcon from '../CategoryIcon';

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

// Wave ripple animation - delay and intensity based on distance from placed card
// Note: flash phase lasts 400ms, so total delay + duration must fit within that window
const RIPPLE_STAGGER_MS = 0.2; // 60ms stagger per card distance
const RIPPLE_DURATION_MS = 0.4; // 250ms animation duration
const BASE_SCALE = 0.95; // Scale for adjacent cards (distance 1)
const SCALE_FALLOFF = 0.01; // Scale increases by 0.01 per card further away

const createRippleAnimation = (distance: number) => {
  // Adjacent cards compress most (0.95), further cards compress less
  const scale = Math.min(BASE_SCALE + (distance - 1) * SCALE_FALLOFF, 0.99);
  return {
    scale: [1, scale, 1],
    transition: {
      duration: RIPPLE_DURATION_MS,
      delay: distance * RIPPLE_STAGGER_MS,
      ease: 'easeInOut' as const,
    },
  };
};

// Compute animation states based on props
function useEventAnimations(
  isAnimating: boolean,
  animationSuccess: boolean | undefined,
  animationPhase: AnimationPhase | undefined,
  rippleDistance: number | undefined,
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

  // Wave ripple animation (distance-based staggered delay)
  const rippleAnimation =
    rippleDistance !== undefined && !shouldReduceMotion
      ? createRippleAnimation(rippleDistance)
      : undefined;

  return {
    cardAnimationClass,
    isSuccessAnimation,
    isErrorAnimation,
    shouldPopYear,
    rippleAnimation,
    isMovingPhase,
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
  rippleDistance,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const {
    cardAnimationClass,
    isSuccessAnimation,
    isErrorAnimation,
    shouldPopYear,
    rippleAnimation,
    isMovingPhase,
  } = useEventAnimations(
    isAnimating,
    animationSuccess,
    animationPhase,
    rippleDistance,
    shouldReduceMotion
  );

  return (
    <motion.div
      data-timeline-index={index}
      animate={rippleAnimation}
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
