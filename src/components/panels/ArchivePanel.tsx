import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameConfig, HistoricalEvent } from '../../types';
import { getThemeSeedEvent } from '../../utils/themeReplay';
import {
  ArchiveDay,
  ARCHIVE_DAYS,
  buildDayReplayConfig,
  dayBest,
  getArchiveDays,
} from '../../utils/dailyReplay';
import { buildDailyConfig, getDailyPreviewEvent } from '../../utils/dailyConfig';
import { getDailyCadence } from '../../utils/statsStorage';
import { getGameHistory } from '../../utils/gameHistory';
import { getThemeBests } from '../../utils/themeBests';
import ArchiveDeckRow from '../ArchiveDeckRow';
import HintStrip from '../HintStrip';
import { tabHintText } from '../../utils/hintCopy';
import { useTabHint } from '../../hooks/useTabHint';

interface ArchivePanelProps {
  allEvents: HistoricalEvent[];
  /** The player's local date, from `useToday` — never read the clock in here. */
  today: string;
  /** Bumped after every calendar refetch so a theme fetched after boot gets its border. */
  calendarVersion: number;
  onPlay: (config: GameConfig) => void;
  /** Whether this panel is the visible pager tab (see `TimelinePanel`). */
  active?: boolean;
}

/**
 * Archive tab: every daily from the last `ARCHIVE_DAYS` days, laid out on the game's own
 * timeline by date, curated days in a gold border. Tapping a past day plays it (see
 * `utils/dailyReplay.ts`): a missed day counts as that day's daily, a played one is
 * practice, and a curated day deals its theme reshuffled. Today's row plays the ordinary
 * daily until it is played, then locks until tomorrow; the next scheduled curated deck
 * closes the list as a locked teaser.
 *
 * The list opens scrolled to today, the row most players are here for, so the "↑ Earlier"
 * fade works the same way it does in a game.
 */
const ArchivePanel: React.FC<ArchivePanelProps> = ({
  allEvents,
  today,
  calendarVersion,
  onPlay,
  active = true,
}) => {
  // Hold the rows back until the tab has been shown at least once. Archive sits one panel
  // from the Daily tab, inside Chrome's distance-based lazy-load threshold, so its thumbnails
  // would otherwise start downloading on the home screen. Latched so swiping away doesn't
  // unmount and refetch on return.
  const [hasBeenActive, setHasBeenActive] = useState(active);
  useEffect(() => {
    if (active) setHasBeenActive(true);
  }, [active]);

  const hint = useTabHint('archiveTab', active);

  // Re-read every render, like `getTodayResult()` on the Daily tab: a game just finished
  // writes here, and the pager re-renders on return without any of this panel's deps changing.
  const playedDates = getDailyCadence().playedDates;
  const history = getGameHistory();
  const bests = getThemeBests();
  const days = getArchiveDays(allEvents, today, playedDates);

  const seedEvents = useDaySeedEvents(hasBeenActive, allEvents, today, calendarVersion);

  const playFor = (day: ArchiveDay): (() => void) | undefined => {
    if (day.status === 'replayable') {
      return () => onPlay(buildDayReplayConfig(day.date, allEvents));
    }
    if (day.status === 'today' && !day.played) return () => onPlay(buildDailyConfig());
    return undefined;
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header — the Daily and Custom pages' heading, so the three play tabs read alike */}
      <div className="mx-auto w-full max-w-sm px-3 text-left mb-3">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Archive</h1>
        <p className="text-text-muted text-sm mt-1 font-body">
          The last {ARCHIVE_DAYS} days. Fill the gaps, beat your best
        </p>
        <HintStrip text={hint.show ? tabHintText('archiveTab') : null} onDismiss={hint.dismiss} />
      </div>

      <div className="flex-1 overflow-hidden">
        {!hasBeenActive ? (
          <div className="h-full" />
        ) : (
          <ArchiveTimeline days={days} allEventsReady={allEvents.length > 0}>
            {days.map((day) => (
              <ArchiveDeckRow
                key={day.date}
                day={day}
                seedEvent={seedEvents.get(day.date) ?? null}
                themeBest={
                  day.curated && Object.prototype.hasOwnProperty.call(bests, day.curated.id)
                    ? // eslint-disable-next-line security/detect-object-injection -- guarded above
                      bests[day.curated.id]
                    : undefined
                }
                best={day.curated ? undefined : dayBest(history, day.date)}
                onPlay={playFor(day)}
              />
            ))}
          </ArchiveTimeline>
        )}
      </div>
    </div>
  );
};

