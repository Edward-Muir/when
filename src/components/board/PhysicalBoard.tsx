import React, { useMemo, useRef } from 'react';
import { LayoutGroup, useReducedMotion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult, AnimationPhase, FailedPlacement } from '../../types';
import TimelineEvent from '../Timeline/TimelineEvent';
import TombstoneRow from '../Timeline/TombstoneRow';
import Card from '../Card';
import { buildTimelineRows, TimelineRow } from '../../utils/timelineRows';
import { markTimeGaps, TimeGapMark } from '../../utils/boardTime';
import { useBoardWaves } from './useBoardWaves';
import { useCenterFirstCard, useRevealFollow } from './useBoardScroll';
import { useBoardEdges, useEraWash } from './useBoardSense';
import BoardSlot from './BoardSlot';
import TimeGap from './TimeGap';
import EndOfTime from './EndOfTime';

/**
 * The game board, rebuilt beside `Timeline` (not inside it) for the /board-lab preview.
 * Same rows (`TimelineEvent`, `TombstoneRow`), same drag contract (`timeline-zone`
 * droppable; `data-timeline-year` midpoints are the only thing the drag measures), same
 * placement choreography (`useBoardWaves`). What is new is the list around the rows:
 *
 * - physics: the rows part on a spring and a recessed slot opens where the card will land
 *   (`BoardSlot`), instead of a see-through copy of the card; cards sit with depth
 *   (`.board-physics` in index.css).
 * - time: a big jump between neighbours draws as a taller gap with a caption (`TimeGap`),
 *   and the background tone follows the era at the middle of the screen (`useEraWash`).
 * - ends: the runways past the first and last card carry the deep-past and future
 *   watermarks (`EndOfTime`), stretched a little by a pull past the end (`useBoardEdges`).
 *
 * Each is a switch so the preview can A/B it against the shipped behaviour.
 */
export interface BoardFeatures {
  physics: boolean;
  time: boolean;
  ends: boolean;
}

export interface PhysicalBoardProps {
  events: HistoricalEvent[];
  onEventTap: (event: HistoricalEvent) => void;
  failedPlacements?: FailedPlacement[];
  newEventName?: string;
  isDragging: boolean;
  insertionIndex: number | null;
  draggedCard: HistoricalEvent | null;
  isOverTimeline: boolean;
  lastPlacementResult: PlacementResult | null;
  animationPhase: AnimationPhase;
  currentStreak?: number;
  enableCentering?: boolean;
  features: BoardFeatures;
}

// The shipped preview, for the physics-off comparison: a see-through copy of the card.
const GhostCard: React.FC<{ event: HistoricalEvent }> = ({ event }) => (
  <div className="flex items-center w-full py-1 opacity-ghost">
    <div className="w-24 flex items-center justify-end shrink-0">
      <span className="text-text-muted font-bold text-xs sm:text-sm font-mono pr-2">?</span>
      <div className="w-3 h-1 bg-accent shrink-0" />
    </div>
    <div className="flex-1 pl-3">
      <Card event={event} size="landscape" />
    </div>
  </div>
);

/** The gap a row closes: an event closes the gap before it, a tombstone sits in its gap. */
function gapOfRow(row: TimelineRow): number {
  return row.kind === 'event' ? row.realIndex : row.gap;
}

