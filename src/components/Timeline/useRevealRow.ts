import { RefObject, useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { PlacementResult } from '../../types';
import { REVEAL_FOLD_MS } from './TimelineEvent';

/**
 * The one row that stands tall: the latest correct placement, until the next drop. A drop of
 * any kind overwrites `lastPlacementResult`, so a correct one moves the reveal to the new row
 * and a miss ends it; a card returned to the hand leaves it alone. Null on a fresh deal and on
 * a restored daily, so nothing is ever tall that the player did not just place.
 */
export function getRevealName(lastPlacementResult: PlacementResult | null): string | null {
  return lastPlacementResult?.success ? lastPlacementResult.event.name : null;
}

/** Room kept clear at the board's top and bottom: the Earlier / Later fades are 48px. */
const REVEAL_EDGE_CLEARANCE = 52;

/**
 * Bring the tall row wholly on screen, by the least scroll that does it; null if it already
 * is. A normal row landing half under the Later fade is still readable, a 176px painting is
 * not. Never recentres: the player aimed at a spot and the board should stay under it.
 */
function revealScrollTarget(container: HTMLElement): number | null {
  const row = container.querySelector('[data-reveal-row]') as HTMLElement | null;
  if (!row) return null;
  const c = container.getBoundingClientRect();
  const r = row.getBoundingClientRect();
  const over = r.bottom - (c.bottom - REVEAL_EDGE_CLEARANCE);
  const under = c.top + REVEAL_EDGE_CLEARANCE - r.top;
  // Too tall to fit at all (a very short window): show its top.
  const delta =
    under > 0 || r.height > c.height - 2 * REVEAL_EDGE_CLEARANCE ? -under : Math.max(over, 0);
  return Math.abs(delta) < 1 ? null : container.scrollTop + delta;
}

/**
 * Names the tall row and keeps it on screen.
 *
 * The scroll is measured after the fold has finished, not predicted: the new row opens while
 * the previous one folds, and which of them is above the other decides where this one ends up.
 * It is done well inside the success flash (600ms), during which no drag can start; and a drag
 * stops it regardless, because the drag's gap midpoints are measured once at pickup and the
 * board must not move under them.
 */
export function useRevealRow(
  scrollRef: RefObject<HTMLDivElement | null>,
  lastPlacementResult: PlacementResult | null,
  isDragging: boolean
): string | null {
  const revealName = getRevealName(lastPlacementResult);
  const reduceMotion = useReducedMotion();
  const scrollAnim = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || revealName === null) return;
    const timer = setTimeout(
      () => {
        const target = revealScrollTarget(container);
        if (target === null) return;
        if (reduceMotion) {
          container.scrollTop = target;
          return;
        }
        scrollAnim.current = animate(container.scrollTop, target, {
          duration: 0.2,
          ease: 'easeOut',
          onUpdate: (v) => {
            container.scrollTop = v;
          },
        });
      },
      reduceMotion ? 0 : REVEAL_FOLD_MS + 40
    );
    return () => {
      clearTimeout(timer);
      scrollAnim.current?.stop();
    };
  }, [revealName, reduceMotion, scrollRef]);

  useEffect(() => {
    if (isDragging) scrollAnim.current?.stop();
  }, [isDragging]);

  return revealName;
}
