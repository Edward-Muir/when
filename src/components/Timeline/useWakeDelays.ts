import { useMemo } from 'react';
import { HistoricalEvent } from '../../types';
import { AnimationTuning, getMissTravelMs, invTravelEase } from './animationTuning';

export interface MissReveal {
  event: HistoricalEvent;
  attemptedPosition: number;
  correctPosition: number;
}

/**
 * Miss-reveal wake shifts: only cards between the attempted spot (a) and the correct
 * gap (g) shift (by one row-height, in one render) — layout-animate exactly those rows,
 * each starting just before the mover reaches it (passage time from the inverted travel
 * ease). Keyed by name because indices differ between the flash render (mover still in
 * `events`) and the moving render; a parallel index map covers tombstone rows.
 *
 * Lives outside Timeline.tsx only because that component sits on the
 * max-lines-per-function ceiling.
 */
export function useWakeDelays(
  missReveal: MissReveal | null,
  events: HistoricalEvent[],
  tuning: AnimationTuning
) {
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
      // part just before the card arrives
      const delay = Math.max(0, passageS - tuning.wake.layoutShiftLeadS);
      byIndex.set(i, delay);
      const evt = preInsert.at(i);
      if (evt) byName.set(evt.name, delay);
    }
    return { byName, byIndex };
  }, [missReveal, events, tuning]);
}
