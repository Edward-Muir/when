import { useEffect } from 'react';
import { runTopBackHandler } from '../utils/backStack';
import { handleGamePop, pushGameEntry, restoreGameEntry } from '../utils/gameBackEntry';

/** `navigator.userActivation` is missing from this TypeScript's DOM types and from old WebViews. */
function hasBeenTapped(): boolean {
  const nav = navigator as Navigator & { userActivation?: { hasBeenActive: boolean } };
  return nav.userActivation?.hasBeenActive ?? true;
}

/**
 * The system Back gesture during a game: the browser's Back button, the Android gesture, and
 * the Android app's back button (its WebView goes back in history by default, so no native
 * code is involved).
 *
 * While `inGame`, one history entry is held (utils/gameBackEntry.ts). Back pops it; this runs
 * the top of the back stack and, if the game is still on, steps back onto the entry: an open popup or the menu closes, and otherwise
 * the game's own handler does what the Home button does (hooks/useLeaveGame.ts). During the
 * start transition nothing is registered, so Back is simply absorbed.
 *
 * The entry is added on a tap where there has not been one yet. `/daily` and
 * `/challenge/:code` start a game with no tap, and Chrome skips entries pushed without one.
 */
export function useGameBackButton(inGame: boolean): void {
  useEffect(() => {
    if (!inGame) return;

    if (hasBeenTapped()) pushGameEntry();
    else window.addEventListener('pointerdown', pushGameEntry, { once: true });

    const onPop = () => {
      if (!handleGamePop()) return;
      runTopBackHandler();
      restoreGameEntry();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('pointerdown', pushGameEntry);
      window.removeEventListener('popstate', onPop);
    };
  }, [inGame]);
}
