import React, { useLayoutEffect, useRef, useState } from 'react';
import { HeatCell, HeatmapModel, formatWeekdayDate } from '../../utils/statsDerived';

const WEEKDAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

interface Props {
  model: HeatmapModel;
  /** Badge name for an achievement id, for the tapped-day readout. */
  badgeName?: (id: string) => string;
  /** Square size and the space between squares, in px. The Stats grid's 12/3 by default. */
  cellSize?: number;
  gap?: number;
  /**
   * Hand a tapped day to the caller instead of reading it out beneath the grid. The Archive
   * opens its day card this way.
   */
  onSelectDay?: (cell: HeatCell) => void;
  /** The outline class for today's square. */
  todayOutline?: string;
  /** Replaces the Skipped / Played / badge legend. */
  legend?: React.ReactNode;
  /** The grid's accessible name. */
  label?: string;
}

/**
 * A GitHub-style year of days: one column per week, Monday at the top, played days in the
 * accent, a star on the days a badge was earned, curated days ringed in gold, today outlined.
 * Scrolls sideways and opens on the most recent weeks; older history is a swipe away.
 * `overscroll-x-contain` keeps that swipe from chaining into the home pager, whose track is
 * also a horizontal scroller.
 *
 * Two hosts: the Stats tab (12px squares, read-only) and the Archive tab (bigger squares,
 * each one a way into that day's daily, through `onSelectDay`).
 *
 * Without `onSelectDay`, tapping a day reads it out in a row beneath the grid rather than a
 * tooltip, so the value is reachable without hover and by keyboard (every cell is a button).
 * Each button's hit area extends exactly half the gap, no further: a bigger halo overlaps the
 * next cell and steals its taps, since later siblings paint on top. `min-h-0` opts the cells
 * out of the global 44px button minimum, which would otherwise stack the rows on top of each
 * other.
 *
 * The curated ring (`.heat-curated` in index.css) sits one pixel off the square, on the page
 * colour, so it still reads around a played square, which is filled with the same gold. It
 * reaches 3px out, so the Archive's gap is wide enough that two ringed days in adjacent weeks
 * never touch.
 */
/** The square's state in words. The Archive says "missed", since a missed day can be played. */
function playState(cell: HeatCell, playable: boolean): string {
  if (cell.played) return 'played';
  if (!playable) return 'skipped';
  return cell.isToday ? 'not played yet' : 'missed';
}

const CalendarHeatmap: React.FC<Props> = ({
  model,
  badgeName = (id) => id,
  cellSize = 12,
  gap = 3,
  onSelectDay,
  todayOutline = 'outline-accent',
  legend,
  label = 'Days played',
}) => {
  const { weeks, monthLabels } = model;
  const col = cellSize + gap;
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
    [formatWeekdayDate(cell.date), playState(cell, !!onSelectDay)]
      .concat(cell.curated ? ['curated'] : [])
      .concat(cell.badgeIds.length ? ['badge earned'] : [])
      .join(', ');

  const ringPad = weeks.some((week) => week.some((cell) => cell.curated)) ? 3 : 0;

  return (
    <div>
      <div className="flex gap-2">
        {/* Weekday letters, aligned with the grid rows (the spacer matches the month row). */}
        <div
          aria-hidden
          className="grid shrink-0 font-body text-[10px] leading-none text-text-muted"
          style={{ gridTemplateRows: `repeat(7, ${cellSize}px)`, gap, marginTop: 16 }}
        >
          {WEEKDAY_LABELS.map((weekday, row) => (
            <span key={row} className="flex items-center">
              {weekday}
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
          {/* Padded by the ring's reach, when there are rings, so the scroller clips none */}
          <div
            style={{
              width: weeks.length * col - gap + 2 * ringPad,
              paddingLeft: ringPad,
              paddingRight: ringPad,
            }}
          >
            <div className="relative h-4 font-body text-[10px] leading-none text-text-muted">
              {monthLabels.map((month) => (
                <span key={month.col} className="absolute top-0" style={{ left: month.col * col }}>
                  {month.label}
                </span>
              ))}
            </div>
            <div
              role="grid"
              aria-label={label}
              className="grid"
              style={{
                paddingBottom: ringPad,
                gridAutoFlow: 'column',
                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                gridAutoColumns: `${cellSize}px`,
                gap,
              }}
            >
              {weeks.flatMap((week) =>
                week.map((cell) =>
                  cell.isFuture || cell.beforeRange ? (
                    // A future curated day is the one teased deck: ringed, not tappable.
                    <span
                      key={cell.date}
                      aria-hidden
                      className={cell.curated ? 'heat-curated rounded-[2px]' : undefined}
                    />
                  ) : (
                    <button
                      key={cell.date}
                      type="button"
                      aria-label={cellLabel(cell)}
                      aria-pressed={onSelectDay ? undefined : selected?.date === cell.date}
                      onClick={() =>
                        onSelectDay
                          ? onSelectDay(cell)
                          : setSelected((prev) => (prev?.date === cell.date ? null : cell))
                      }
                      className={`relative min-h-0 rounded-[2px] ${
                        cell.played ? 'heat-played' : 'heat-skipped'
                      } ${cell.curated ? 'heat-curated' : ''} ${
                        cell.isToday ? `outline outline-2 outline-offset-1 ${todayOutline}` : ''
                      } ${selected?.date === cell.date ? 'ring-2 ring-accent-secondary' : ''}`}
                      style={{ width: cellSize, height: cellSize }}
                    >
                      {/* The hit area: half the gap on every side, no more (see above) */}
                      <span aria-hidden className="absolute" style={{ inset: -gap / 2 }} />
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

      {legend ?? (
        <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-[11px] text-text-muted">
          <span>Skipped</span>
          <span aria-hidden className="heat-skipped h-2.5 w-2.5 rounded-[2px]" />
          <span className="ml-1.5">Played</span>
          <span aria-hidden className="heat-played h-2.5 w-2.5 rounded-[2px]" />
          <span className="ml-1.5">★ badge earned</span>
        </div>
      )}

      {selected && !onSelectDay && (
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
