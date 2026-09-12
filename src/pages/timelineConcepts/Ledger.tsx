import React from 'react';
import { ConceptCard } from './ConceptCard';
import { Scroller } from './Scroller';
import { ConceptRow, eraName, eraVars, yearParts } from './shared';

/*
 * Concept C — "Ledger". Instrument. The gutter is a scale: a rail with continuous
 * graduations, a major tick at every event, an axis-break glyph where ten millennia are
 * compressed, and the era set vertically along the far edge like a book spine.
 */

const Year: React.FC<{ year: number; muted?: boolean }> = ({ year, muted = false }) => {
  const { main, suffix } = yearParts(year);
  const size = main.length <= 5 ? 'text-[22px]' : main.length <= 8 ? 'text-[16px]' : 'text-[13px]';
  return (
    <div className={`flex flex-col items-end leading-none ${muted ? 'opacity-60' : ''}`}>
      <span className={`whitespace-nowrap font-display text-text ${size}`}>{main}</span>
      {suffix && (
        <span className="mt-1 font-body text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
};

const Row: React.FC<{ row: ConceptRow }> = ({ row }) => {
  const dead = row.kind === 'tombstone';
  const broken = (row.gapYears ?? 0) >= 10000;
  const label = row.eraStart && row.eraSpan >= 2;
  return (
    <div className="cx-wash relative w-full" style={eraVars(row)} data-row={row.index}>
      {/* rail + graduations every 8px, the instrument's constant beat */}
      <div className="cx-rail absolute inset-y-0 left-24 w-px" />
      <div className="cx-graduations absolute inset-y-0 w-1.5" style={{ left: 89 }} />
      {row.eraStart && row.index > 0 && (
        <div className="cx-hairline-ink absolute left-24 right-4 top-0 h-px" />
      )}
      {label && (
        <span
          className="absolute right-1 top-3 z-10 [writing-mode:vertical-rl] font-body text-[10px] font-medium uppercase tracking-[0.28em] text-text-muted"
          style={eraVars(row)}
        >
          {eraName(row.era)}
        </span>
      )}
      {broken && <div className="cx-break absolute left-24 -top-px h-3.5 w-5 -translate-x-1/2" />}
      <div className="relative flex items-start py-[7px]">
        <div className="w-24 shrink-0 pl-2 pr-4 pt-[6px]">
          <Year year={row.event.year} muted={dead} />
        </div>
        {/* major tick, aligned with the cap height of the year */}
        <div className="cx-bg-ink absolute left-[86px] top-[19px] h-0.5 w-[10px]" />
        <div className="flex-1 pl-4 pr-4">
          <ConceptCard event={row.event} concept="ledger" dead={dead} />
        </div>
      </div>
    </div>
  );
};

const Ledger: React.FC<{ rows: ConceptRow[]; startRow: number }> = ({ rows, startRow }) => (
  <Scroller
    rows={rows}
    washPct={45}
    startRow={startRow}
    renderRow={(row) => <Row key={row.event.name} row={row} />}
    top={
      <>
        <div className="cx-rail absolute bottom-0 left-24 h-full w-px" />
        <div className="cx-graduations absolute bottom-0 h-1/2 w-1.5" style={{ left: 89 }} />
      </>
    }
    bottom={
      <>
        <div className="cx-rail absolute left-24 top-0 h-full w-px" />
        <div className="cx-graduations absolute top-0 h-1/2 w-1.5" style={{ left: 89 }} />
      </>
    }
  />
);

export default Ledger;
