import { useEffect, useRef } from 'react';
import { useHaptics } from './useHaptics';

/**
 * One light tick each time the home pager settles on a different tab, by swipe or by tap.
 *
 * Compared against the last page seen, which starts as the page the screen opened on: the
 * pager reports its index on every scroll event, including the scroll that puts it on its
 * first page, and none of those is a change.
 */
export function useTabChangeHaptic(activePage: number): void {
  const { haptics } = useHaptics();
  const lastPage = useRef(activePage);

  useEffect(() => {
    if (lastPage.current === activePage) return;
    lastPage.current = activePage;
    haptics.select();
  }, [activePage, haptics]);
}
