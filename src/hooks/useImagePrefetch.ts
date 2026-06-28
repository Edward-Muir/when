import { useEffect, useMemo } from 'react';
import { HistoricalEvent, WhenGameState } from '../types';
import { ImageVariant } from '../utils/cloudinaryImage';
import { preloadEventImages } from '../utils/preloadImage';

// Stable module-level constants so hook deps / array refs never churn.
const EMPTY: HistoricalEvent[] = [];
const THUMB: ImageVariant[] = ['thumbnail'];

// How many upcoming deck cards to keep warm during play. Small + re-warmed per
// draw so it never floods the wire or competes with the active card.
const NEXT_PREFETCH = 5;

/**
 * Idle-schedule a low-priority batch warm of the given events' thumbnails.
 * Depends on a stable join-key (not array identity) so churning state arrays
 * (deck/players change every placement) only reschedule when contents differ.
 */
function useWarm(events: HistoricalEvent[], enabled: boolean): void {
  const key = enabled ? events.map((e) => e.image_url ?? '').join('|') : '';

  useEffect(() => {
    if (!enabled || events.length === 0) return undefined;

    const run = () => preloadEventImages(events, THUMB, 'low');

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(run);
      return () => window.cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(run, 200);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures the event-set contents; `events` identity churns every placement
  }, [key, enabled]);
}

/**
 * App-level orchestrator for look-ahead image warming. Mounted once (in App, which
 * survives AnimatePresence phase swaps) it warms, by phase, exactly the images the
 * next view will render:
 *  - modeSelect:    the intro-animation cards (shown next, during transitioning)
 *  - transitioning: the first game render's cards (seed timeline + dealt hands)
 *  - playing:       the next deck cards, before they're drawn into a hand
 */
export function useImagePrefetch(state: WhenGameState, introEvents: HistoricalEvent[]): void {
  const { phase, timeline, players, deck } = state;

  // Cards the first game render shows: the seed timeline plus every dealt hand.
  const startCards = useMemo(
    () => (phase === 'transitioning' ? [...timeline, ...players.flatMap((p) => p.hand)] : EMPTY),
    [phase, timeline, players]
  );

  // The next few cards waiting in the deck; re-warmed as the deck shrinks.
  const upcoming = useMemo(
    () => (phase === 'playing' ? deck.slice(0, NEXT_PREFETCH) : EMPTY),
    [phase, deck]
  );

  useWarm(introEvents, phase === 'modeSelect');
  useWarm(startCards, phase === 'transitioning');
  useWarm(upcoming, phase === 'playing');
}
