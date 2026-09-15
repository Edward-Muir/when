import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { animate, LayoutGroup, useReducedMotion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult, AnimationPhase, FailedPlacement } from '../../types';
import TimelineEvent from './TimelineEvent';
import TombstoneRow from './TombstoneRow';
import TimelineRail, { RailExtension } from './TimelineRail';
import TimelineMarker, { MarkerPhase } from './TimelineMarker';
import { GHOST_ROW_ATTR, useInsertionMarker } from './useInsertionMarker';
import { useRailGrowth } from './useRailGrowth';
import Card from '../Card';
import { getStreakFeedback } from '../../utils/streakFeedback';
import { buildTimelineRows } from '../../utils/timelineRows';
import TimelineTick from './TimelineTick';
import type { Point } from './tickLanding';
import { usePaperField } from './usePaperField';
import { useTimelineWaves } from './useTimelineWaves';
import { useWakeDelays } from './useWakeDelays';
import {
  AnimationTuning,
  getMissTravelMs,
  TRAVEL_EASE,
  useAnimationTuning,
} from './animationTuning';

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
  /**
   * Stretches the rail's growth animation in time. 1 everywhere in the app; only the
   * screenshot harness raises it, because the spring is quicker than a screenshot.
   */
  railTimeScale?: number;
}

/**
 * One board row: the rail segment for this row, plus whatever the row is. The rail is drawn per
 * row rather than as one full-height bar so it spans exactly the rows that exist — the runway
 * above the first card and below the last is bare paper, and the line is the thing the player
 * has built. Per row also keeps it aligned to the ticks by construction at any row height (see
 * the BOARD COLUMN invariant in index.css).
 */
const BoardRow: React.FC<{
  first: boolean;
  last: boolean;
  extending?: RailExtension | null;
  grow?: boolean;
  timeScale: number;
  /** This row is where the ghost card currently sits — the insertion marker homes in on it. */
  ghost?: boolean;
  children: React.ReactNode;
}> = ({ first, last, extending = null, grow = true, timeScale, ghost = false, children }) => (
  <div {...(ghost ? { [GHOST_ROW_ATTR]: '' } : {})} className="relative w-full">
    <TimelineRail
      first={first}
      last={last}
      extending={extending}
      grow={grow}
      timeScale={timeScale}
    />
    {children}
  </div>
);

// Ghost card that shows where the dragged card will land
const GhostCard: React.FC<{ event: HistoricalEvent }> = ({ event }) => (
  <div className="flex items-center w-full py-1 opacity-ghost">
    {/* Year column (fixed 96px width) */}
    <div className="w-24 flex items-center justify-end shrink-0">
      <span className="text-text-muted/50 font-bold text-xs sm:text-sm font-mono pr-2">?</span>
      {/* No dash at all, only its footprint. The gap the drag is previewing is where the lit
          marker is sitting, and the marker's whole point is that it BECOMES the dash when the
          card lands — a dash already drawn here leaves the landing with nothing to reveal. */}
      <TimelineTick variant="none" />
    </div>
    {/* Card area */}
    <div className="flex-1 pl-3">
      <Card event={event} size="landscape" />
    </div>
  </div>
);

// Camera-follow the rejected card: glide the viewport so the just-revealed tombstone
// (`tombstoneName`) is centered. Under reduced motion it jumps instantly; otherwise it
// eases on the SAME clock + curve as the miss-reveal FLIP (TombstoneRow's travel tween,
// distance-scaled via getMissTravelMs), so the viewport tracks the card frame-for-frame
// with no jitter. Returns the animation controls so the caller can cancel it.
function followRevealScroll(
  container: HTMLElement,
  tombstoneName: string,
  result: PlacementResult | null,
  miss: AnimationTuning['miss'],
  reduceMotion: boolean
): { stop: () => void } | null {
  const el = container.querySelector(
    `[data-tombstone-name="${CSS.escape(tombstoneName)}"]`
  ) as HTMLElement | null;
  if (!el) return null;

  const cRect = container.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  const cardCenter = eRect.top - cRect.top + container.scrollTop + eRect.height / 2;
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  const target = Math.min(Math.max(cardCenter - container.clientHeight / 2, 0), maxScroll);

  if (reduceMotion) {
    container.scrollTop = target;
    return null;
  }
  const pathLen =
    result && !result.success ? Math.abs(result.attemptedPosition - result.correctPosition) : 0;
  return animate(container.scrollTop, target, {
    duration: getMissTravelMs(pathLen, miss) / 1000,
    ease: TRAVEL_EASE,
    onUpdate: (v) => {
      container.scrollTop = v;
    },
  });
}

