import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimationTuning, getMissTravelMs } from '../../components/Timeline/animationTuning';
import { findCorrectPosition, insertIntoTimeline } from '../../utils/gameLogic';
import { AnimationPhase, FailedPlacement, HistoricalEvent, PlacementResult } from '../../types';

/**
 * Drives the Timeline component through the exact success / miss placement
 * sequences from useWhenGame (insert → flash → [remove + tombstone + moving]
 * → finalize) on a small synthetic timeline, without any game logic. Timings
 * come from the (possibly slow-mo-scaled) tuning so state flips stay aligned
 * with the slowed visuals.
 */

export type JigAction =
  | { kind: 'correct'; tier: number }
  | { kind: 'miss'; distance: number; direction: 'early' | 'late' };

// streakFeedback tiers: 0-1 → tier 0, 2-3 → tier 1, 4-5 → tier 2, 6+ → tier 3.
// The game increments the streak before the flash, so tier N plays at these values.
export const TIER_STREAKS = [1, 2, 4, 6];
export const TIER_LABELS = ['normal', 'bright ×2', 'golden ×4', 'max ×6'];

interface JigTimelineState {
  timeline: HistoricalEvent[];
  failedPlacements: FailedPlacement[];
  lastPlacementResult: PlacementResult | null;
  animationPhase: AnimationPhase;
  currentStreak: number;
  newEventName?: string;
}

export interface JigCallbacks {
  onSuccess: (streak: number) => void;
  onMiss: () => void;
}

// Gap between the board reset and the sequence start: one paint's worth, so
// framer measures a clean pre-insert layout (mirrors the game, where the board
// is always at rest when a card is placed).
const RESTART_GAP_MS = 60;

const BOARD_SIZE = 9; // 8 timeline cards + 1 probe card that gets placed

export function useAnimJigDriver(
  allEvents: HistoricalEvent[] | undefined,
  tuning: AnimationTuning,
  callbacks: JigCallbacks
) {
  // Sample BOARD_SIZE events spread evenly across the catalogue (sorted by year)
  // so the board has real images/colors and clearly distinct years. The middle
  // event is the "probe" — the card every play places; the rest are the board.
  const { baseTimeline, probe, correctGap } = useMemo(() => {
    if (!allEvents || allEvents.length < BOARD_SIZE) {
      return { baseTimeline: [] as HistoricalEvent[], probe: null, correctGap: 0 };
    }
    const sorted = [...allEvents].sort((a, b) => a.year - b.year);
    const picked: HistoricalEvent[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < BOARD_SIZE; i++) {
      const idx = Math.round((i * (sorted.length - 1)) / (BOARD_SIZE - 1));
      // eslint-disable-next-line security/detect-object-injection -- idx is computed from loop bounds
      const event = sorted[idx];
      if (!seen.has(event.name)) {
        seen.add(event.name);
        picked.push(event);
      }
    }
    const probeEvent = picked[Math.floor(picked.length / 2)];
    const base = picked.filter((e) => e.name !== probeEvent.name);
    return {
      baseTimeline: base,
      probe: probeEvent,
      correctGap: findCorrectPosition(base, probeEvent),
    };
  }, [allEvents]);

  const idleState = useMemo<JigTimelineState>(
    () => ({
      timeline: baseTimeline,
      failedPlacements: [],
      lastPlacementResult: null,
      animationPhase: null,
      currentStreak: 0,
      newEventName: undefined,
    }),
    [baseTimeline]
  );

  const [state, setState] = useState<JigTimelineState>(idleState);
  const [status, setStatus] = useState<'idle' | 'playing'>('idle');
  useEffect(() => setState(idleState), [idleState]);

  // Latest tuning/callbacks without re-creating the play functions mid-sequence
  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const lastActionRef = useRef<JigAction | null>(null);

  const timeoutsRef = useRef<number[]>([]);
  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  }, []);
  const schedule = useCallback((fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => clearTimeouts, [clearTimeouts]);

  const reset = useCallback(() => {
    clearTimeouts();
    setState(idleState);
    setStatus('idle');
  }, [clearTimeouts, idleState]);

  const playCorrect = useCallback(
    (tier: number) => {
      if (!probe) return;
      lastActionRef.current = { kind: 'correct', tier };
      clearTimeouts();
      setState(idleState);
      setStatus('playing');
      schedule(() => {
        const t = tuningRef.current;
        const streak = TIER_STREAKS.at(tier) ?? 1;
        const result: PlacementResult = {
          success: true,
          event: probe,
          correctPosition: correctGap,
          attemptedPosition: correctGap,
        };
        setState({
          timeline: insertIntoTimeline(baseTimeline, probe, correctGap),
          failedPlacements: [],
          lastPlacementResult: result,
          animationPhase: 'flash',
          currentStreak: streak,
          newEventName: probe.name,
        });
        callbacksRef.current.onSuccess(streak);
        schedule(() => {
          setState((prev) => ({ ...prev, animationPhase: null }));
          setStatus('idle');
        }, t.success.flashMs);
        // Game.tsx clears newEventName (entrance animation flag) after 1s
        schedule(() => setState((prev) => ({ ...prev, newEventName: undefined })), 1000);
      }, RESTART_GAP_MS);
    },
    [probe, correctGap, baseTimeline, idleState, clearTimeouts, schedule]
  );

  const playMiss = useCallback(
    (distance: number, direction: 'early' | 'late') => {
      if (!probe) return;
      lastActionRef.current = { kind: 'miss', distance, direction };
      clearTimeouts();
      setState(idleState);
      setStatus('playing');
      schedule(() => {
        const t = tuningRef.current;
        const attempted = Math.max(
          0,
          Math.min(
            baseTimeline.length,
            direction === 'early' ? correctGap - distance : correctGap + distance
          )
        );
        const pathLen = Math.abs(attempted - correctGap);
        if (pathLen === 0) return; // clamped onto the correct gap — nothing to show
        const result: PlacementResult = {
          success: false,
          event: probe,
          correctPosition: correctGap,
          attemptedPosition: attempted,
        };
        // Mirrors useWhenGame's miss flow: card sits at the attempted spot for the
        // red flash, then reappears as a tombstone at its true gap and travels there.
        setState({
          timeline: insertIntoTimeline(baseTimeline, probe, attempted),
          failedPlacements: [],
          lastPlacementResult: result,
          animationPhase: 'flash',
          currentStreak: 0,
          newEventName: undefined,
        });
        callbacksRef.current.onMiss();
        schedule(() => {
          setState((prev) => ({
            ...prev,
            timeline: baseTimeline,
            failedPlacements: [{ event: probe, attemptedPosition: attempted, seq: 1 }],
            animationPhase: 'moving',
          }));
        }, t.miss.flashMs);
        schedule(
          () => {
            setState((prev) => ({ ...prev, animationPhase: null }));
            setStatus('idle');
          },
          t.miss.flashMs + getMissTravelMs(pathLen, t.miss) + t.miss.settleMarginMs
        );
      }, RESTART_GAP_MS);
    },
    [probe, correctGap, baseTimeline, idleState, clearTimeouts, schedule]
  );

  const replay = useCallback(() => {
    const last = lastActionRef.current;
    if (!last) return;
    if (last.kind === 'correct') playCorrect(last.tier);
    else playMiss(last.distance, last.direction);
  }, [playCorrect, playMiss]);

  return {
    ready: probe !== null,
    state,
    status,
    probe,
    correctGap,
    boardSize: baseTimeline.length,
    playCorrect,
    playMiss,
    replay,
    reset,
  };
}
