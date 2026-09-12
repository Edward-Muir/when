import React from 'react';
import { ConceptCard } from './ConceptCard';
import { Scroller } from './Scroller';
import { ConceptRow, eraVars, formatGap, gapScale, yearParts } from './shared';

/*
 * Concept B — "Dusk to Dawn". Cinematic. A luminous line with a lamp at every event, the
 * page's temperature shifting from umber dusk to teal dawn, and elapsed time taking real
 * vertical space: a millennium is a breath, a million years a pause.
 */

const Year: React.FC<{ year: number; muted?: boolean }> = ({ year, muted = false }) => {
  const { main, suffix } = yearParts(year);
  const size = main.length <= 5 ? 'text-[17px]' : main.length <= 8 ? 'text-[14px]' : 'text-[12px]';
  return (
    <div
      className={`flex flex-col items-end font-mono leading-none tracking-[0.02em] ${muted ? 'opacity-60' : ''}`}
    >
      <span className={`whitespace-nowrap text-text ${size}`}>{main}</span>
      {suffix && <span className="mt-1 text-[10px] text-text-muted">{suffix}</span>}
    </div>
  );
};

/** Deep time: the line dissolves upward into ever-sparser embers. */
const DeepTime: React.FC = () => {
  const gaps = [8, 11, 15, 21, 29, 40, 56, 78];
  let y = 0;
  return (
    <>
      <div className="cx-glowline-thin absolute bottom-0 left-24 h-10 w-0.5 -translate-x-1/2" />
      {gaps.map((g, i) => {
        y += g;
        const size = Math.max(2, 5 - i * 0.4);
        return (
          <span
            key={i}
            className="cx-dot absolute left-24 rounded-full"
            style={{
              bottom: 40 + y,
              width: size,
              height: size,
              marginLeft: -size / 2,
              opacity: Math.max(0.15, 0.7 - i * 0.07),
            }}
          />
        );
      })}
    </>
  );
};

/** The future: the line sharpens, then ends in an open ring. */
const Future: React.FC = () => (
  <>
    <div className="cx-glowline-thin absolute left-24 top-0 h-14 w-px -translate-x-1/2" />
    <div className="cx-lamp-off absolute left-24 top-14 h-2.5 w-2.5 -translate-x-1/2 rounded-full" />
  </>
);

const Row: React.FC<{ row: ConceptRow }> = ({ row }) => {
  const pad = Math.round(40 * gapScale(row.gapYears));
  const showGap = row.gapYears !== null && row.gapYears >= 500;
  const dead = row.kind === 'tombstone';
  return (
    <div
      className="cx-wash relative w-full"
      style={{ ...eraVars(row), paddingTop: pad }}
      data-row={row.index}
    >
      <div
        className={`absolute inset-y-0 left-24 w-0.5 -translate-x-1/2 ${pad > 16 ? 'cx-glowline-thin' : 'cx-glowline'}`}
      />
      {showGap && (
        <span
          className="absolute left-0 w-24 pr-4 text-right font-mono text-[10px] leading-none text-text-muted opacity-80"
          style={{ top: pad / 2 - 4 }}
        >
          {formatGap(row.gapYears ?? 0)}
        </span>
      )}
      <div className="relative flex items-center py-1">
        <div className="w-24 shrink-0 pr-4">
          <Year year={row.event.year} muted={dead} />
        </div>
        <div
          className={`absolute left-24 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            dead ? 'cx-lamp-off h-2.5 w-2.5' : 'cx-lamp h-2 w-2'
          }`}
        />
        <div className="flex-1 pl-4 pr-4">
          <ConceptCard event={row.event} concept="dusk" dead={dead} />
        </div>
      </div>
    </div>
  );
};

const Dusk: React.FC<{ rows: ConceptRow[]; startRow: number }> = ({ rows, startRow }) => (
  <Scroller
    rows={rows}
    washPct={100}
    startRow={startRow}
    renderRow={(row) => <Row key={row.event.name} row={row} />}
    top={<DeepTime />}
    bottom={<Future />}
  />
);

export default Dusk;