/**
 * The card that opened each listed day, keyed by date, filled in one day per task.
 *
 * Each past day's opening card means walking its seven-day recency chain, 28-56 deck builds,
 * and the chain cache memoises only each walk's end, so thirty days cost ~700ms of main
 * thread in one go (measured in Chromium on a laptop-class CPU; a phone is slower). One day
 * per macrotask keeps every task to a few tens of milliseconds, so the tab stays responsive
 * while the art arrives. Newest first: the list opens on today. Nothing starts until the tab
 * has been shown, and a new day or catalogue starts over.
 *
 * The teaser has no dealt deck yet, so it shows its theme's seeded opening card as before.
 */
function useDaySeedEvents(
  enabled: boolean,
  allEvents: HistoricalEvent[],
  today: string,
  calendarVersion: number
): Map<string, HistoricalEvent | null> {
  const [byDate, setByDate] = useState(() => new Map<string, HistoricalEvent | null>());
  useEffect(() => {
    setByDate(new Map());
    if (!enabled || allEvents.length === 0) return;
    const queue = getArchiveDays(allEvents, today, []).reverse();
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const day = queue.shift();
      if (!day) return;
      const event =
        day.status === 'upcoming' && day.curated
          ? getThemeSeedEvent(allEvents, day.curated, day.date)
          : getDailyPreviewEvent(allEvents, day.date);
      setByDate((prev) => new Map(prev).set(day.date, event));
      timer = setTimeout(next);
    };
    timer = setTimeout(next);
    return () => clearTimeout(timer);
    // calendarVersion is the "the calendar changed" signal; the list itself is module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, allEvents, today, calendarVersion]);
  return byDate;
}

/**
 * The timeline shell: spine, "Earlier"/"Later" fades and a native scroll container, as in
 * `Timeline/Timeline.tsx` but with no drop zone, ghost or tombstones — the rows here are
 * days, not events, which is why `Timeline` itself is not reused.
 */
const ArchiveTimeline: React.FC<{
  days: ArchiveDay[];
  allEventsReady: boolean;
  children: React.ReactNode;
}> = ({ days, allEventsReady, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledToEndRef = useRef(false);

  // Open at today, once per mount. Rows are fixed-height, so scrollHeight is
  // stable as images lazy-load and the position holds.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || hasScrolledToEndRef.current || days.length === 0 || !allEventsReady) {
      return;
    }
    container.scrollTop = container.scrollHeight;
    hasScrolledToEndRef.current = true;
  }, [days.length, allEventsReady]);

  return (
    <div className="h-full relative">
      {/* Fixed "Earlier" indicator at top with fade */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-b from-bg to-transparent" />
        <div className="absolute top-2 left-0 right-0 text-center text-text-muted text-sm font-medium font-body">
          ↑ Earlier
        </div>
      </div>

      {/* Vertical timeline line — `board-rail`, exactly as in Timeline.tsx */}
      <div className="board-rail absolute top-0 bottom-0 w-1 bg-accent rounded-full z-0" />

      <div
        ref={scrollRef}
        className="board-center h-full relative z-10 overflow-y-auto timeline-scroll-vertical"
      >
        <div className="relative flex flex-col items-start w-full pt-12 pb-16">{children}</div>
      </div>

      {/* Fixed "Later" indicator at bottom with fade */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-t from-bg to-transparent" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-text-muted text-sm font-medium font-body">
          Later ↓
        </div>
      </div>
    </div>
  );
};

export default ArchivePanel;
