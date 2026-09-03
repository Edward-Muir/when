import { useCallback, useEffect, useState } from 'react';
import { TabHintKey, hasSeenHint, markHintSeen } from '../utils/playerStorage';

/**
 * Wait for the pager's scroll-snap to settle before mounting the strip. `activePage`
 * updates on every scroll tick, and mounting mid-gesture is the class of change that used
 * to stall the swipe on iOS. If a stall is ever seen, raise this before touching anything.
 */
export const TAB_HINT_MOUNT_DELAY_MS = 350;

/**
 * A home tab's first-visit strip: shown once, the first time the tab is actually on screen.
 * Gating on `active` is mandatory. The pager pre-mounts every panel at idle, so a check on
 * mount would fire for tabs the player has never opened.
 */
export function useTabHint(
  key: TabHintKey,
  active: boolean
): { show: boolean; dismiss: () => void } {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    if (hasSeenHint(key)) return;
    const timer = window.setTimeout(() => {
      markHintSeen(key);
      setShow(true);
    }, TAB_HINT_MOUNT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [key, active]);

  const dismiss = useCallback(() => setShow(false), []);

  return { show, dismiss };
}
