import React, { useRef, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult, AnimationPhase } from '../../types';
import TimelineEvent, { RIPPLE_DURATION_MS } from './TimelineEvent';
import Card from '../Card';
import { getStreakFeedback } from '../../utils/streakFeedback';

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
  // Streak
  currentStreak?: number;
  // Whether placed events should preload their full-size detail image (off in view mode)
  preloadDetailImages?: boolean;
  // Center the first card in the viewport on game start (default false; on in gameplay, off in view mode)
  enableCentering?: boolean;
}

// Ghost card that shows where the dragged card will land
const GhostCard: React.FC<{ event: HistoricalEvent }> = ({ event }) => (
  <div className="flex items-center w-full py-1 opacity-ghost">
    {/* Year column (fixed 96px width) */}
    <div className="w-24 flex items-center justify-end shrink-0">
      <span className="text-text-muted/50 font-bold text-xs sm:text-sm font-mono pr-2">?</span>
      <div className="w-3 h-1 bg-accent/50 shrink-0" />
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
  currentStreak = 0,
  preloadDetailImages = true,
  enableCentering = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasCenteredRef = useRef(false);
  const prevLen = useRef(events.length);

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

  // Get streak-based glow and ripple config
  const streakConfig = useMemo(() => getStreakFeedback(currentStreak), [currentStreak]);

  // Calculate wave animation data: distance from placed card for staggered ripple effect
  const waveDistances = useMemo(() => {
    if (!rippleData) return new Map<number, number>();
    const placedIndex = events.findIndex((e) => e.name === rippleData.placedEventName);
    if (placedIndex === -1) return new Map<number, number>();

    const distances = new Map<number, number>();
    events.forEach((_, idx) => {
      if (idx === placedIndex) return; // Skip the placed card itself
      distances.set(idx, Math.abs(idx - placedIndex));
    });
    return distances;
  }, [rippleData, events]);

  // Re-arm the one-time centering whenever a new game starts (timeline goes empty -> populated)
  useEffect(() => {
    if (prevLen.current === 0 && events.length > 0) {
      hasCenteredRef.current = false;
    }
    prevLen.current = events.length;
  }, [events.length]);

  // Center the first card in the viewport once per game. With the 50vh spacers there is room
  // above and below it to drop the next card "earlier" or "later".
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !enableCentering) return;

    const recenter = () => {
      if (hasCenteredRef.current || events.length === 0) return;
      const first = container.querySelector('[data-timeline-index="0"]') as HTMLElement | null;
      if (!first) return;
      // offsetParent-agnostic: position the first card's center at the viewport's center.
      const cRect = container.getBoundingClientRect();
      const fRect = first.getBoundingClientRect();
      const cardCenter = fRect.top - cRect.top + container.scrollTop + fRect.height / 2;
      container.scrollTop = cardCenter - container.clientHeight / 2;
      hasCenteredRef.current = true;
    };

    recenter();
    // Re-run on rotation / late layout; guarded so it only centers once.
    const ro = new ResizeObserver(recenter);
    ro.observe(container);
    return () => ro.disconnect();
  }, [events.length, enableCentering]);

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

      {/* Native scroll container (compositor-driven = snappy; native elastic overscroll). */}
      {/* Scroll is disabled while dragging a card so year labels stay fixed reference points. */}
      <div
        ref={(node) => {
          scrollRef.current = node;
          setTimelineDropRef(node);
        }}
        className={`h-full relative z-10 ${
          isDragging ? 'overflow-hidden' : 'overflow-y-auto timeline-scroll-vertical'
        }`}
      >
        <div className="relative flex flex-col items-start w-full">
          {/* Top spacer: room to drop "earlier" and center the first card; bounce runway */}
          <div aria-hidden className="shrink-0" style={{ height: '50vh' }} />

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
                  rippleDistance={waveDistances.get(idx)}
                  rippleTrigger={rippleData?.timestamp}
                  glowIntensity={isAnimatingEvent ? streakConfig.glowIntensity : undefined}
                  rippleAmplitudeMultiplier={streakConfig.rippleMultiplier}
                  preloadDetailImages={preloadDetailImages}
                />
                {/* Show ghost card AFTER this event if inserting at idx + 1 */}
                {isDragging && isOverTimeline && insertionIndex === idx + 1 && draggedCard && (
                  <GhostCard event={draggedCard} />
                )}
              </React.Fragment>
            );
          })}

          {/* Bottom spacer: room to drop "later"; bounce runway below the last card */}
          <div aria-hidden className="shrink-0" style={{ height: '50vh' }} />
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
