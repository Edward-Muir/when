/**
 * What the system Back gesture should close, most recent last.
 *
 * Every open `Modal` and the Menu drawer register here, and a game registers its own "go
 * home" at the bottom. `useGameBackButton` runs the top entry when Back is pressed during a
 * game, so Back closes whatever is on top first and only then acts as the top bar's Home.
 *
 * A stack rather than a single slot because popups nest: the avatar picker opens over the
 * game-over popup, a confirm over the board. Nothing reads this outside a game, where Back is
 * left to the browser.
 */
type BackHandler = () => void;

const stack: BackHandler[] = [];

/**
 * Register a handler; returns its unregister function. A `base` handler goes to the bottom, so
 * it runs only when nothing else is open, whatever order the effects mounted in.
 */
export function registerBackHandler(handler: BackHandler, base = false): () => void {
  if (base) stack.unshift(handler);
  else stack.push(handler);
  return () => {
    const index = stack.lastIndexOf(handler);
    if (index !== -1) stack.splice(index, 1);
  };
}

/** Run the top handler. False when nothing is registered. */
export function runTopBackHandler(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
}
