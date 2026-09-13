import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { FailedPlacement, PlacementResult } from '../../types';
import {
  AnimationTuning,
  getMissTravelMs,
  TRAVEL_EASE,
  useAnimationTuning,
} from '../Timeline/animationTuning';

/**
 * The two viewport moves every board makes, moved out of `Timeline` verbatim:
 *
 * - `useCenterFirstCard`: once per game, put the first card in the middle of the viewport so
 *   there is room above and below it to drop the next card "earlier" or "later".
 * - `useRevealFollow`: camera-follow a rejected card as it FLIPs to its true position, on
 *   the same clock and curve as the travel tween, so the viewport tracks the card
 *   frame-for-frame with no jitter.
 */

// Camera-follow the rejected card: glide the viewport so the just-revealed tombstone
// (`tombstoneName`) is centered. Under reduced motion it jumps instantly; otherwise it
// eases on the SAME clock + curve as the miss-reveal FLIP (TombstoneRow's travel tween,
// distance-scaled via getMissTravelMs). Returns the animation controls so the caller can
// cancel it.
export function followRevealScroll(
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

export function useCenterFirstCard(
  scrollRef: RefObject<HTMLDivElement | null>,
  eventCount: number,
  enabled: boolean
) {
  const hasCenteredRef = useRef(false);
  const prevLen = useRef(eventCount);

  // Re-arm the one-time centering whenever a new game starts (timeline goes empty -> populated)
  useEffect(() => {
    if (prevLen.current === 0 && eventCount > 0) {
      hasCenteredRef.current = false;
    }
    prevLen.current = eventCount;
  }, [eventCount]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !enabled) return;

    const recenter = () => {
      if (hasCenteredRef.current || eventCount === 0) return;
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
  }, [scrollRef, eventCount, enabled]);
}

// useLayoutEffect so the follow starts in the same commit the FLIP measures.
export function useRevealFollow(
  scrollRef: RefObject<HTMLDivElement | null>,
  failedPlacements: FailedPlacement[],
  lastPlacementResult: PlacementResult | null
) {
  const tuning = useAnimationTuning();
  const shouldReduceMotion = useReducedMotion();
  // In-flight camera-follow scroll animation for a miss reveal (cancel on re-trigger/unmount)
  const followScrollRef = useRef<{ stop: () => void } | null>(null);
  const prevFailedLen = useRef(failedPlacements.length);

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
  }, [scrollRef, failedPlacements, lastPlacementResult, shouldReduceMotion, tuning]);
}
