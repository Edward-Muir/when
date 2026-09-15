import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Where the drag's insertion marker should sit: the centre of the row the ghost card currently
 * occupies, in VIEWPORT coordinates.
 *
 * Measured rather than computed from the gap index, because the gap index is not a display-row
 * index. `buildTimelineRows` interleaves tombstones, a gap that already holds a tombstone hosts
 * the ghost inside that row instead of inserting one, and the two ends extend the rail rather
 * than sitting between neighbours. Reading the ghost row's own box covers all of those without a
 * single special case.
 *
 * Viewport coordinates, not content coordinates, because the marker is portalled out to `body`
 * to clear the drag overlay (see TimelineMarker). That is safe precisely because it only exists
 * during a drag, and the board freezes its own scrolling for the duration — so the viewport and
 * the content cannot drift apart while the marker is on screen.
 */

/** Marks the row the ghost card currently occupies. */
export const GHOST_ROW_ATTR = 'data-ghost-row';

export interface InsertionMarker {
  /** Centre of the rail, horizontally. */
  x: number;
  /** Centre of the ghost row, vertically. */
  y: number;
  visible: boolean;
}

export function useInsertionMarker(
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  gap: number | null
): InsertionMarker {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    // Hold the last position when the drag ends so the marker fades out where it was rather
    // than sliding away to nowhere on its way out.
    if (gap === null) return;

    const measure = () => {
      const row = contentRef.current?.querySelector<HTMLElement>(`[${GHOST_ROW_ATTR}]`);
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      // Take x off the rail itself rather than re-deriving the 96px board gutter here, so this
      // stays correct on its own if the board column invariant ever moves (see index.css).
      const rail = row.querySelector<HTMLElement>('.tl-rail')?.getBoundingClientRect();
      const next = {
        x: rail ? rail.left + rail.width / 2 : rowRect.left,
        y: rowRect.top + rowRect.height / 2,
      };
      setPos((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
    };

    measure();
    // Viewport coordinates go stale the moment anything moves under them. A real drag freezes
    // the board's scrolling so neither of these fires, but the ghost can be mounted before the
    // board has finished settling — the harness holds one from first paint, and card art lands
    // late — and then the marker would sit wherever the row used to be.
    const content = contentRef.current;
    const box = scrollRef.current;
    const ro = new ResizeObserver(measure);
    if (content) ro.observe(content);
    box?.addEventListener('scroll', measure, { passive: true });
    return () => {
      ro.disconnect();
      box?.removeEventListener('scroll', measure);
    };
  }, [gap, contentRef, scrollRef]);

  return { ...pos, visible: gap !== null };
}
