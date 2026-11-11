import { useEffect, useRef } from 'react';
import { registerBackHandler } from '../utils/backStack';

/**
 * While `active`, the system Back gesture during a game runs `handler` before anything under
 * it (see utils/backStack.ts).
 *
 * The handler is read through a ref and the registration keyed on `active` alone. Callers pass
 * inline arrows, and re-registering on every render would move a popup to the top of the stack
 * each time it re-rendered, above one opened after it.
 */
export function useBackHandler(active: boolean, handler: () => void, base = false): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;
    return registerBackHandler(() => handlerRef.current(), base);
  }, [active, base]);
}
