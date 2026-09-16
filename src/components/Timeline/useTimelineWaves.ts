import { useEffect, useMemo, useState } from 'react';
import { AnimationPhase, HistoricalEvent, PlacementResult } from '../../types';
import { getStreakFeedback } from '../../utils/streakFeedback';
import type { RippleSpec } from './TimelineEvent';
import { AnimationTuning, getMissTravelMs, invTravelEase } from './animationTuning';

/**
 * The two ripple waves that run across the board, lifted out of Timeline so its component body
 * stays under `max-lines-per-function`. Pure bookkeeping — no behaviour change from when this
 * lived inline.
 *
 * - **Success wave:** bumps radiate outward from the card just placed, decaying with distance.
 * - **Miss wake:** each row the rejected card passes bumps just behind it (passage times come
 *   from inverting the travel ease), then the wave runs out past the landing gap and decays.
 */
export interface TimelineWaves {
  /** By display index — the success wave. */
  successWave: Map<number, RippleSpec>;
  /** By event name — the miss wake. Names because indices differ across the two renders. */
  missWaveBumps: Map<string, RippleSpec>;
}

export function useTimelineWaves(
  events: HistoricalEvent[],
  lastPlacementResult: PlacementResult | null,
  animationPhase: AnimationPhase,
  currentStreak: number,
  tuning: AnimationTuning
): TimelineWaves {
  // Ripple data is held apart from the animation phase so it can complete in full.
  const [rippleData, setRippleData] = useState<{
    placedEventName: string;
    timestamp: number;
  } | null>(null);

  // Miss wake trigger: stamped once when a failure reveal begins (flash render). All wake
  // delays are offset by the flash duration so they line up with the travel that starts
  // MISS_FLASH_MS later. Deliberately NOT set at travel start — a re-render while framer
  // holds delayed layout springs re-measures the rows and cancels the pending shifts.
  const [wakeTrigger, setWakeTrigger] = useState<number | null>(null);

  useEffect(() => {
    if (lastPlacementResult?.success && animationPhase === 'flash') {
      setRippleData({ placedEventName: lastPlacementResult.event.name, timestamp: Date.now() });
    }
  }, [lastPlacementResult, animationPhase]);

  // Clear ripples once the animation has completed (~2s for three oscillations).
  useEffect(() => {
    if (!rippleData) return;
    const timer = setTimeout(() => setRippleData(null), tuning.success.rippleCleanupMs);
    return () => clearTimeout(timer);
  }, [rippleData, tuning]);

  const streakConfig = useMemo(() => getStreakFeedback(currentStreak), [currentStreak]);

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

  // The failed card whose reveal is currently running (flash or moving phase).
  const missReveal =
    lastPlacementResult !== null && !lastPlacementResult.success && animationPhase !== null
      ? lastPlacementResult
      : null;

  useEffect(() => {
    if (missReveal) setWakeTrigger(Date.now());
  }, [missReveal]);

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
    // Run-out: the wave continues through the landing spot and dies off.
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

  return { successWave, missWaveBumps };
}
