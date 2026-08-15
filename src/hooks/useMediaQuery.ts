import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a CSS media query.
 *
 * Tailwind breakpoints handle nearly everything in this app, so reach for this only when a
 * breakpoint has to drive JavaScript rather than CSS — the leaderboard uses it because
 * framer-motion writes inline styles, so a responsive class can't swap the sheet's slide-up
 * for the modal's scale-in.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      // Guard for older WebKit (and jsdom, which does not implement matchMedia at all).
      if (typeof window.matchMedia !== 'function') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default useMediaQuery;
