/**
 * The one history entry a game adds, so the system Back gesture has something to pop.
 *
 * Starting a game never navigates (a Custom game stays on `/custom`), so without this Back
 * leaves the app and the game with it. The entry is the same URL with a marker in its state;
 * React Router keeps its own keys in `history.state`, which is why they are spread through.
 */
const MARK = 'whenGame';

function isMarked(): boolean {
  const state: unknown = window.history.state;
  return typeof state === 'object' && state !== null && MARK in state;
}

/** Add the entry, unless this one is already it (a restart, StrictMode's second effect run). */
export function pushGameEntry(): void {
  if (isMarked()) return;
  const state: unknown = window.history.state;
  const base = typeof state === 'object' && state !== null ? state : {};
  window.history.pushState({ ...base, [MARK]: true }, '');
}

let leaving: (() => void) | null = null;
/** Back has popped the game's entry and it has not been restored yet. */
let poppedOff = false;

/**
 * Handle a `popstate` during a game. Returns true when Back was pressed on the game's entry:
 * the caller acts on it, then calls `restoreGameEntry`.
 */
export function handleGamePop(): boolean {
  if (leaving) {
    const done = leaving;
    leaving = null;
    done();
    return false;
  }
  // Arriving back on the entry is the echo of `restoreGameEntry`'s `forward()`.
  if (isMarked()) return false;
  poppedOff = true;
  return true;
}

/**
 * Step back onto the game's entry after a Back press that did not end the game (it closed a
 * popup, or opened the confirm). A no-op when the press left the game: `leaveGameEntry` has
 * already claimed the pop.
 *
 * `history.forward()`, not a second `pushState`: the entry still exists, and Chrome skips
 * entries a page pushes without a tap when Back is pressed again.
 */
export function restoreGameEntry(): void {
  if (!poppedOff) return;
  poppedOff = false;
  window.history.forward();
}

/**
 * Leave the game's entry, then run `then`. Leaving by a Home button must consume the entry, or
 * the next Back from the home screen would need two presses.
 *
 * `history.back()` is asynchronous, and `then` may navigate (the `/daily` route replaces itself
 * with `/`): doing that before the pop lands would replace the wrong entry, so it waits for the
 * `popstate` that `handleGamePop` reports. The timer is for a pop that never comes.
 */
export function leaveGameEntry(then: () => void): void {
  // Left by the Back press itself: that press already popped the entry.
  if (poppedOff || !isMarked()) {
    poppedOff = false;
    then();
    return;
  }
  let timer = 0;
  const run = () => {
    window.clearTimeout(timer);
    then();
  };
  timer = window.setTimeout(() => {
    if (leaving !== run) return;
    leaving = null;
    then();
  }, 500);
  leaving = run;
  window.history.back();
}

/** Test seam: forget a pending leave. */
export function resetGameBackEntry(): void {
  poppedOff = false;
  leaving = null;
}
