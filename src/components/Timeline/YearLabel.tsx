import { CSSProperties } from 'react';
import { HistoricalEvent } from '../../types';
import { formatEventYearParts } from '../../utils/gameLogic';

type YearLike = Pick<HistoricalEvent, 'year' | 'year_end'>;

/**
 * The contents of a timeline row's year cell.
 *
 * An event that spans a window stacks over two lines inside the same fixed 96px column —
 * "1200-" over "1400". At one size down that is ~26px, comfortably inside the 80/96px row, so
 * the row height does not change; that is the argument for stacking rather than shrinking the
 * whole label onto one line, where "3,000-2,500 BCE" would not fit anyway.
 *
 * This renders the inner content only. The caller owns the single element carrying
 * `data-timeline-year`, which `useDragAndDrop` counts to derive insertion gaps — a second
 * element with that attribute would silently corrupt every index.
 */
export function YearLabel({ event }: { event: YearLike }) {
  const { start, end } = formatEventYearParts(event);
  if (end === null) return <>{start}</>;
  return (
    <>
      <span className="block">{start}</span>
      <span className="block">{end}</span>
    </>
  );
}

/** The width the year cell has for its text, px: the 96px gutter less its padding and tick. */
const YEAR_ROOM = 68;
/**
 * How much the centred year grows on the wheel. Must match `YEAR_SWELL` in useTimelineWheel.ts,
 * which reads each label's `--wheel-year-max` and falls back to this.
 */
const YEAR_SWELL = 0.42;

/**
 * How far this label can grow before it leaves the gutter: a short year takes the full swell,
 * "2000 BCE" almost none. Estimated from the character count (about 0.6em each), because the
 * label must not be measured: it is scaled by a transform, and it sits in a row the wheel poses.
 */
export function yearSwell(event: YearLike): number {
  const { start, end } = formatEventYearParts(event);
  const size = end === null ? 14 : 11;
  const width = Math.max(start.length, end?.length ?? 0) * size * 0.6;
  return Math.max(0, Math.min(YEAR_SWELL, YEAR_ROOM / width - 1));
}

/**
 * A row's year as the wheel shows it: the same label, in the display face, growing and
 * brightening as its row nears the centre. Off the wheel it is the plain label.
 *
 * A wrapper of its own because the element carrying `data-timeline-year` already has a
 * transform that framer-motion owns (the pop on a correct placement).
 */
export function WheelYear({ event }: { event: YearLike }) {
  return (
    <span
      className="wheel-year wheel-year-display"
      style={{ '--wheel-year-max': yearSwell(event) } as CSSProperties}
    >
      <YearLabel event={event} />
    </span>
  );
}

/**
 * The type size for an event's year cell: one size down when the label stacks over two lines.
 *
 * A function rather than a ternary at each call site because both timeline rows sit on
 * ESLint's `complexity` ceiling, and an inline branch tips `TombstoneRow` over it.
 *
 * Deliberately not keyed on `isRangedEvent`: a deep-time window whose ends round to the same
 * magnitude collapses to a single label, and that one should stay full size.
 */
export function yearSizeClass(event: YearLike): string {
  return formatEventYearParts(event).end === null ? 'text-sm' : 'text-[11px]';
}
