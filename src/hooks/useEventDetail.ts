import { useCallback, useEffect, useState } from 'react';
import { loadEventDetail, peekEventDetail } from '../utils/eventDetail';

export type EventDetailStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface EventDetailState {
  status: EventDetailStatus;
  paragraphs: string[] | null;
  /** Re-runs a failed fetch. Only meaningful while `status` is 'error'. */
  retry: () => void;
}

/** What we can say about an event's prose without going to the network. */
function readCache(name: string | null): {
  status: EventDetailStatus;
  paragraphs: string[] | null;
} {
  if (!name) return { status: 'idle', paragraphs: null };
  const cached = peekEventDetail(name);
  if (cached === undefined) return { status: 'idle', paragraphs: null };
  return cached ? { status: 'ready', paragraphs: cached } : { status: 'error', paragraphs: null };
}

/**
 * Fetches an event's long-form prose, but only once `enabled` goes true — i.e. only after the
 * player has actually tapped the info button. Fetching on popup-open instead would spend a
 * shard-sized download on everyone who merely glances at a card.
 *
 * State is seeded synchronously from the shard cache so that turning a card back and forth
 * re-reads instantly rather than flashing the skeleton on every flip.
 *
 * Extracted from `GamePopup` rather than inlined because that component sits near ESLint's
 * `complexity` ceiling of 15, the same reason `Game.tsx` keeps its hint logic in
 * `useOnboardingHints`.
 */
export function useEventDetail(name: string | null, enabled: boolean): EventDetailState {
  const [state, setState] = useState(() => readCache(name));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Re-seed on every card change. Doing it here rather than in a separate effect keeps the
    // reset and the fetch in one place — as two effects they raced on the render where the card
    // changed while the back face was open, and 'idle' won over 'loading'.
    const seeded = readCache(name);
    setState(seeded);

    if (!name || !enabled || seeded.status === 'ready') return;

    // The popup instance is reused across cards, so a slow fetch for the previous card must
    // not land on top of the current one.
    let cancelled = false;
    setState({ status: 'loading', paragraphs: null });

    loadEventDetail(name).then((paragraphs) => {
      if (cancelled) return;
      setState({ status: paragraphs ? 'ready' : 'error', paragraphs });
    });

    return () => {
      cancelled = true;
    };
  }, [name, enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
}
