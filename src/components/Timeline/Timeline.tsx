import React, { useRef, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { animate, LayoutGroup, useReducedMotion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult, AnimationPhase, FailedPlacement } from '../../types';
import TimelineEvent, { RippleSpec } from './TimelineEvent';
import TombstoneRow from './TombstoneRow';
import Card from '../Card';
import { getStreakFeedback } from '../../utils/streakFeedback';
import { buildTimelineRows } from '../../utils/timelineRows';
import {
  AnimationTuning,
  getMissTravelMs,
  invTravelEase,
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
  // Whether placed events should preload their full-size detail image (off in view mode)
  preloadDetailImages?: boolean;
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
  const pathLen = result && !result.success
    ? Math.abs(result.attemptedPosition - result.correctPosition)
    : 0;
  return animate(container.scrollTop, target, {
    duration: getMissTravelMs(pathLen, miss) / 1000,
    ease: TRAVEL_EASE,
    onUpdate: (v) => {
      container.scrollTop = v;
    },
  });
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
  preloadDetailImages = true,
  enableCentering = false,
  startAtMiddle = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
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

  // Store ripple data independently from animation phase so it can complete fully
  const [rippleData, setRippleData] = useState<{
    placedEventName: string;
    timestamp: number;
  } | null>(null);

  // Miss wake trigger: stamped once when a failure reveal begins (flash render). All wake
  // delays are offset by the flash duration so they line up with the travel that starts
  // MISS_FLASH_MS later. Deliberately NOT set at travel start — a re-render while framer
  // holds delayed layout springs re-measures the rows and cancels the pending shifts.
  const [wakeTrigger, setWakeTrigger] = useState<number | null>(null);

  // Trigger ripple when a successful placement happens
  useEffect(() => {
    if (lastPlacementResult?.success && animationPhase === 'flash') {
      setRippleData({
        placedEventName: lastPlacementResult.event.name,
        timestamp: Date.now(),
      });
    }
  }, [lastPlacementResult, animationPhase]);

  // Clear ripples after the animation completes (~2 seconds for 3 oscillations)
  useEffect(() => {
    if (rippleData) {
      const timer = setTimeout(() => setRippleData(null), tuning.success.rippleCleanupMs);
      return () => clearTimeout(timer);
    }
  }, [rippleData, tuning]);

  // Get streak-based glow and ripple config
  const streakConfig = useMemo(() => getStreakFeedback(currentStreak), [currentStreak]);

  // Success wave: bumps radiate outward from the placed card (unchanged behavior,
  // expressed as explicit per-row delay/amplitude)
  const successWave = useMemo(() => {
    const bumps = new Map<number, RippleSpec>();
    if (!rippleData) return bumps;
    const placedIndex = events.findIndex((e) => e.name === rippleData.placedEventName);
    if (placedIndex === -1) return bumps;
    const { rippleStaggerS, rippleBaseYOffsetPx, rippleHalfLifeCards } = tuning.success;
    events.forEach((_, idx) => {
      if (idx === placedIndex) return; // Skip the placed card itself
      const d = Math.abs(idx - placedIndex);
      bumps.set(idx, {
        delay: d * rippleStaggerS,
        amplitudePx:
          rippleBaseYOffsetPx *
          Math.pow(0.5, (d - 1) / rippleHalfLifeCards) *
          streakConfig.rippleMultiplier,
        trigger: rippleData.timestamp,
      });
    });
    return bumps;
  }, [rippleData, events, streakConfig, tuning]);

  // Name of the failed card whose reveal is currently running (flash or moving phase)
  const missReveal =
    lastPlacementResult !== null && !lastPlacementResult.success && animationPhase !== null
      ? lastPlacementResult
      : null;

  // Stamp the wake trigger once per reveal, at flash time (see comment on wakeTrigger)
  useEffect(() => {
    if (missReveal) setWakeTrigger(Date.now());
  }, [missReveal]);

  // Miss wake wave: each passed row bumps just behind the traveling card (passage times
  // from the inverted travel ease, offset by the flash), then the wave runs out past the
  // landing gap, decaying. Keyed by event name — stable across the flash render (mover
  // still in `events`) and the moving render, so each row's bump schedules exactly once.
  const missWaveBumps = useMemo(() => {
    const bumps = new Map<string, RippleSpec>();
    if (!missReveal || wakeTrigger === null) return bumps;
    const { attemptedPosition: a, correctPosition: g } = missReveal;
    const pathLen = Math.abs(a - g);
    if (pathLen === 0) return bumps;
    const preInsert = events.filter((e) => e.name !== missReveal.event.name);
    const travelS = getMissTravelMs(pathLen, tuning.miss) / 1000;
    const flashS = tuning.miss.flashMs / 1000;
    const { amplitudePx, bumpOffsetS, runOutBumps, runOutBaseDelayS, runOutStepS, runOutDecay } =
      tuning.wake;
    const down = g > a; // travel direction in index space
    const lo = Math.min(a, g);
    const hi = Math.max(a, g);
    for (let i = lo; i < hi; i++) {
      const passageOrder = down ? i - a : a - 1 - i; // 0 = first row the mover passes
      const passageS = invTravelEase((passageOrder + 0.5) / pathLen) * travelS;
      const evt = preInsert.at(i);
      if (evt) {
        bumps.set(evt.name, {
          delay: flashS + passageS + bumpOffsetS,
          amplitudePx,
          trigger: wakeTrigger,
        });
      }
    }
    // Run-out: the wave continues through the landing spot and dies off
    for (let extra = 0; extra < runOutBumps; extra++) {
      const idx = down ? g + extra : g - 1 - extra;
      const evt = idx >= 0 ? preInsert.at(idx) : undefined;
      if (!evt || bumps.has(evt.name)) continue;
      bumps.set(evt.name, {
        delay: flashS + travelS + runOutBaseDelayS + extra * runOutStepS,
        amplitudePx: amplitudePx * Math.pow(runOutDecay, extra),
        trigger: wakeTrigger,
      });
    }
    return bumps;
  }, [missReveal, wakeTrigger, events, tuning]);

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

  const rows = buildTimelineRows(events, failedPlacements);
  // The insertion gap the ghost currently previews (null when not dragging over the timeline)
  const ghostGap = isDragging && isOverTimeline && draggedCard !== null ? insertionIndex : null;
  // If that gap holds tombstone(s), the first one hosts the ghost in its own row —
  // the ghost takes the tombstone's place instead of inserting an extra row.
  const ghostHostRowIndex =
    ghostGap === null ? -1 : rows.findIndex((r) => r.kind === 'tombstone' && r.gap === ghostGap);
  // Name of the failed card whose reveal FLIP is currently running (shared layoutId window)
  const revealingFailedName = missReveal?.event.name ?? null;

  // Miss-reveal wake shifts: only cards between the attempted spot (a) and the correct
  // gap (g) shift (by one row-height, in one render) — layout-animate exactly those rows,
  // each starting just before the mover reaches it (passage time from the inverted travel
  // ease). Keyed by name because indices differ between the flash render (mover still in
  // `events`) and the moving render; a parallel index map covers tombstone rows.
  const wakeDelays = useMemo(() => {
    const byName = new Map<string, number>();
    const byIndex = new Map<number, number>();
    if (!missReveal) return { byName, byIndex };
    const { attemptedPosition: a, correctPosition: g } = missReveal;
    const preInsert = events.filter((e) => e.name !== missReveal.event.name);
    const lo = Math.min(a, g);
    const hi = Math.max(a, g);
    const pathLen = hi - lo;
    if (pathLen === 0) return { byName, byIndex };
    const travelS = getMissTravelMs(pathLen, tuning.miss) / 1000;
    for (let i = lo; i < hi; i++) {
      const passageOrder = a > g ? a - 1 - i : i - a; // 0 = first card the mover passes
      const passageS = invTravelEase((passageOrder + 0.5) / pathLen) * travelS;
      // part just before the card arrives
      const delay = Math.max(0, passageS - tuning.wake.layoutShiftLeadS);
      byIndex.set(i, delay);
      const evt = preInsert.at(i);
      if (evt) byName.set(evt.name, delay);
    }
    return { byName, byIndex };
  }, [missReveal, events, tuning]);

  // Distance-scaled travel duration for the reveal target's FLIP
  const missTravelMs = missReveal
    ? getMissTravelMs(
        Math.abs(missReveal.attemptedPosition - missReveal.correctPosition),
        tuning.miss
      )
    : undefined;

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
                    preloadDetailImages={preloadDetailImages}
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
