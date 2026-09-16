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
 *
 * This is the marker's TARGET, not where it is painted — it trails on a soft spring and is
 * routinely still in flight. Anything that needs the dot's actual position (the tick it turns
 * into when a card lands) reads it off the marker itself; see TimelineMarker's `onPosition`.
 */

/** Marks the row the ghost card currently occupies. */
export const GHOST_ROW_ATTR = 'data-ghost-row';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface InsertionMarker {
  /** Centre of the rail, horizontally. */
  x: number;
  /** Centre of the ghost row, vertically. */
  y: number;
  /**
   * The board's own bounds. The marker is drawn inside a clip box of exactly this size so it
   * can sit above the drag overlay without ever reaching the hand bar or the top bar — see
   * TimelineMarker for why z-index alone cannot express that.
   */
  clip: Rect;
  visible: boolean;
}

const NO_CLIP: Rect = { left: 0, top: 0, width: 0, height: 0 };

export function useInsertionMarker(
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  gap: number | null
): InsertionMarker {
  const [pos, setPos] = useState<{ x: number; y: number; clip: Rect }>({
    x: 0,
    y: 0,
    clip: NO_CLIP,
  });

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
      const board = scrollRef.current?.getBoundingClientRect();
      const x = rail ? rail.left + rail.width / 2 : rowRect.left;
      const y = rowRect.top + rowRect.height / 2;
      const next = {
        x,
        y,
        clip: board
          ? { left: board.left, top: board.top, width: board.width, height: board.height }
          : NO_CLIP,
      };
      setPos((prev) =>
        prev.x === next.x &&
        prev.y === next.y &&
        prev.clip.top === next.clip.top &&
        prev.clip.height === next.clip.height &&
        prev.clip.left === next.clip.left &&
        prev.clip.width === next.clip.width
          ? prev
          : next
      );
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
