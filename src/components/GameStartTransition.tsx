import React, { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HistoricalEvent } from '../types';
import TimelineEvent from './Timeline/TimelineEvent';

interface GameStartTransitionProps {
  onComplete: () => void;
  allEvents: HistoricalEvent[];
}

// Animation timing constants
const TOTAL_DURATION = 3000; // ms before auto-complete
const SCROLL_DURATION = 6.0; // seconds for scroll animation (slower)
const EVENT_COUNT = 20; // number of random events to show
const SCROLL_PERCENTAGE = 0.66; // Scroll through 66% of cards (leaving ~8 visible at end)

// Approximate height per timeline event (matches TimelineEvent padding/sizing)
const EVENT_HEIGHT = 88; // ~80px card + 8px padding

// Animated ellipsis with wave effect
const LoadingEllipsis: React.FC = () => (
  <span className="inline-flex">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.15,
          ease: 'easeInOut',
        }}
        className="inline-block"
      >
        .
      </motion.span>
    ))}
  </span>
);

const GameStartTransition: React.FC<GameStartTransitionProps> = ({ onComplete, allEvents }) => {
  const shouldReduceMotion = useReducedMotion();

  // Pick random events, sorted by year for the timeline
  const transitionEvents = useMemo(() => {
    if (allEvents.length === 0) return [];
    const shuffled = [...allEvents].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(EVENT_COUNT, allEvents.length));
    return selected.sort((a, b) => a.year - b.year);
  }, [allEvents]);

  // Calculate scroll distance - scroll upward through 66% of events
  // This leaves ~8 cards visible on screen at the end of the animation
  const totalEventsHeight = transitionEvents.length * EVENT_HEIGHT;
  const scrollDistance = totalEventsHeight * SCROLL_PERCENTAGE;

  // Auto-complete after total duration
  useEffect(() => {
    const timeout = setTimeout(
      () => {
        onComplete();
      },
      shouldReduceMotion ? 500 : TOTAL_DURATION
    );

    return () => clearTimeout(timeout);
  }, [onComplete, shouldReduceMotion]);

  // Reduced motion: simple fade with static text
  if (shouldReduceMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-dvh min-h-screen-safe flex items-center justify-center bg-bg transition-colors"
      >
        <div className="bg-bg/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-xl border border-border">
          <h1 className="text-text font-display text-xl text-center">
            Loading events from across time...
          </h1>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-dvh min-h-screen-safe bg-bg transition-colors relative overflow-hidden"
    >
      {/* Timeline content - full height, scrolls upward */}
      <div className="h-dvh h-screen-safe relative">
        {/* Vertical timeline line - positioned at 96px like Timeline.tsx */}
        <div className="absolute left-24 top-0 bottom-0 w-1 bg-accent rounded-full z-0" />

        {/* Scrolling events container - scrolls upward through the events */}
        <motion.div
          className="relative z-10 pt-16 pb-12"
          initial={{ y: 0 }}
          animate={{ y: -scrollDistance }}
          transition={{
            duration: SCROLL_DURATION,
            ease: 'linear',
          }}
        >
          {transitionEvents.map((event, index) => (
            <TimelineEvent
              key={event.name}
              event={event}
              onTap={() => {}} // No-op during transition
              index={index}
            />
          ))}
        </motion.div>
      </div>

      {/* Fade overlays */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-bg via-bg/90 to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg via-bg/90 to-transparent z-20 pointer-events-none" />

      {/* Semi-transparent overlay with text + animated ellipsis */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <div className="bg-bg/85 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-xl border border-border/50">
          <h1 className="text-text font-display text-xl text-center">
            Loading events from across time
            <LoadingEllipsis />
          </h1>
        </div>
      </div>
    </motion.div>
  );
};

export default GameStartTransition;
