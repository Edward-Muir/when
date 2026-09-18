import { useCallback, useEffect, useState } from 'react';
import { TabHintKey, hasSeenHint, markHintSeen, subscribeHintsReset } from '../utils/playerStorage';

/**
 * Wait for the pager's scroll-snap to settle before mounting the strip. `activePage`
 * updates on every scroll tick, and mounting mid-gesture is the class of change that used
 * to stall the swipe on iOS. If a stall is ever seen, raise this before touching anything.
 */
export const TAB_HINT_MOUNT_DELAY_MS = 350;

/**
 * A home tab's first-visit strip: shown once, after the tab has been on screen for
 * `delayMs` without the player leaving it. Gating on `active` is mandatory: the pager
 * pre-mounts every panel at idle, so a check on mount would fire for tabs the player has
 * never opened. The default delay only lets the swipe settle; the Daily tab passes an
 * idle-length delay so its nudge, like the in-game drag hint, appears only to a player who
 * has sat there without acting.
 *
 * The menu's "Reset Hints" re-arms it in place, without a reload.
 */
export function useTabHint(
  key: TabHintKey,
  active: boolean,
  delayMs: number = TAB_HINT_MOUNT_DELAY_MS
): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(false);
  // The menu's "Reset Hints" is reachable from the home screen itself, and the effect below
  // reads storage only when its deps change — so without this the reset cleared the keys and
  // nothing re-read them, and the strips stayed away until a reload. Bumping a nonce re-runs
  // the effect, which is the same job `useOnboardingHints` does for the in-game ladder.
  const [resetNonce, setResetNonce] = useState(0);
  useEffect(() => subscribeHintsReset(() => setResetNonce((n) => n + 1)), []);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    if (hasSeenHint(key)) return;
    const timer = window.setTimeout(() => {
      markHintSeen(key);
      setShow(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [key, active, delayMs, resetNonce]);

  const dismiss = useCallback(() => setShow(false), []);

  return { show, dismiss };
}
