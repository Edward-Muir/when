import React, { useLayoutEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ConceptRow } from './shared';
import { edgeVars } from './shared';

/*
 * The scroll surface every concept shares: a 50vh runway above and below (as the game
 * has), the rows, edge masks instead of bg-coloured fades (the page is tinted now), and
 * the Earlier/Later labels. Concepts supply the row renderer and the runway ornaments.
 */
export const Scroller: React.FC<{
  rows: ConceptRow[];
  washPct: number;
  startRow: number;
  renderRow: (row: ConceptRow) => React.ReactNode;
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  edgeLabelClass?: string;
}> = ({
  rows,
  washPct,
  startRow,
  renderRow,
  top,
  bottom,
  edgeLabelClass = 'font-body text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const sc = ref.current;
    const row = sc?.querySelector<HTMLElement>(`[data-row="${startRow}"]`);
    if (!sc || !row) return;
    sc.scrollTop = row.offsetTop - (sc.clientHeight - row.offsetHeight) / 2;
  }, [startRow, rows]);

  return (
    <div className="relative h-full" style={{ '--wash-pct': `${washPct}%` } as React.CSSProperties}>
      <div ref={ref} className="cx-edge-mask timeline-scroll-vertical h-full overflow-y-auto">
        <div className="cx-wash-flat relative" style={{ height: '50vh', ...edgeVars(rows.at(0)) }}>
          {top}
        </div>
        {rows.map(renderRow)}
        <div className="cx-wash-flat relative" style={{ height: '50vh', ...edgeVars(rows.at(-1)) }}>
          {bottom}
        </div>
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 top-2 flex items-center justify-center gap-1 ${edgeLabelClass}`}
      >
        <ChevronUp className="h-3 w-3" strokeWidth={2.5} /> Earlier
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1 ${edgeLabelClass}`}
      >
        Later <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
      </div>
    </div>
  );
};
