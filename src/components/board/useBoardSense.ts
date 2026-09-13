import { RefObject, useEffect } from 'react';
import { ERA_COUNT, eraIndexForYear } from '../../utils/boardTime';

/**
 * The board's two scroll-driven senses, both written straight to the DOM so nothing runs
 * through React per frame:
 *
 * - `useEraWash`: which era the row nearest the middle of the screen belongs to, as an
 *   `era-N` class on the root. The CSS cross-fades the background tone between eras.
 *   Watched with an IntersectionObserver over the year labels (a thin band at the centre),
 *   so it costs nothing while the board is still.
 * - `useBoardEdges`: how far the player has pulled past either end (iOS reports the bounce
 *   as a scroll position beyond the range), as `--end-pull` on the scroller, and which end
 *   is on screen, as `data-edge` on the root, for the watermark stretch and the caption fade.
 */

const ERA_CLASSES = Array.from({ length: ERA_COUNT }, (_, i) => `era-${i}`);
/** Fraction of the runway (half a screen) within which an end counts as "on screen". */
const EDGE_ZONE = 0.35;

export function useEraWash(
  scrollRef: RefObject<HTMLDivElement | null>,
  rootRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  rowsKey: number
) {
  useEffect(() => {
    const scroller = scrollRef.current;
    const root = rootRef.current;
    if (!scroller || !root) return;
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      root.classList.remove(...ERA_CLASSES);
      return;
    }
    const setEra = (year: number) => {
      const cls = ERA_CLASSES[eraIndexForYear(year)];
      if (root.classList.contains(cls)) return;
      root.classList.remove(...ERA_CLASSES);
      root.classList.add(cls);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const year = Number((entry.target as HTMLElement).dataset.timelineYear);
          if (Number.isFinite(year)) setEra(year);
        }
      },
      { root: scroller, rootMargin: '-48% 0px -48% 0px', threshold: 0 }
    );
    scroller.querySelectorAll('[data-timeline-year]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [scrollRef, rootRef, enabled, rowsKey]);
}

export function useBoardEdges(
  scrollRef: RefObject<HTMLDivElement | null>,
  rootRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const scroller = scrollRef.current;
    const root = rootRef.current;
    if (!scroller || !root) return;
    if (!enabled) {
      scroller.style.removeProperty('--end-pull');
      delete root.dataset.edge;
      return;
    }
    let frame = 0;
    let lastEdge = '';
    let lastPull = -1;
    const measure = () => {
      frame = 0;
      const top = scroller.scrollTop;
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const pull = Math.round(top < 0 ? -top : top > max ? top - max : 0);
      if (pull !== lastPull) {
        scroller.style.setProperty('--end-pull', String(pull));
        lastPull = pull;
      }
      const zone = scroller.clientHeight * 0.5 * EDGE_ZONE;
      const edge = top < zone ? 'past' : top > max - zone ? 'future' : '';
      if (edge !== lastEdge) {
        if (edge) root.dataset.edge = edge;
        else delete root.dataset.edge;
        lastEdge = edge;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollRef, rootRef, enabled]);
}
