import React from 'react';
import { ConceptCard } from './ConceptCard';
import { Scroller } from './Scroller';
import { ConceptRow, eraName, eraStartYear, eraVars, yearParts } from './shared';
import { formatYear } from '../../utils/gameLogic';

/*
 * Concept A — "Atlas". Editorial, museum plate. A hairline spine with a node per event,
 * Playfair years, small-caps chapter rules where the era turns, and a quiet era wash.
 */

const yearSize = (main: string) =>
  main.length <= 5 ? 'text-[20px]' : main.length <= 8 ? 'text-[16px]' : 'text-[14px]';

const Year: React.FC<{ year: number; muted?: boolean }> = ({ year, muted = false }) => {
  const { main, suffix } = yearParts(year);
  return (
    <div className={`flex flex-col items-end leading-none ${muted ? 'opacity-60' : ''}`}>
      <span className={`font-display font-semibold text-text ${yearSize(main)}`}>{main}</span>
      {suffix && (
        <span className="mt-1 font-body text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
};

/** Where the era turns: a rule across the card column with the era's name sitting on it. */
const Chapter: React.FC<{ row: ConceptRow }> = ({ row }) => (
  <div className="relative flex h-11 items-center">
    <div className="w-24 shrink-0 pr-4 text-right">
      <span className="font-display text-[13px] italic text-text-muted">
        {formatYear(eraStartYear(row.era))}
      </span>
    </div>
    <div className="flex flex-1 items-center gap-3 pl-4 pr-4">
      <span className="font-body text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">
        {eraName(row.era)}
      </span>
      <div className="cx-hairline h-px flex-1" />
    </div>
  </div>
);

const Row: React.FC<{ row: ConceptRow }> = ({ row }) => {
  const longGap = (row.gapYears ?? 0) >= 1000;
  const dead = row.kind === 'tombstone';
  return (
    <div className="cx-wash relative w-full" style={eraVars(row)} data-row={row.index}>
      {/* the spine: one continuous hairline through chapter, gap and card alike */}
      <div className="cx-hairline absolute inset-y-0 left-24 w-px" />
      {row.eraStart && row.index > 0 && <Chapter row={row} />}
      {longGap && !row.eraStart && (
        <div className="relative flex h-4 flex-col items-center justify-center gap-[3px]">
          <span className="cx-bg-ink absolute left-24 top-1 h-1 w-1 -translate-x-1/2 rounded-full opacity-60" />
          <span className="cx-bg-ink absolute left-24 top-[7px] h-1 w-1 -translate-x-1/2 rounded-full opacity-60" />
          <span className="cx-bg-ink absolute left-24 top-[13px] h-1 w-1 -translate-x-1/2 rounded-full opacity-60" />
        </div>
      )}
      <div className="relative flex items-center py-[5px]">
        <div className="w-24 shrink-0 pr-4">
          <Year year={row.event.year} muted={dead} />
        </div>
        <div
          className={`absolute left-24 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full ${
            dead ? 'cx-node-hollow' : 'cx-node'
          }`}
        />
        <div className="flex-1 pl-4 pr-4">
          <ConceptCard event={row.event} concept="atlas" dead={dead} />
        </div>
      </div>
    </div>
  );
};

const Atlas: React.FC<{ rows: ConceptRow[]; startRow: number }> = ({ rows, startRow }) => (
  <Scroller
    rows={rows}
    washPct={65}
    startRow={startRow}
    renderRow={(row) => <Row key={row.event.name} row={row} />}
    top={<div className="cx-hairline absolute bottom-0 left-24 h-2/3 w-px" />}
    bottom={<div className="cx-hairline absolute left-24 top-0 h-2/3 w-px" />}
  />
);

export default Atlas;