/**
 * Which way the rail is reaching, if the drag ghost is sitting past an end of the board. Only
 * when the ghost adds a row of its own: a gap that already holds a tombstone hosts the ghost
 * inside that row, so nothing is being extended.
 */
function getRailExtension(
  ghostGap: number | null,
  ghostHostRowIndex: number,
  eventCount: number
): RailExtension | null {
  if (ghostGap === null || ghostHostRowIndex !== -1 || eventCount === 0) return null;
  if (ghostGap === 0) return 'earlier';
  if (ghostGap === eventCount) return 'later';
  return null;
}

/** The insertion gap the ghost currently previews; null when not dragging over the timeline. */
function getGhostGap(
  isDragging: boolean,
  isOverTimeline: boolean,
  draggedCard: HistoricalEvent | null,
  insertionIndex: number | null
): number | null {
  return isDragging && isOverTimeline && draggedCard !== null ? insertionIndex : null;
}

/** The failed placement whose reveal is currently running (flash or moving phase). */
function getMissReveal(
  lastPlacementResult: PlacementResult | null,
  animationPhase: AnimationPhase
): PlacementResult | null {
  if (lastPlacementResult === null || lastPlacementResult.success) return null;
  return animationPhase !== null ? lastPlacementResult : null;
}

/**
 * What the drag marker should be doing. A drag keeps it following the pointer; a wrong drop
 * makes it snuff where it stands for the length of the red flash, then hand its travel over to
 * the tombstone's dash; a correct drop retires it on the spot, because the new row's dash has
 * already taken its place this frame. Anything else — a drag abandoned off the board — fades.
 */
function getMarkerPhase(
  dragging: boolean,
  lastPlacementResult: PlacementResult | null,
  animationPhase: AnimationPhase
): MarkerPhase {
  if (dragging) return 'drag';
  if (lastPlacementResult === null || animationPhase === null) return 'idle';
  if (lastPlacementResult.success) return 'gone';
  return animationPhase === 'flash' ? 'snuff' : 'gone';
}

