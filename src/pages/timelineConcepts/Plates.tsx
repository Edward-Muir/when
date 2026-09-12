import React from 'react';
import { Plate, PlateVariant } from './Plate';
import { Scroller } from './Scroller';
import { ConceptRow, eraVars, formatGap, gapScale } from './shared';

/*
 * The rows: one plate each, on a page whose tint drifts warm → cool with the era, with
 * elapsed time taking vertical space — and, across a millennium or more, a whispered
 * count of the years passed.
 */

const Row: React.FC<{ row: ConceptRow; variant: PlateVariant }> = ({ row, variant }) => {
  const whisper = row.gapYears !== null && row.gapYears >= 1000;
  const pad = Math.max(whisper ? 26 : 0, Math.round(30 * gapScale(row.gapYears)));
  return (
    <div
      className="cx-wash relative w-full"
      style={{ ...eraVars(row), paddingTop: pad }}
      data-row={row.index}
    >
      {whisper && (
        <div
          className="absolute inset-x-0 text-center font-mono text-[10px] leading-none text-text-muted opacity-80"
          style={{ top: pad / 2 - 2 }}
        >
          {formatGap(row.gapYears ?? 0)}
        </div>
      )}
      <div className="px-4 py-[5px]">
        <Plate event={row.event} variant={variant} dead={row.kind === 'tombstone'} />
      </div>
    </div>
  );
};

const Plates: React.FC<{ rows: ConceptRow[]; startRow: number; variant: PlateVariant }> = ({
  rows,
  startRow,
  variant,
}) => (
  <Scroller
    rows={rows}
    washPct={40}
    startRow={startRow}
    renderRow={(row) => <Row key={row.event.name} row={row} variant={variant} />}
  />
);

export default Plates;
