import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Where the drag's insertion marker should sit: the centre of the row the ghost card currently
 * occupies, measured against the board's content wrapper.
 *
 * Measured rather than computed from the gap index, because the gap index is not a display-row
 * index. `buildTimelineRows` interleaves tombstones, a gap that already holds a tombstone hosts
 * the ghost inside that row instead of inserting one, and the two ends extend the rail rather
 * than sitting between neighbours. Reading the ghost row's own box covers all of those without a
 * single special case. Scroll is frozen for the duration of a drag, so the offsets are stable
 * while the pointer moves.
 */

/** Marks the row the ghost card currently occupies. */
export const GHOST_ROW_ATTR = 'data-ghost-row';

export interface InsertionMarker {
  /** Centre of the ghost row, in content-wrapper coordinates. */
  y: number;
  visible: boolean;
}

export function useInsertionMarker(
  contentRef: RefObject<HTMLDivElement | null>,
  gap: number | null
): InsertionMarker {
  const [y, setY] = useState(0);

  useLayoutEffect(() => {
    // Hold the last position when the drag ends so the marker fades out where it was rather
    // than snapping back to the top of the board on its way out.
    if (gap === null) return;
    const row = contentRef.current?.querySelector<HTMLElement>(`[${GHOST_ROW_ATTR}]`);
    if (!row) return;
    setY(row.offsetTop + row.offsetHeight / 2);
  }, [gap, contentRef]);

  return { y, visible: gap !== null };
}
