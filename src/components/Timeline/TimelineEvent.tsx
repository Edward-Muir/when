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
        flex items-center py-1
        ${isNew ? 'animate-entrance' : ''}
        ${animationPhase === 'moving' ? 'transition-all duration-400' : ''}
      `}
    >
      {/* Date side (left) with tick that overlaps timeline */}
      <div className="flex items-center justify-end w-14 sm:w-16 shrink-0">
        <span
          data-timeline-year={event.year}
          className="text-light-text dark:text-dark-text font-bold text-sm sm:text-base font-mono"
        >
          {formatYear(event.year)}
        </span>
        <div className="w-4 h-0.5 bg-accent dark:bg-accent-dark ml-1 -mr-1 z-10" />
      </div>

      {/* Card side (right) - image first, title at bottom */}
      <motion.button
        onClick={onTap}
        initial={isSuccessAnimation ? springBounce.initial : false}
        animate={isSuccessAnimation ? springBounce.animate : undefined}
        exit={isErrorAnimation ? rejectionExit.exit : undefined}
        className={`
          w-36 h-44 sm:w-40 sm:h-48
          rounded-lg overflow-hidden
          border border-light-border dark:border-dark-border
          bg-light-card dark:bg-dark-card
          flex flex-col
          shadow-md dark:shadow-card-rest-dark
          touch-manipulation
          active:scale-95
          z-10
          ml-4
          transition-colors duration-200
          ${cardAnimationClass}
        `}
      >
        {/* Full card is image with title overlay */}
        <div className="flex-1 relative overflow-hidden">
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
                className="text-light-muted dark:text-dark-muted w-10 h-10"
              />
            </div>
          )}

          {/* Title overlay with gradient backdrop for readability */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 pt-8 pb-2">
            <span className="text-white text-ui-card-title line-clamp-2 block font-body drop-shadow-md">
              {event.friendly_name}
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
};

export default TimelineEvent;