const PhysicalBoard: React.FC<PhysicalBoardProps> = ({
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
  features,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { setNodeRef: setTimelineDropRef } = useDroppable({ id: 'timeline-zone' });

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
  useEraWash(scrollRef, rootRef, features.time, events.length + failedPlacements.length);
  useBoardEdges(scrollRef, rootRef, features.ends);

  const rows = buildTimelineRows(events, failedPlacements);
  const gapMarks = useMemo<(TimeGapMark | null)[]>(
    () => (features.time ? markTimeGaps(events.map((e) => e.year)) : []),
    [events, features.time]
  );

  // The insertion gap being previewed (null when not dragging over the board)
  const ghostGap = isDragging && isOverTimeline && draggedCard !== null ? insertionIndex : null;
  // If that gap holds tombstone(s), the first one hosts the ghost in its own row —
  // the ghost takes the tombstone's place instead of inserting an extra row.
  const ghostHostRowIndex =
    ghostGap === null ? -1 : rows.findIndex((r) => r.kind === 'tombstone' && r.gap === ghostGap);
  const slotGap = ghostHostRowIndex === -1 ? ghostGap : null;

  // Where the card will land, before the event that closes the gap (or after the last)
  const renderSlot = (gap: number) => {
    if (features.physics) return <BoardSlot key={`slot-${gap}`} open={slotGap === gap} />;
    return slotGap === gap && draggedCard ? (
      <GhostCard key={`ghost-${gap}`} event={draggedCard} />
    ) : null;
  };

  const renderTombstoneRow = (
    row: Extract<TimelineRow, { kind: 'tombstone' }>,
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

  const renderEventRow = (row: Extract<TimelineRow, { kind: 'event' }>) => {
    const { event, realIndex: idx } = row;
    const isAnimatingEvent =
      lastPlacementResult?.event.name === event.name && animationPhase !== null;
    const animationSuccess = isAnimatingEvent ? lastPlacementResult?.success : undefined;
    // The rejected card morphs into its tombstone via a shared layoutId
    const isFailedReveal = isAnimatingEvent && animationSuccess === false;
    return (
      <TimelineEvent
        key={event.name}
        event={event}
        onTap={() => onEventTap(event)}
        isNew={event.name === newEventName}
        index={idx}
        isAnimating={isAnimatingEvent}
        animationSuccess={animationSuccess}
        animationPhase={isAnimatingEvent ? animationPhase : null}
        layoutId={isFailedReveal && !shouldReduceMotion ? `placed-${event.name}` : undefined}
        ripple={successWave.get(idx) ?? missWaveBumps.get(event.name) ?? null}
        glowIntensity={isAnimatingEvent ? streakConfig.glowIntensity : undefined}
        layoutShiftDelay={wakeDelays.byName.get(event.name) ?? null}
        priority={idx < 2}
      />
    );
  };

  // Rows in order, each gap led by its time caption (once) and closed by its slot
  const children: React.ReactNode[] = [];
  let ledGap = -1;
  rows.forEach((row, rowIndex) => {
    const gap = gapOfRow(row);
    if (gap !== ledGap) {
      ledGap = gap;
      const mark = gap >= 1 ? gapMarks.at(gap - 1) : null;
      if (mark) children.push(<TimeGap key={`gap-${gap}`} mark={mark} />);
    }
    if (row.kind === 'tombstone') {
      children.push(renderTombstoneRow(row, rowIndex));
      return;
    }
    children.push(renderSlot(row.realIndex), renderEventRow(row));
  });
  children.push(renderSlot(events.length));

  return (
    <div
      ref={rootRef}
      className={`h-full relative era-wash ${features.physics ? 'board-physics' : ''}`}
    >
      {/* Fixed "Earlier" caption; fades once the past watermark is on screen */}
      <div className="board-edge-caption board-edge-caption-past absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 board-edge-fade-top" />
        <div className="absolute top-2 left-0 right-0 text-center text-text-muted opacity-70 text-sm font-medium font-body">
          ↑ Earlier
        </div>
      </div>

      {/* The rail: board-left + 96px, butting against every row's tick (see index.css) */}
      <div className="board-rail absolute top-0 bottom-0 w-1 bg-accent rounded-full z-0" />

      {/* Native scroll; frozen while dragging so the measured year positions hold */}
      <div
        ref={(node) => {
          scrollRef.current = node;
          setTimelineDropRef(node);
        }}
        className={`board-center h-full relative z-10 ${
          isDragging ? 'overflow-hidden' : 'overflow-y-auto timeline-scroll-vertical'
        }`}
      >
        <div className="relative flex flex-col items-start w-full">
          <EndOfTime edge="past" show={features.ends} />
          <LayoutGroup>{children}</LayoutGroup>
          <EndOfTime edge="future" show={features.ends} />
        </div>
      </div>

      {/* Fixed "Later" caption; fades once the future watermark is on screen */}
      <div className="board-edge-caption board-edge-caption-future absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 board-edge-fade-bottom" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-text-muted opacity-70 text-sm font-medium font-body">
          Later ↓
        </div>
      </div>
    </div>
  );
};

export default PhysicalBoard;
