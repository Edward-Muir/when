import { CSSProperties, RefObject, useCallback, useLayoutEffect, useState } from 'react';
import { paperToneColor } from '../../utils/paperTone';

/**
 * The board's paper: one continuous gradient behind the whole scroll content, with a stop at
 * every row carrying that card's tone.
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
 * `.tl-edge-mask` fades the scroller out. Both used to expose the untinted page colour behind
 * the paper, which reads as a hard grey edge.
 *
 * The backdrop is a plain first-tone → last-tone gradient on the unmasked container behind the
 * scroller, and that is exact where it matters: a bounce can only happen at scrollTop 0 or at
 * the maximum, where the board is showing its first or last runway, and those are precisely
 * the two ends of this gradient. In the masked bands mid-scroll it is off by however far the
 * visible rows are from the ends — a couple of RGB units in a palette this quiet.
 */

/** Marks the rows whose offsets become gradient stops. */
export const PAPER_ROW_ATTR = 'data-paper-row';

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

export function usePaperField(
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  tones: number[]
): PaperField | null {
  const [field, setField] = useState<PaperField | null>(null);

  const measure = useCallback(() => {
    const content = contentRef.current;
    const first = tones.at(0);
    const last = tones.at(-1);
    if (!content || first === undefined || last === undefined) {
      setField(null);
      return;
    }
    const height = content.scrollHeight;
    if (height <= 0) return;
    const rows = content.querySelectorAll<HTMLElement>(`[${PAPER_ROW_ATTR}]`);
    // The runways above the first card and below the last hold that end's tone flat, so the
    // ramp only moves where there are actually cards.
    const stops = [`${paperToneColor(first)} 0%`];
    rows.forEach((row, i) => {
      const tone = tones.at(i);
      if (tone === undefined) return;
      const pct = ((row.offsetTop + row.offsetHeight / 2) / height) * 100;
      stops.push(`${paperToneColor(tone)} ${pct.toFixed(2)}%`);
    });
    stops.push(`${paperToneColor(last)} 100%`);
    const next: PaperField = {
      style: { height, backgroundImage: `linear-gradient(to bottom, ${stops.join(', ')})` },
      edge: {
        backgroundImage: `linear-gradient(to bottom, ${paperToneColor(first)}, ${paperToneColor(last)})`,
      },
    };
    // Without this the ResizeObserver's own commit re-renders, re-measures and commits again.
    setField((prev) => (same(prev, next) ? prev : next));
  }, [contentRef, tones]);

  useLayoutEffect(() => {
    measure();
    const content = contentRef.current;
    const box = scrollRef.current;
    if (!content) return;
    // The 50vh runways change on rotation, and row count changes on every placement.
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    if (box) ro.observe(box);
    return () => ro.disconnect();
  }, [measure, contentRef, scrollRef]);

  return field;
}
