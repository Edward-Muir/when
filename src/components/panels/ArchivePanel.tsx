import React, { useMemo, useState } from 'react';
import { GameConfig, HistoricalEvent } from '../../types';
import { getCuratedThemeForDate, listCuratedThemes } from '../../utils/curatedThemes';
import { getDailyCadence } from '../../utils/statsStorage';
import { buildHeatmapWeeks, formatWeekdayDate, HeatCell } from '../../utils/statsDerived';
import { DAILY_REPLAY_FROM } from '../../utils/dailyReplay';
import CalendarHeatmap from '../stats/CalendarHeatmap';
import ArchiveDayCard from '../ArchiveDayCard';
import HintStrip from '../HintStrip';
import { tabHintText } from '../../utils/hintCopy';
import { useTabHint } from '../../hooks/useTabHint';

interface ArchivePanelProps {
  allEvents: HistoricalEvent[];
  /** The player's local date, from `useToday` — never read the clock in here. */
  today: string;
  /** Bumped after every calendar refetch so a theme fetched after boot gets its ring. */
  calendarVersion: number;
  onPlay: (config: GameConfig) => void;
  /** Whether this panel is the visible pager tab (see `TimelinePanel`). */
  active?: boolean;
}

/** Archive squares: big enough to aim at, with room between them for the curated ring. */
const CELL = 26;
const GAP = 7;

/**
 * Archive tab: every daily since `DAILY_REPLAY_FROM` as a GitHub-style calendar, the days
 * the player played filled in and the curated days ringed in gold. Tapping a day opens
 * `ArchiveDayCard`, which plays it: a missed day counts as that day's daily, a played one is
 * practice, and a curated day deals the theme reshuffled (see `utils/dailyReplay.ts`).
 *
 * Of the curated days still to come, exactly one — the next scheduled — is ringed, and named
 * under the grid, so the calendar is teased rather than laid bare. The grid draws no art, so
 * nothing downloads until a day is opened.
 */
const ArchivePanel: React.FC<ArchivePanelProps> = ({
  allEvents,
  today,
  calendarVersion,
  onPlay,
  active = true,
}) => {
  const hint = useTabHint('archiveTab', active);
  const [selected, setSelected] = useState<HeatCell | null>(null);

  const nextCurated = useMemo(() => {
    let next: { date: string; name: string } | undefined;
    for (const theme of listCuratedThemes()) {
      for (const date of theme.dates ?? []) {
        if (date > today && (!next || date < next.date)) next = { date, name: theme.name };
      }
    }
    return next;
    // calendarVersion is the "the calendar changed" signal; the list itself is module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, calendarVersion]);

  // Re-read every render, like the Stats tab: a game just finished writes here, and the
  // pager re-renders on return without any of this panel's props changing.
  const model = buildHeatmapWeeks({
    playedDates: getDailyCadence().playedDates,
    unlocked: {},
    today,
    from: DAILY_REPLAY_FROM,
    minWeeks: 1,
    isCurated: (date) =>
      date <= today ? !!getCuratedThemeForDate(date) : date === nextCurated?.date,
  });

  return (
    <div className="mx-auto w-full max-w-sm px-3">
      {/* Header — the Daily and Custom pages' heading, so the three play tabs read alike */}
      <div className="text-left mb-4">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Archive</h1>
        <p className="text-text-muted text-sm mt-1 font-body">
          Every past daily. Fill the gaps, beat your best
        </p>
        <HintStrip text={hint.show ? tabHintText('archiveTab') : null} onDismiss={hint.dismiss} />
      </div>

      <CalendarHeatmap
        model={model}
        cellSize={CELL}
        gap={GAP}
        onSelectDay={setSelected}
        todayOutline="outline-accent-secondary"
        label="Past daily challenges"
        legend={
          <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-[11px] text-text-muted">
            <span>Missed</span>
            <span aria-hidden className="heat-skipped h-2.5 w-2.5 rounded-[2px]" />
            <span className="ml-1.5">Played</span>
            <span aria-hidden className="heat-played h-2.5 w-2.5 rounded-[2px]" />
            <span className="ml-1.5">Curated</span>
            <span
              aria-hidden
              className="heat-skipped heat-curated ml-0.5 h-2.5 w-2.5 rounded-[2px]"
            />
          </div>
        }
      />

      {nextCurated && (
        <p className="mt-4 font-body text-xs text-text-muted">
          Next curated deck: <span className="font-semibold text-text">{nextCurated.name}</span>
          {' · '}
          {formatWeekdayDate(nextCurated.date)}
        </p>
      )}

      <ArchiveDayCard
        cell={selected}
        allEvents={allEvents}
        today={today}
        onPlay={(config) => {
          setSelected(null);
          onPlay(config);
        }}
        onDismiss={() => setSelected(null)}
      />
    </div>
  );
};

export default ArchivePanel;
