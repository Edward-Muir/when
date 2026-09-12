import React from 'react';
import { formatGap, gapTicks, hasRailSegment, RowDecor, TimelineDecor } from './timelineDecor';

/*
 * Presentational spine decorations, rendered INSIDE a row's outer wrapper (which must be
 * `relative`). All are aria-hidden, pointer-events-none and carry no data attribute, so
 * nothing that measures rows (drag insertion, centering, the miss camera) notices them.
 * Colours come from the `--row-era` / `--row-era-prev` vars the row sets (rowDecorStyle).
 */

/**
 * The row's own slice of the rail: 4px wide at x = 96px, exactly where the static
 * `.board-rail` sits (rows are `w-full` inside the scroller's board padding, so a plain
 * `left-24` lands on it at every width — never `.board-rail` here). `data-era` only
 * drives the CSS texture; it is not one of the measured attributes.
 */
export const RailSegment: React.FC<{ decor: TimelineDecor; row: RowDecor | undefined }> = ({
  decor,
  row,
}) => {
  if (!hasRailSegment(decor)) return null;
  return (
    <div
      aria-hidden
      className="rail-seg pointer-events-none absolute inset-y-0 left-24 z-0 w-1"
      data-era={decor.eraStroke && row ? row.era : undefined}
    />
  );
};

/**
 * Time-gap ruler: hatch marks in the gutter, butting the rail from the left and centred
 * on the seam between this row and the one above (they straddle the 8px card gap). One
 * mark per order of magnitude of elapsed years; a whisper label at a millennium or more.
 */
export const GapRuler: React.FC<{ decor: TimelineDecor; row: RowDecor | undefined }> = ({
  decor,
  row,
}) => {
  const years = row?.gapYears ?? null;
  if (!decor.gapRuler || years === null) return null;
  const ticks = gapTicks(years);
  if (ticks === 0) return null;
  // 4px pitch (1px mark + 3px gap): the stack is `ticks * 4 - 3` tall, centred on the seam.
  const height = ticks * 4 - 3;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 flex w-24 items-center justify-end"
      style={{ top: -height / 2 - 4, height }}
    >
      {decor.gapLabels && years >= 1000 && (
        <span className="gap-label mr-1.5 whitespace-nowrap font-mono text-[9px] leading-none text-text-muted">
          {formatGap(years)}
        </span>
      )}
      <div className="flex flex-col justify-between self-stretch">
        {Array.from({ length: ticks }, (_, i) => (
          <span key={i} className="gap-hatch block h-px w-2" />
        ))}
      </div>
    </div>
  );
};
