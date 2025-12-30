import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HistoricalEvent, AnimationPhase } from '../../types';
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
}

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

const TimelineEvent: React.FC<TimelineEventProps> = ({
  event,
  onTap,
  isNew = false,
  index,
  isAnimating = false,
  animationSuccess,
  animationPhase,
}) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = event.image_url && !imageError;
  const shouldReduceMotion = useReducedMotion();

  // Determine animation class for the card
  let cardAnimationClass = '';
  if (isAnimating && animationPhase === 'flash') {
    cardAnimationClass = animationSuccess ? 'animate-success-glow' : 'animate-error-pulse';
  }

  // Use spring animation for newly placed cards (success), rejection animation for errors
  const shouldAnimate = isAnimating && !shouldReduceMotion;
  const isSuccessAnimation = shouldAnimate && animationSuccess;
  const isErrorAnimation = shouldAnimate && !animationSuccess && animationPhase === 'moving';

  return (
    <div
      data-timeline-index={index}
      className={`
        flex items-center w-full py-1
        ${isNew ? 'animate-entrance' : ''}
        ${animationPhase === 'moving' ? 'transition-all duration-400' : ''}
      `}
    >
      {/* Year column (fixed 96px width) with tick */}
      <div className="w-24 flex items-center justify-end shrink-0">
        <span
          data-timeline-year={event.year}
          className="text-light-text dark:text-dark-text font-bold text-xs sm:text-sm font-mono pr-2 text-right leading-tight"
        >
          {formatYear(event.year)}
        </span>
        <div className="w-3 h-0.5 bg-accent dark:bg-accent-dark shrink-0" />
      </div>

      {/* Card area - landscape card */}
      <div className="flex-1 pl-3">
        <motion.button
          onClick={onTap}
          initial={isSuccessAnimation ? springBounce.initial : false}
          animate={isSuccessAnimation ? springBounce.animate : undefined}
          exit={isErrorAnimation ? rejectionExit.exit : undefined}
          className={`
            w-[240px] h-[80px] sm:w-[280px] sm:h-[96px]
            rounded-lg overflow-hidden
            border border-light-border dark:border-dark-border
            bg-light-card dark:bg-dark-card
            flex flex-row
            shadow-md dark:shadow-card-rest-dark
            touch-manipulation
            active:scale-95
            z-10
            transition-colors duration-200
            ${cardAnimationClass}
          `}
        >
          {/* Image section (40% width) */}
          <div className="w-[40%] h-full relative overflow-hidden">
            {hasImage ? (
              <img
                src={event.image_url}
                alt=""
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-light-border/30 dark:bg-dark-border/30">
                <CategoryIcon
                  category={event.category}
                  className="text-light-muted dark:text-dark-muted w-8 h-8"
                />
              </div>
            )}
          </div>
          {/* Title section (60% width) */}
          <div className="w-[60%] h-full flex items-center px-2 py-1">
            <span className="text-light-text dark:text-dark-text text-[11px] sm:text-xs leading-tight line-clamp-3 font-body">
              {event.friendly_name}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default TimelineEvent;