/** What this row's card is doing in the current placement animation, if anything. */
function eventAnimationState(
  name: string,
  lastPlacementResult: PlacementResult | null,
  animationPhase: AnimationPhase
) {
  const isAnimating = lastPlacementResult?.event.name === name && animationPhase !== null;
  const success = isAnimating ? lastPlacementResult?.success : undefined;
  return { isAnimating, success, failedReveal: isAnimating && success === false };
}

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
  railTimeScale = 1,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // In-flight camera-follow scroll animation for a miss reveal (cancel on re-trigger/unmount)
  const followScrollRef = useRef<{ stop: () => void } | null>(null);
  const hasCenteredRef = useRef(false);
  const hasScrolledMiddleRef = useRef(false);
  const prevLen = useRef(events.length);
  const prevFailedLen = useRef(failedPlacements.length);
  const shouldReduceMotion = useReducedMotion();
  // DEFAULT_TUNING unless the anim-jig's provider is mounted — stable identity in the game
  const tuning = useAnimationTuning();

  // Make the entire timeline a single drop zone
  const { setNodeRef: setTimelineDropRef } = useDroppable({
    id: 'timeline-zone',
  });

  const missReveal = getMissReveal(lastPlacementResult, animationPhase);

  // Streak-aware glow for the card being placed.
  const streakConfig = useMemo(() => getStreakFeedback(currentStreak), [currentStreak]);

  const { successWave, missWaveBumps } = useTimelineWaves(
    events,
    lastPlacementResult,
    animationPhase,
    currentStreak,
    tuning
  );
  const wakeDelays = useWakeDelays(events, missReveal, tuning);

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

  // Camera-follow the rejected card: as it FLIPs from the attempted slot to its true
  // position, glide the viewport to center that position on the SAME clock + easing as
  // the travel tween (TombstoneRow's `cardTransition`). Matching progress every frame
  // keeps the card tracking the viewport with no jitter — unlike a browser smooth-scroll,
  // whose independent duration/easing fights the FLIP and flashes. useLayoutEffect so the
  // follow starts in the same commit the FLIP measures.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (container && failedPlacements.length > prevFailedLen.current) {
      followScrollRef.current?.stop();
      followScrollRef.current = followRevealScroll(
        container,
        failedPlacements[failedPlacements.length - 1].event.name,
        lastPlacementResult,
        tuning.miss,
        !!shouldReduceMotion
      );
    }
    prevFailedLen.current = failedPlacements.length;
    return () => followScrollRef.current?.stop();
  }, [failedPlacements, lastPlacementResult, shouldReduceMotion, tuning]);

  // Memoised: the paper field measures off these rows, and a fresh array identity on every
  // render would make its ResizeObserver commit, re-render and re-measure without end.
  const rows = useMemo(
    () => buildTimelineRows(events, failedPlacements),
    [events, failedPlacements]
  );
  const ghostGap = getGhostGap(isDragging, isOverTimeline, draggedCard, insertionIndex);
  // If that gap holds tombstone(s), the first one hosts the ghost in its own row —
  // the ghost takes the tombstone's place instead of inserting an extra row.
  const ghostHostRowIndex =
    ghostGap === null ? -1 : rows.findIndex((r) => r.kind === 'tombstone' && r.gap === ghostGap);
  const railExtension = getRailExtension(ghostGap, ghostHostRowIndex, events.length);
  const paperField = usePaperField(scrollRef, contentRef);
  const marker = useInsertionMarker(scrollRef, contentRef, ghostGap);
  const railGrow = useRailGrowth(isDragging, railExtension);
  const markerPhase = getMarkerPhase(marker.visible, lastPlacementResult, animationPhase);
  // Where the marker was last painted, written per frame and read once, by the dash a placement
  // lands as. A ref rather than state: it changes every frame and must not re-render the board.
  const markerOrigin = useRef<Point | null>(null);

  // Name of the failed card whose reveal FLIP is currently running (shared layoutId window)
  const revealingFailedName = missReveal?.event.name ?? null;

  // Distance-scaled travel duration for the reveal target's FLIP
  const missTravelMs = missReveal
    ? getMissTravelMs(
        Math.abs(missReveal.attemptedPosition - missReveal.correctPosition),
        tuning.miss
      )
    : undefined;

  const lastRowIndex = rows.length - 1;
  const earlierExt = railExtension === 'earlier' ? railExtension : null;
  const laterExt = railExtension === 'later' ? railExtension : null;
  const railFirst = (i: number) => i === 0 && railExtension !== 'earlier';
  const railLast = (i: number) => i === lastRowIndex && railExtension !== 'later';
  /** The dragged card, when its ghost belongs in the gap before display index `idx`. */
  const ghostBefore = (idx: number) =>
    ghostGap === idx && ghostHostRowIndex === -1 ? draggedCard : null;

  const renderTombstoneRow = (
    row: Extract<ReturnType<typeof buildTimelineRows>[number], { kind: 'tombstone' }>,
    rowIndex: number
  ) => {
    const { failed } = row;
    const isRevealTarget = revealingFailedName === failed.event.name;
    return (
      <BoardRow
        key={`tombstone-${failed.event.name}`}
        first={railFirst(rowIndex)}
        last={railLast(rowIndex)}
        timeScale={railTimeScale}
        ghost={rowIndex === ghostHostRowIndex}
      >
        <TombstoneRow
          failed={failed}
          onTap={() => onEventTap(failed.event)}
          displaced={ghostGap !== null && row.gap === ghostGap}
          ghostEvent={rowIndex === ghostHostRowIndex ? draggedCard : null}
          // layoutId only during the reveal FLIP — permanent layoutId would
          // smoothly layout-animate vertical moves while real cards snap
          revealing={isRevealTarget}
          travelMs={isRevealTarget ? missTravelMs : undefined}
          originRef={markerOrigin}
          landing={isRevealTarget}
          layoutShiftDelay={
            isRevealTarget
              ? null
              : (wakeDelays.byIndex.get(row.gap) ?? wakeDelays.byIndex.get(row.gap - 1) ?? null)
          }
        />
      </BoardRow>
    );
  };

  const trailingGhost = ghostBefore(events.length);

  const renderEventRow = (
    row: Extract<ReturnType<typeof buildTimelineRows>[number], { kind: 'event' }>,
    rowIndex: number
  ) => {
    const { event, realIndex: idx } = row;
    const anim = eventAnimationState(event.name, lastPlacementResult, animationPhase);
    const ghost = ghostBefore(idx);
    return (
      <React.Fragment key={event.name}>
        {/* Ghost card before this event when its gap is here and no tombstone hosts it. At the
            top of the board it is also where the rail grows to. */}
        {ghost && (
          <BoardRow
            first={earlierExt !== null}
            last={false}
            extending={earlierExt}
            grow={railGrow}
            timeScale={railTimeScale}
            ghost
          >
            <GhostCard event={ghost} />
          </BoardRow>
        )}
        <BoardRow first={railFirst(rowIndex)} last={railLast(rowIndex)} timeScale={railTimeScale}>
          <TimelineEvent
            event={event}
            onTap={() => onEventTap(event)}
            isNew={event.name === newEventName}
            index={idx}
            isAnimating={anim.isAnimating}
            animationSuccess={anim.success}
            animationPhase={anim.isAnimating ? animationPhase : null}
            // The rejected card morphs into its tombstone via a shared layoutId
            layoutId={anim.failedReveal && !shouldReduceMotion ? `placed-${event.name}` : undefined}
            // The dash grows out of the marker on a correct placement; on a wrong one this row
            // is the attempted slot, where the marker is still snuffing, so it draws none.
            originRef={markerOrigin}
            landing={anim.isAnimating && anim.success === true}
            hideTick={anim.failedReveal}
            ripple={successWave.get(idx) ?? missWaveBumps.get(event.name) ?? null}
            glowIntensity={anim.isAnimating ? streakConfig.glowIntensity : undefined}
            layoutShiftDelay={wakeDelays.byName.get(event.name) ?? null}
            // Eagerly load the first couple of cards — they're the LCP element.
            priority={idx < 2}
          />
        </BoardRow>
      </React.Fragment>
    );
  };

  return (
    // The paper backdrop lives here, behind the scroller and outside its edge mask, so the
    // elastic overscroll past either end and the masked top/bottom bands show paper rather
    // than the untinted page colour.
    <div className="h-full relative" style={paperField?.edge}>
      {/* "Earlier" wayfinding. No gradient behind it any more: the paper is tinted, so a fade
          to --color-bg would no longer match what is under it. The scroller masks its own top
          and bottom edges instead (`.tl-edge-mask`), dissolving into the backdrop above. */}
      <div className="tl-edge-label absolute top-2 left-0 right-0 z-30 pointer-events-none text-center text-text-muted text-sm font-medium font-body">
        ↑ Earlier
      </div>

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
        className={`board-center tl-edge-mask h-full relative z-10 ${
          isDragging ? 'overflow-hidden' : 'overflow-y-auto timeline-scroll-vertical'
        }`}
      >
        {/* The paper. A child of the SCROLLER, not of the content wrapper, so `left/right: 0`
            resolve against the scroller's padding box and the tint reaches the screen edges
            even when `.board-center` insets the board on a desktop width. */}
        {paperField && (
          <div aria-hidden className="absolute left-0 right-0 top-0 z-0" style={paperField.style} />
        )}
        <div ref={contentRef} className="relative z-10 flex flex-col items-start w-full">
          {/* Top spacer: room to drop "earlier" and center the first card; bounce runway */}
          <div aria-hidden className="shrink-0" style={{ height: '50vh' }} />

          {/* Events (with inline ghost cards at insertion points) and tombstones */}
          <LayoutGroup>
            {rows.map((row, rowIndex) =>
              row.kind === 'tombstone'
                ? renderTombstoneRow(row, rowIndex)
                : renderEventRow(row, rowIndex)
            )}

            {/* Ghost card after the last event (or on an empty timeline) */}
            {trailingGhost && (
              <BoardRow
                first={events.length === 0}
                last={laterExt !== null}
                extending={laterExt}
                grow={railGrow}
                timeScale={railTimeScale}
                ghost
              >
                <GhostCard event={trailingGhost} />
              </BoardRow>
            )}
          </LayoutGroup>

          {/* Bottom spacer: room to drop "later"; bounce runway below the last card */}
          <div aria-hidden className="shrink-0" style={{ height: '50vh' }} />
        </div>
      </div>

      <div className="tl-edge-label absolute bottom-2 left-0 right-0 z-30 pointer-events-none text-center text-text-muted text-sm font-medium font-body">
        Later ↓
      </div>

      {/* Portals to `body` above the drag overlay — see TimelineMarker. Rendered here rather
          than inside the scroller so it is nowhere near `.tl-edge-mask`. */}
      <TimelineMarker
        x={marker.x}
        y={marker.y}
        clip={marker.clip}
        phase={markerPhase}
        onPosition={(p) => {
          markerOrigin.current = p;
        }}
        timeScale={railTimeScale}
      />
    </div>
  );
};

export default Timeline;
