import { useEffect, useMemo, useState } from 'react';
import { AnimationPhase, HistoricalEvent, PlacementResult } from '../../types';
import { RippleSpec } from '../Timeline/TimelineEvent';
import { getStreakFeedback } from '../../utils/streakFeedback';
import { getMissTravelMs, invTravelEase, useAnimationTuning } from '../Timeline/animationTuning';

/**
 * The placement choreography every board shares, moved out of `Timeline` verbatim so the
 * physical board (`PhysicalBoard`) and the shipped one schedule the same waves from the
 * same tuning:
 *
 * - `successWave`: bumps radiating outward from a correctly placed card, keyed by index.
 * - `missWaveBumps`: the wake a rejected card leaves as it travels to its true gap, keyed by
 *   event name (stable across the flash render, where the mover is still in `events`, and
 *   the moving render, where it is not), plus a decaying run-out past the landing gap.
 * - `wakeDelays`: when each row on the mover's path parts for it (layout-shift delays).
 * - `missReveal` / `revealingFailedName` / `missTravelMs`: the reveal in flight, if any.
 *
 * The wake trigger is stamped once, at flash time: a re-render while framer holds delayed
 * layout springs re-measures the rows and cancels the pending shifts, so it must not be
 * re-stamped when the travel starts.
 */
export interface BoardWavesInput {
  events: HistoricalEvent[];
  lastPlacementResult: PlacementResult | null;
  animationPhase: AnimationPhase;
  currentStreak: number;
}

export function useBoardWaves({
  events,
  lastPlacementResult,
  animationPhase,
  currentStreak,
}: BoardWavesInput) {
  // DEFAULT_TUNING unless the anim-jig's provider is mounted — stable identity in the game
  const tuning = useAnimationTuning();

  // Store ripple data independently from animation phase so it can complete fully
  const [rippleData, setRippleData] = useState<{
    placedEventName: string;
    timestamp: number;
  } | null>(null);

  // Miss wake trigger: stamped once when a failure reveal begins (flash render). All wake
  // delays are offset by the flash duration so they line up with the travel that starts
  // MISS_FLASH_MS later.
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

  // The failed placement whose reveal is currently running (flash or moving phase)
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
  // landing gap, decaying.
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

  return {
    tuning,
    streakConfig,
    successWave,
    missReveal,
    missWaveBumps,
    wakeDelays,
    missTravelMs,
    // Name of the failed card whose reveal FLIP is currently running (shared layoutId window)
    revealingFailedName: missReveal?.event.name ?? null,
  };
}
