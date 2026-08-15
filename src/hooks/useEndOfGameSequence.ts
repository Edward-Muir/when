import { useCallback, useEffect, useRef, useState } from 'react';
import { GamePhase, GamePopupType } from '../types';

/**
 * The end-of-game screens, in the order they are shown.
 *
 * `share` is deliberately last and deliberately unconditional. It used to sit *inside* the
 * game-over popup, which is the first screen — so a player shared before finding out what
 * they had unlocked, and the genuinely last thing that happened was an unprominent button in
 * the bottom bar. Milestones and achievements only appear when there are any; the share
 * always ends the run, so the finale is the same screen every time.
 */
export type EndOfGameStep = 'milestones' | 'achievements' | 'share';

interface EndOfGameSequence {
  /** The screen to show now, or null when the sequence has finished (or not started). */
  step: EndOfGameStep | null;
  /** Move to the next screen. Each step's own dismissal calls this. */
  advance: () => void;
}

interface Options {
  /** `pendingPopup?.type` — the sequence starts when this goes from 'gameOver' to undefined. */
  popupType: GamePopupType | undefined;
  phase: GamePhase;
  hasMilestones: boolean;
  hasAchievements: boolean;
}

/**
 * The end-of-game screen queue.
 *
 * Before this, the chain was emergent from three hand-wired places: an effect watching the
 * popup-dismissal transition, `MilestonePopup`'s `onDismiss` reaching into achievement state,
 * and the daily's backdrop gate. Adding a fourth screen by hand would have made that worse,
 * so the queue the chain was imitating is now explicit.
 *
 * **The game-over popup itself is not in the queue**, and that is on purpose. It lives on
 * `pendingPopup` in `useWhenGame`, and its dismissal is gated by `useBackdropDismiss` so the
 * daily cannot get past it without submitting to the leaderboard. Folding it in would mean
 * re-implementing that gate for no gain. So the flow is unified from the game-over popup
 * *onward* — this hook starts where that popup ends.
 */
export function useEndOfGameSequence({
  popupType,
  phase,
  hasMilestones,
  hasAchievements,
}: Options): EndOfGameSequence {
  const [queue, setQueue] = useState<EndOfGameStep[]>([]);
  const prevPopupTypeRef = useRef(popupType);
  // The transition fires on every render where the popup just closed; this keeps the sequence
  // to once per game, so re-opening a popup later cannot replay it.
  const consumedRef = useRef(false);

  useEffect(() => {
    if (phase === 'playing') {
      consumedRef.current = false;
      setQueue([]);
    }
  }, [phase]);

  useEffect(() => {
    const wasGameOver = prevPopupTypeRef.current === 'gameOver';
    prevPopupTypeRef.current = popupType;
    if (!wasGameOver || popupType || consumedRef.current) return;
    consumedRef.current = true;
    setQueue([
      ...(hasMilestones ? (['milestones'] as const) : []),
      ...(hasAchievements ? (['achievements'] as const) : []),
      'share',
    ]);
  }, [popupType, hasMilestones, hasAchievements]);

  const advance = useCallback(() => setQueue((rest) => rest.slice(1)), []);

  return { step: queue[0] ?? null, advance };
}
