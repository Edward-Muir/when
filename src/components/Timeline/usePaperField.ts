import { CSSProperties, RefObject, useCallback, useLayoutEffect, useState } from 'react';

/**
 * The board's paper: one continuous gradient behind the whole scroll content.
 *
 * The crossfade has a FIXED length and is CENTRED on the middle of the board. It runs warm →
 * cool over `RAMP_PX` either side of that midpoint, and holds flat beyond it in both
 * directions. A short board therefore sits inside the ramp and shows only its middle — muted at
 * both ends — while a longer board reaches past it on both sides, saturating to full warm at
 * the top and full cool at the bottom. The progression is in how much of the sweep you have
 * uncovered, not in the sweep itself changing shape.
 *
 * The ramp never rescales. It used to be stretched to fit the content with a stop per row, so
 * every placement redrew the gradient under every existing card. Now a placement only re-centres
 * it: the board grows by one row, so the midpoint moves half a row and the ramp follows. Against
 * a crossfade this long that is a fraction of a percent of the tone range — the paper under a
 * card you already placed does not visibly move.
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
 * between the colours the ramp actually reaches at the very top and very bottom of the content.
 */

/**
 * How long the warm → cool crossfade is, in px. Fixed on purpose — this is the one number that
 * decides how much of the sweep a board of a given length reveals. At ~88px a row, a board of
 * about twelve cards spans it exactly; anything shorter sits inside it, anything longer runs
 * past it into flat warm above and flat cool below.
 */
const RAMP_PX = 1100;

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

/** The ramp's colour at a given content offset, as a mix of the two paper tones. */
function toneAt(y: number, rampStart: number): string {
  const t = Math.min(1, Math.max(0, (y - rampStart) / RAMP_PX));
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

    // The board's midpoint. The two 50vh runways are equal, so the centre of the content is
    // also the centre of the card stack — no need to measure any rows to find it.
    const rampStart = height / 2 - RAMP_PX / 2;
    const rampEnd = rampStart + RAMP_PX;

    const next: PaperField = {
      style: {
        height,
        // Two stops is the whole gradient: a first stop's colour extends back to the top of the
        // box and a last stop's carries on to the bottom, which is exactly the flat warm head
        // and flat cool tail. `rampStart` goes negative on a board shorter than the ramp, which
        // is well-formed CSS and renders the middle slice of the sweep — the case this is for.
        backgroundImage:
          `linear-gradient(to bottom, var(--paper-early) ${rampStart.toFixed(1)}px, ` +
          `var(--paper-late) ${rampEnd.toFixed(1)}px)`,
      },
      edge: {
        backgroundImage: `linear-gradient(to bottom, ${toneAt(0, rampStart)}, ${toneAt(height, rampStart)})`,
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
