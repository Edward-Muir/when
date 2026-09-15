import { CSSProperties, RefObject, useCallback, useLayoutEffect, useState } from 'react';

/**
 * The board's paper: one continuous gradient behind the whole scroll content.
 *
 * The crossfade has a FIXED length. It starts at the first card and runs warm → cool over
 * `RAMP_PX`, then holds cool for as long as the board goes on. A short board therefore shows
 * only the opening of the ramp and a long one reveals more of it — the progression is in how
 * much of the sweep you have uncovered, not in the sweep itself.
 *
 * That is the point: the ramp never rescales. It used to be stretched to fit the content with a
 * stop per row, so every placement moved the gradient under every existing card. Now the only
 * thing a new card changes is how far the flat tail runs, and `rampStart` is the top runway's
 * height, which never changes either. Nothing moves.
 *
 * Because the stops are plain `var(--paper-*)` rather than colours mixed in JS, a theme switch
 * repaints on its own with nothing to recompute.
 *
 * It is ONE element rather than a tint per row for two reasons. It is genuinely continuous —
 * per-row gradients meet at row boundaries and can band. And, more importantly, it can be
 * full-bleed: the element is an absolutely positioned child of the scroller, so `left: 0;
 * right: 0` resolve against the scroller's PADDING box and the tint reaches the screen edges
 * at every width. A per-row tint would stop at the row's content box, which above 1024px is
 * inset by `.board-center`'s padding, leaving a tinted column on an untinted page.
 *
 * Absolutely positioned children of a scroll container scroll with the content, so the field
 * tracks the board without any scroll listener.
 *
 * It comes with a second, simpler style for the board's own backdrop (`edge`), because the
 * field only covers the content and two things sit outside it: the elastic overscroll region a
 * rubber-band drag opens up past either end, and the top and bottom bands where
 * `.tl-edge-mask` fades the scroller out. Both would otherwise expose the untinted page colour
 * behind the paper, which reads as a hard grey edge. A bounce can only happen at scrollTop 0 or
 * at the maximum, where the board is showing its first or last runway — so the backdrop runs
 * from the ramp's start colour to whatever colour the board has actually reached.
 */

/** Marks a board row. Only the first one is read, to anchor the ramp below the top runway. */
export const PAPER_ROW_ATTR = 'data-paper-row';

/**
 * How long the warm → cool crossfade is, in px. Fixed on purpose — this is the one number that
 * decides how much of the sweep a board of a given length reveals. At ~88px a row: five cards
 * show about a fifth of it, fourteen a little over half, and a good game of thirty or so
 * uncovers the whole thing and then runs on flat.
 */
const RAMP_PX = 2200;

export interface PaperField {
  /** The field itself: an absolutely positioned child of the scroller. */
  style: CSSProperties;
  /** The backdrop behind the scroller, for the overscroll region and the masked bands. */
  edge: CSSProperties;
}

/** The gradient is rebuilt on every measure; only commit it when it actually differs. */
function same(a: PaperField | null, b: PaperField): boolean {
  return (
    a !== null &&
    a.style.height === b.style.height &&
    a.style.backgroundImage === b.style.backgroundImage &&
    a.edge.backgroundImage === b.edge.backgroundImage
  );
}

/** The ramp colour a given distance past its start, as a mix of the two paper tones. */
function toneAt(px: number): string {
  const t = Math.min(1, Math.max(0, px / RAMP_PX));
  return `color-mix(in oklab, var(--paper-late) ${(t * 100).toFixed(1)}%, var(--paper-early))`;
}

export function usePaperField(
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>
): PaperField | null {
  const [field, setField] = useState<PaperField | null>(null);

  const measure = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    const height = content.scrollHeight;
    if (height <= 0) return;

    // Anchor at the first card, so the runway above it stays flat and the sweep begins where
    // the board does. This is the top runway's height, which does not change as cards land.
    const firstRow = content.querySelector<HTMLElement>(`[${PAPER_ROW_ATTR}]`);
    const rampStart = firstRow ? firstRow.offsetTop : 0;

    const next: PaperField = {
      style: {
        height,
        // A gradient's last stop carries on to the end, so the flat cool tail needs no stop.
        backgroundImage:
          'linear-gradient(to bottom, var(--paper-early) 0px, ' +
          `var(--paper-early) ${rampStart}px, var(--paper-late) ${rampStart + RAMP_PX}px)`,
      },
      edge: {
        backgroundImage: `linear-gradient(to bottom, var(--paper-early), ${toneAt(height - rampStart)})`,
      },
    };
    // Without this the ResizeObserver's own commit re-renders, re-measures and commits again.
    setField((prev) => (same(prev, next) ? prev : next));
  }, [contentRef]);

  useLayoutEffect(() => {
    measure();
    const content = contentRef.current;
    const box = scrollRef.current;
    if (!content) return;
    // The 50vh runways change on rotation, and the content grows on every placement.
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    if (box) ro.observe(box);
    return () => ro.disconnect();
  }, [measure, contentRef, scrollRef]);

  return field;
}
