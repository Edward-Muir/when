import React, { useRef, useLayoutEffect } from 'react';
import { LayoutGroup, useReducedMotion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult, AnimationPhase, FailedPlacement } from '../../types';
import TimelineEvent from './TimelineEvent';
import TombstoneRow from './TombstoneRow';
import Card from '../Card';
import { buildTimelineRows } from '../../utils/timelineRows';
import { useBoardWaves } from '../board/useBoardWaves';
import { useCenterFirstCard, useRevealFollow } from '../board/useBoardScroll';

interface TimelineProps {
  events: HistoricalEvent[];
  onEventTap: (event: HistoricalEvent) => void;
  // Failed placements shown as display-only tombstones at their true position
  failedPlacements?: FailedPlacement[];
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
  // Center the first card in the viewport on game start (default false; on in gameplay, off in view mode)
  enableCentering?: boolean;
  // Open scrolled to the middle (median) event instead of the top (default false; on in view mode)
  startAtMiddle?: boolean;
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

// The placement choreography (success ripple, miss wake, reveal FLIP timing) and the two
// viewport moves (centre the first card, follow a rejected card) live in
// `components/board/`, shared with the physical board.
const Timeline: React.FC<TimelineProps> = ({
  events,
  onEventTap,
  failedPlacements = [],
  newEventName,
  isDragging,
  insertionIndex,
  draggedCard,
  isOverTimeline,
  lastPlacementResult,
  animationPhase,
  currentStreak = 0,
  enableCentering = false,
  startAtMiddle = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledMiddleRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  // Make the entire timeline a single drop zone
  const { setNodeRef: setTimelineDropRef } = useDroppable({
    id: 'timeline-zone',
  });

  const {
    streakConfig,
    successWave,
    missWaveBumps,
    wakeDelays,
    missTravelMs,
    revealingFailedName,
  } = useBoardWaves({ events, lastPlacementResult, animationPhase, currentStreak });

  useCenterFirstCard(scrollRef, events.length, enableCentering);
  useRevealFollow(scrollRef, failedPlacements, lastPlacementResult);

  // View mode: open scrolled to the middle (median) event instead of the empty top spacer.
  // Cards are fixed-height, so scrollHeight is stable as images lazy-load — the median card
  // stays put. Guarded to run once per load.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !startAtMiddle) return;

    const centerMiddle = () => {
      if (hasScrolledMiddleRef.current || events.length === 0) return;
      const midIdx = Math.floor((events.length - 1) / 2);
      const mid = container.querySelector(
        `[data-timeline-index="${midIdx}"]`
      ) as HTMLElement | null;
      if (!mid) return;
      const cRect = container.getBoundingClientRect();
      const mRect = mid.getBoundingClientRect();
      const cardCenter = mRect.top - cRect.top + container.scrollTop + mRect.height / 2;
      container.scrollTop = cardCenter - container.clientHeight / 2;
      hasScrolledMiddleRef.current = true;
    };

    centerMiddle();
    const ro = new ResizeObserver(centerMiddle);
    ro.observe(container);
    return () => ro.disconnect();
  }, [events.length, startAtMiddle]);

  const rows = buildTimelineRows(events, failedPlacements);
  // The insertion gap the ghost currently previews (null when not dragging over the timeline)
  const ghostGap = isDragging && isOverTimeline && draggedCard !== null ? insertionIndex : null;
  // If that gap holds tombstone(s), the first one hosts the ghost in its own row —
  // the ghost takes the tombstone's place instead of inserting an extra row.
  const ghostHostRowIndex =
    ghostGap === null ? -1 : rows.findIndex((r) => r.kind === 'tombstone' && r.gap === ghostGap);

