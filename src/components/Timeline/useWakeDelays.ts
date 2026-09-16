import { useMemo } from 'react';
import { HistoricalEvent, PlacementResult } from '../../types';
import { AnimationTuning, getMissTravelMs, invTravelEase } from './animationTuning';

/**
 * Miss-reveal wake shifts, lifted out of Timeline so its component body stays under
 * `max-lines-per-function`. Only cards between the attempted spot (a) and the correct gap (g)
 * shift, by one row height, in one render — so exactly those rows layout-animate, each starting
 * just before the mover reaches it (passage time from the inverted travel ease).
 *
 * Keyed by name because indices differ between the flash render (the mover is still in `events`)
 * and the moving render; the parallel index map covers tombstone rows.
 */
export interface WakeDelays {
  byName: Map<string, number>;
  byIndex: Map<number, number>;
}

export function useWakeDelays(
  events: HistoricalEvent[],
  missReveal: PlacementResult | null,
  tuning: AnimationTuning
): WakeDelays {
  return useMemo(() => {
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
      // Part just before the card arrives.
      const delay = Math.max(0, passageS - tuning.wake.layoutShiftLeadS);
      byIndex.set(i, delay);
      const evt = preInsert.at(i);
      if (evt) byName.set(evt.name, delay);
    }
    return { byName, byIndex };
  }, [missReveal, events, tuning]);
}
