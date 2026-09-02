import React, { useLayoutEffect, useRef, useState } from 'react';
import { HeatCell, HeatmapModel, formatWeekdayDate } from '../../utils/statsDerived';

/** Cell size and gap, shared by the grid, the month-label offsets and the weekday column. */
const CELL = 12;
const GAP = 3;
const COL = CELL + GAP;
const WEEKDAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

interface Props {
  model: HeatmapModel;
  /** Badge name for an achievement id, for the tapped-day readout. */
  badgeName: (id: string) => string;
}

/**
 * A GitHub-style year of days: one column per week, Monday at the top, played days in the
 * accent, a star on the days a badge was earned, today outlined. Scrolls sideways and opens
 * on the most recent weeks; older history is a swipe away. `overscroll-x-contain` keeps that
 * swipe from chaining into the home pager, whose track is also a horizontal scroller.
 *
 * Tapping a day reads it out in a row beneath the grid rather than a tooltip, so the value
 * is reachable without hover and by keyboard (every cell is a button). Each button's hit
 * area extends exactly half the gap, no further: a bigger halo overlaps the next cell and
 * steals its taps, since later siblings paint on top. `min-h-0` opts the cells out of the
 * global 44px button minimum, which would otherwise stack the rows on top of each other.
 */
const CalendarHeatmap: React.FC<Props> = ({ model, badgeName }) => {
  const { weeks, monthLabels } = model;
  const scroller = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<HeatCell | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    setScrolled(el.scrollLeft > 0);
  }, [weeks.length]);

  const cellLabel = (cell: HeatCell) =>
    [formatWeekdayDate(cell.date), cell.played ? 'played' : 'skipped']
      .concat(cell.badgeIds.length ? ['badge earned'] : [])
      .join(', ');

  return (
    <div>
      <div className="flex gap-2">
        {/* Weekday letters, aligned with the grid rows (the spacer matches the month row). */}
        <div
          aria-hidden
          className="grid shrink-0 font-body text-[10px] leading-none text-text-muted"
          style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP, marginTop: 16 }}
        >
          {WEEKDAY_LABELS.map((label, row) => (
            <span key={row} className="flex items-center">
              {label}
            </span>
          ))}
        </div>

        <div
          ref={scroller}
          onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 0)}
          className={`hide-scrollbar min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1 ${
            scrolled ? 'fade-left' : ''
          }`}
        >
          <div style={{ width: weeks.length * COL - GAP }}>
            <div className="relative h-4 font-body text-[10px] leading-none text-text-muted">
              {monthLabels.map(({ col, label }) => (
                <span key={col} className="absolute top-0" style={{ left: col * COL }}>
                  {label}
                </span>
              ))}
            </div>
            <div
              role="grid"
              aria-label="Days played"
              className="grid"
              style={{
                gridAutoFlow: 'column',
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gridAutoColumns: `${CELL}px`,
                gap: GAP,
              }}
            >
              {weeks.flatMap((week) =>
                week.map((cell) =>
                  cell.isFuture ? (
                    <span key={cell.date} aria-hidden />
                  ) : (
                    <button
                      key={cell.date}
                      type="button"
                      aria-label={cellLabel(cell)}
                      aria-pressed={selected?.date === cell.date}
                      onClick={() =>
                        setSelected((prev) => (prev?.date === cell.date ? null : cell))
                      }
                      className={`relative h-3 min-h-0 w-3 rounded-[2px] before:absolute before:-inset-[1.5px] before:content-[''] ${
                        cell.played ? 'heat-played' : 'heat-skipped'
                      } ${cell.isToday ? 'outline outline-2 outline-offset-1 outline-accent' : ''} ${
                        selected?.date === cell.date ? 'ring-2 ring-accent-secondary' : ''
                      }`}
                    >
                      {cell.badgeIds.length > 0 && (
                        <span
                          aria-hidden
                          className={`absolute inset-0 grid place-items-center text-[8px] leading-none ${
                            cell.played ? 'text-white' : 'text-accent'
                          }`}
                        >
                          ★
                        </span>
                      )}
                    </button>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-[11px] text-text-muted">
        <span>Skipped</span>
        <span aria-hidden className="heat-skipped h-2.5 w-2.5 rounded-[2px]" />
        <span className="ml-1.5">Played</span>
        <span aria-hidden className="heat-played h-2.5 w-2.5 rounded-[2px]" />
        <span className="ml-1.5">★ badge earned</span>
      </div>

      {selected && (
        <p
          role="status"
          className="mt-3 border-t border-border pt-3 font-body text-xs text-text-muted"
        >
          <span className="font-semibold text-text">{formatWeekdayDate(selected.date)}</span>
          {' · '}
          {selected.played ? 'Played' : 'Skipped'}
          {selected.badgeIds.length > 0 && (
            <>
              {' · ★ '}
              {selected.badgeIds.map(badgeName).join(', ')}
            </>
          )}
        </p>
      )}
    </div>
  );
};

export default CalendarHeatmap;
