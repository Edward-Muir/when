import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ConceptRow } from './shared';
import { edgeVars, eraName, eraVars, yearParts } from './shared';

/*
 * The scroll surface: a 50vh runway above and below (as the game has), the rows, and the
 * sticky year readout — the one piece of chrome that moves. The readout shows the year of
 * the last plate whose top has passed its baseline, so scrolling rolls the number over.
 */

/** Scroller-relative y of the readout's baseline: a plate's top crossing it becomes "now". */
const READOUT_LINE = 84;

function useActiveRow(ref: React.RefObject<HTMLDivElement | null>, rowCount: number) {
  const [active, setActive] = useState(0);
  const frame = useRef<number | undefined>(undefined);
  const measure = useCallback(() => {
    const sc = ref.current;
    if (!sc) return;
    const y = sc.scrollTop + READOUT_LINE;
    const rows = sc.querySelectorAll<HTMLElement>('[data-row]');
    let index = 0;
    rows.forEach((row) => {
      if (row.offsetTop <= y) index = Number(row.dataset.row);
    });
    setActive(index);
  }, [ref]);
  const onScroll = useCallback(() => {
    if (frame.current !== undefined) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      measure();
    });
  }, [measure]);
  useEffect(
    () => () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    []
  );
  return { active, onScroll, measure, rowCount };
}

const Readout: React.FC<{ row: ConceptRow | undefined; washPct: number }> = ({ row, washPct }) => {
  const reduce = useReducedMotion();
  if (!row) return null;
  const { main, suffix } = yearParts(row.event.year);
  return (
    <div
      className="cx-readout-scrim pointer-events-none absolute inset-x-0 top-0 h-[104px] px-4 pt-3"
      style={
        {
          ...eraVars({ ...row, prevEra: row.era }),
          '--wash-pct': `${washPct}%`,
        } as React.CSSProperties
      }
    >
      <div className="relative h-14">
        <AnimatePresence initial={false}>
          <motion.div
            key={`${row.event.year}-${row.era}`}
            className="absolute left-0 top-0"
            initial={reduce ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="flex items-baseline gap-2 leading-none">
              <span className="font-display text-[40px] font-semibold text-text">{main}</span>
              {suffix && (
                <span className="font-body text-[12px] uppercase tracking-[0.2em] text-text-muted">
                  {suffix}
                </span>
              )}
            </div>
            <div className="mt-1.5 font-body text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              {eraName(row.era)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute right-4 top-3 flex items-center gap-1 font-body text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">
        Earlier <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
      </div>
    </div>
  );
};

export const Scroller: React.FC<{
  rows: ConceptRow[];
  washPct: number;
  startRow: number;
  renderRow: (row: ConceptRow) => React.ReactNode;
}> = ({ rows, washPct, startRow, renderRow }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { active, onScroll, measure } = useActiveRow(ref, rows.length);

  useLayoutEffect(() => {
    const sc = ref.current;
    const row = sc?.querySelector<HTMLElement>(`[data-row="${startRow}"]`);
    if (!sc || !row) return;
    sc.scrollTop = row.offsetTop - (sc.clientHeight - row.offsetHeight) / 2;
    measure();
  }, [startRow, rows, measure]);

  return (
    <div className="relative h-full" style={{ '--wash-pct': `${washPct}%` } as React.CSSProperties}>
      <div
        ref={ref}
        onScroll={onScroll}
        className="cx-bottom-mask timeline-scroll-vertical h-full overflow-y-auto"
      >
        <div className="cx-wash-flat" style={{ height: '50vh', ...edgeVars(rows.at(0)) }} />
        {rows.map(renderRow)}
        <div className="cx-wash-flat" style={{ height: '50vh', ...edgeVars(rows.at(-1)) }} />
      </div>
      <Readout row={rows.at(active)} washPct={washPct} />
      <div className="pointer-events-none absolute bottom-2 right-4 flex items-center gap-1 font-body text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted">
        Later <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
      </div>
    </div>
  );
};
