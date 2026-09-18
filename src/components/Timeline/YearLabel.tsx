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