  const renderTombstoneRow = (
    row: Extract<ReturnType<typeof buildTimelineRows>[number], { kind: 'tombstone' }>,
    rowIndex: number
  ) => {
    const { failed } = row;
    const isRevealTarget = revealingFailedName === failed.event.name;
    return (
      <TombstoneRow
        key={`tombstone-${failed.event.name}`}
        failed={failed}
        onTap={() => onEventTap(failed.event)}
        displaced={ghostGap !== null && row.gap === ghostGap}
        ghostEvent={rowIndex === ghostHostRowIndex ? draggedCard : null}
        // layoutId only during the reveal FLIP — permanent layoutId would
        // smoothly layout-animate vertical moves while real cards snap
        revealing={isRevealTarget}
        travelMs={isRevealTarget ? missTravelMs : undefined}
        layoutShiftDelay={
          isRevealTarget
            ? null
            : (wakeDelays.byIndex.get(row.gap) ?? wakeDelays.byIndex.get(row.gap - 1) ?? null)
        }
      />
    );
  };

  return (
    <div className="h-full relative">
      {/* Fixed "Earlier" indicator at top with fade */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-b from-bg via-bg/90 to-transparent" />
        <div className="absolute top-2 left-0 right-0 text-center text-text-muted/70 text-sm font-medium font-body">
          ↑ Earlier
        </div>
      </div>

      {/* Vertical timeline line — sits at board-left + 96px, butting against every row's
          tick. `board-rail` carries both the offset and the desktop centring; see the
          "BOARD COLUMN" comment in index.css. */}
      <div className="board-rail absolute top-0 bottom-0 w-1 bg-accent rounded-full z-0" />

      {/* Native scroll container (compositor-driven = snappy; native elastic overscroll). */}
      {/* Scroll is disabled while dragging a card so year labels stay fixed reference points. */}
      <div
        ref={(node) => {
          scrollRef.current = node;
          setTimelineDropRef(node);
        }}
        // `board-center` is padding, not max-width: this node is the `timeline-zone`
        // droppable and its rect must stay full-width, so a drop (or a wheel) in the empty
        // space beside the centred board still lands here. See index.css.
        className={`board-center h-full relative z-10 ${
          isDragging ? 'overflow-hidden' : 'overflow-y-auto timeline-scroll-vertical'
        }`}
      >
        <div className="relative flex flex-col items-start w-full">
          {/* Top spacer: room to drop "earlier" and center the first card; bounce runway */}
          <div aria-hidden className="shrink-0" style={{ height: '50vh' }} />

          {/* Events (with inline ghost cards at insertion points) and tombstones */}
          <LayoutGroup>
            {rows.map((row, rowIndex) => {
              if (row.kind === 'tombstone') {
                return renderTombstoneRow(row, rowIndex);
              }

              const { event, realIndex: idx } = row;
              // Check if this event is the one being animated
              const isAnimatingEvent =
                lastPlacementResult?.event.name === event.name && animationPhase !== null;
              const animationSuccess = isAnimatingEvent ? lastPlacementResult?.success : undefined;
              // The rejected card morphs into its tombstone via a shared layoutId
              const isFailedReveal = isAnimatingEvent && animationSuccess === false;

              return (
                <React.Fragment key={event.name}>
                  {/* Ghost card before this event when its gap is here and no tombstone hosts it */}
                  {ghostGap === idx && ghostHostRowIndex === -1 && draggedCard && (
                    <GhostCard event={draggedCard} />
                  )}
                  <TimelineEvent
                    event={event}
                    onTap={() => onEventTap(event)}
                    isNew={event.name === newEventName}
                    index={idx}
                    isAnimating={isAnimatingEvent}
                    animationSuccess={animationSuccess}
                    animationPhase={isAnimatingEvent ? animationPhase : null}
                    layoutId={
                      isFailedReveal && !shouldReduceMotion ? `placed-${event.name}` : undefined
                    }
                    ripple={successWave.get(idx) ?? missWaveBumps.get(event.name) ?? null}
                    glowIntensity={isAnimatingEvent ? streakConfig.glowIntensity : undefined}
                    layoutShiftDelay={wakeDelays.byName.get(event.name) ?? null}
                    // Eagerly load the first couple of cards — they're the LCP element.
                    priority={idx < 2}
                  />
                </React.Fragment>
              );
            })}

            {/* Ghost card after the last event (or on an empty timeline) */}
            {ghostGap === events.length && ghostHostRowIndex === -1 && draggedCard && (
              <GhostCard event={draggedCard} />
            )}
          </LayoutGroup>

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
