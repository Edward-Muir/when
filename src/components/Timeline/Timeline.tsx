import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult, AnimationPhase } from '../../types';
import TimelineEvent, { RIPPLE_DURATION_MS } from './TimelineEvent';
import Card from '../Card';

interface TimelineProps {
  events: HistoricalEvent[];
  onEventTap: (event: HistoricalEvent) => void;
  newEventName?: string; // Name of newly added event for animation
  // Drag and drop props
  isDragging: boolean;
  insertionIndex: number | null;
  draggedCard: HistoricalEvent | null;
  isOverTimeline: boolean;
  // Animation props
  lastPlacementResult: PlacementResult | null;
  animationPhase: AnimationPhase;
}

// Ghost card that shows where the dragged card will land
const GhostCard: React.FC<{ event: HistoricalEvent }> = ({ event }) => (
  <div className="flex items-center w-full py-1 opacity-ghost">
    {/* Year column (fixed 96px width) */}
    <div className="w-24 flex items-center justify-end shrink-0">
      <span className="text-text-muted/50 font-bold text-xs sm:text-sm font-mono pr-2">?</span>
      <div className="w-3 h-0.5 bg-accent/50 shrink-0" />
    </div>
    {/* Card area */}
    <div className="flex-1 pl-3">
      <Card event={event} size="landscape" />
    </div>
  </div>
);

const Timeline: React.FC<TimelineProps> = ({
  events,
  onEventTap,
  newEventName,
  isDragging,
  insertionIndex,
  draggedCard,
  isOverTimeline,
  lastPlacementResult,
  animationPhase,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolled = useRef(false);

  // Make the entire timeline a single drop zone
  const { setNodeRef: setTimelineDropRef } = useDroppable({
    id: 'timeline-zone',
  });

  // Store ripple data independently from animation phase so it can complete fully
  const [rippleData, setRippleData] = useState<{
    placedEventName: string;
    timestamp: number;
  } | null>(null);

  // Trigger ripple when a successful placement happens
  useEffect(() => {
    if (lastPlacementResult?.success && animationPhase === 'flash') {
      setRippleData({
        placedEventName: lastPlacementResult.event.name,
        timestamp: Date.now(),
      });
    }
  }, [lastPlacementResult, animationPhase]);

  // Clear ripple after animation completes (~2 seconds for 3 oscillations)
  useEffect(() => {
    if (rippleData) {
      const timer = setTimeout(() => setRippleData(null), RIPPLE_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [rippleData]);

  // Calculate wave animation data: distance from placed card for staggered ripple effect
  const waveDistances = useMemo(() => {
    if (!rippleData) return {};
    const placedIndex = events.findIndex((e) => e.name === rippleData.placedEventName);
    if (placedIndex === -1) return {};

    const distances: Record<number, number> = {};
    events.forEach((_, idx) => {
      if (idx === placedIndex) return; // Skip the placed card itself
      distances[idx] = Math.abs(idx - placedIndex);
    });
    return distances;
  }, [rippleData, events]);

  // Center the timeline content vertically on initial load
  useEffect(() => {
    if (!hasInitialScrolled.current && scrollRef.current && events.length > 0) {
      // Small delay to allow the DOM to render
      setTimeout(() => {
        const container = scrollRef.current;
        if (container) {
          // Scroll to center the content vertically
          const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
          container.scrollTop = scrollTop;
          hasInitialScrolled.current = true;
        }
      }, 50);
    }
  }, [events.length]);

  // Auto-scroll to show the new event when added
  useEffect(() => {
    if (newEventName && scrollRef.current) {
      // Small delay to allow the DOM to update
      setTimeout(() => {
        const container = scrollRef.current;
        if (container) {
          // Scroll to center
          container.scrollTo({
            top: container.scrollHeight / 2 - container.clientHeight / 2,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  }, [newEventName, events.length]);

  return (
    <div className="h-full relative">
      {/* Fixed "Earlier" indicator at top with fade */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-b from-bg via-bg/90 to-transparent" />
        <div className="absolute top-2 left-0 right-0 text-center text-text-muted/70 text-sm font-medium font-body">
          ↑ Earlier
        </div>
      </div>

      {/* Vertical timeline line - positioned at 96px (matches year column width) */}
      <div className="absolute left-24 top-0 bottom-0 w-1 bg-accent rounded-full z-0" />

      {/* Scrollable timeline content - entire area is a single drop zone */}
      {/* Scroll is disabled while dragging so year labels stay fixed as reference points */}
      <div
        ref={(node) => {
          // Combine refs: scrollRef for scroll behavior, setTimelineDropRef for drop zone
          scrollRef.current = node;
          setTimelineDropRef(node);
        }}
        className={`h-full pt-16 pb-12 relative z-10 ${
          isDragging ? 'overflow-hidden' : 'overflow-y-auto timeline-scroll-vertical'
        }`}
      >
        <div className="relative flex flex-col items-start min-h-full w-full">
          {/* Ghost card at position 0 if inserting at start */}
          {isDragging && isOverTimeline && insertionIndex === 0 && draggedCard && (
            <GhostCard event={draggedCard} />
          )}

          {/* Events with inline ghost cards at insertion points */}
          {events.map((event, idx) => {
            // Check if this event is the one being animated
            const isAnimatingEvent =
              lastPlacementResult?.event.name === event.name && animationPhase !== null;
            const animationSuccess = isAnimatingEvent ? lastPlacementResult?.success : undefined;

            return (
              <React.Fragment key={event.name}>
                <TimelineEvent
                  event={event}
                  onTap={() => onEventTap(event)}
                  isNew={event.name === newEventName}
                  index={idx}
                  isAnimating={isAnimatingEvent}
                  animationSuccess={animationSuccess}
                  animationPhase={isAnimatingEvent ? animationPhase : null}
                  rippleDistance={waveDistances[idx]}
                  rippleTrigger={rippleData?.timestamp}
                />
                {/* Show ghost card AFTER this event if inserting at idx + 1 */}
                {isDragging && isOverTimeline && insertionIndex === idx + 1 && draggedCard && (
                  <GhostCard event={draggedCard} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Fixed "Later" indicator at bottom with fade */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-t from-bg via-bg/90 to-transparent" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-text-muted/70 text-sm font-medium font-body">
          Later ↓
        </div>
      </div>
    </div>
  );
};

export default Timeline;
