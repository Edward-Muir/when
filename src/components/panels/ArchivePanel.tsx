import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HistoricalEvent } from '../../types';
import { CuratedTheme, listCuratedThemes } from '../../utils/curatedThemes';
import {
  getArchiveEntries,
  getThemeSeedEvent,
  REPLAY_MIN_POOL,
  ArchiveEntry,
} from '../../utils/themeReplay';
import { getThemeBests } from '../../utils/themeBests';
import ArchiveDeckRow from '../ArchiveDeckRow';
import HintStrip from '../HintStrip';
import { tabHintText } from '../../utils/hintCopy';
import { useTabHint } from '../../hooks/useTabHint';

interface ArchivePanelProps {
  allEvents: HistoricalEvent[];
  /** The player's local date, from `useToday` — never read the clock in here. */
  today: string;
  /** Bumped after every calendar refetch so a theme fetched after boot shows up. */
  calendarVersion: number;
  onPlay: (theme: CuratedTheme) => void;
  /** Whether this panel is the visible pager tab (see `TimelinePanel`). */
  active?: boolean;
}

/**
 * Archive tab: every curated theme that has already run as the daily, laid out on the
 * game's own timeline by the date it ran, each carrying the player's best on that deck.
 * Tapping one starts a reshuffled replay (see `utils/themeReplay.ts`). Today's theme, if
 * there is one, follows as a locked card — replayable from tomorrow — and the next scheduled
 * deck closes the list as a locked teaser.
 *
 * The list opens scrolled to its newest deck, the one most players are here for, so the
 * "↑ Earlier" fade works the same way it does in a game.
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

  const entries = useMemo(
    () => getArchiveEntries(listCuratedThemes(), allEvents, today),
    // calendarVersion is the "the calendar changed" signal; the list itself is module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEvents, today, calendarVersion]
  );

  // Seed art per theme, keyed by id so a re-render on a new day or a bests change does not
  // rebuild every deck's opening window.
  const seedEvents = useMemo(() => {
    const byId = new Map<string, HistoricalEvent | null>();
    for (const { theme, releaseDate } of entries) {
      byId.set(theme.id, getThemeSeedEvent(allEvents, theme, releaseDate));
    }
    return byId;
  }, [entries, allEvents]);

  // Re-read every render, like `getTodayResult()` on the Daily tab: a game just finished
  // writes here, and the pager re-renders on return without any of this panel's deps changing.
  const bests = getThemeBests();

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header — the Daily and Custom pages' heading, so the three play tabs read alike */}
      <div className="mx-auto w-full max-w-sm px-3 text-left mb-3">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Archive</h1>
        <p className="text-text-muted text-sm mt-1 font-body">
          Replay past daily decks. Beat your best
        </p>
        <HintStrip text={hint.show ? tabHintText('archiveTab') : null} onDismiss={hint.dismiss} />
      </div>

      <div className="flex-1 overflow-hidden">
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-text-muted text-lg font-body mb-2">No past decks yet</p>
              <p className="text-text-muted text-sm font-body">
                A curated daily appears here the day after it runs — come back and beat your score.
              </p>
            </div>
          </div>
        ) : !hasBeenActive ? (
          <div className="h-full" />
        ) : (
          <ArchiveTimeline entries={entries} allEventsReady={allEvents.length > 0}>
            {entries.map((entry) => {
              const best = Object.prototype.hasOwnProperty.call(bests, entry.theme.id)
                ? // eslint-disable-next-line security/detect-object-injection -- guarded above
                  bests[entry.theme.id]
                : undefined;
              return (
                <ArchiveDeckRow
                  key={entry.theme.id}
                  entry={entry}
                  seedEvent={seedEvents.get(entry.theme.id) ?? null}
                  best={best}
                  playable={entry.status === 'replayable' && entry.cardCount >= REPLAY_MIN_POOL}
                  onPlay={() => onPlay(entry.theme)}
                />
              );
            })}
          </ArchiveTimeline>
        )}
      </div>
    </div>
  );
};

/**
 * The timeline shell: spine, "Earlier"/"Later" fades and a native scroll container, as in
 * `Timeline/Timeline.tsx` but with no drop zone, ghost or tombstones — the rows here are
 * decks, not events, which is why `Timeline` itself is not reused.
 */
const ArchiveTimeline: React.FC<{
  entries: ArchiveEntry[];
  allEventsReady: boolean;
  children: React.ReactNode;
}> = ({ entries, allEventsReady, children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledToEndRef = useRef(false);

  // Open at the newest deck, once per mount. Rows are fixed-height, so scrollHeight is
  // stable as images lazy-load and the position holds.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || hasScrolledToEndRef.current || entries.length === 0 || !allEventsReady) {
      return;
    }
    container.scrollTop = container.scrollHeight;
    hasScrolledToEndRef.current = true;
  }, [entries.length, allEventsReady]);

  return (
    <div className="h-full relative">
      {/* Fixed "Earlier" indicator at top with fade */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-b from-bg to-transparent" />
        <div className="absolute top-2 left-0 right-0 text-center text-text-muted text-sm font-medium font-body">
          ↑ Earlier
        </div>
      </div>

      {/* Vertical timeline line - positioned at 96px (matches date column width) */}
      <div className="absolute left-24 top-0 bottom-0 w-1 bg-accent rounded-full z-0" />

      <div
        ref={scrollRef}
        className="h-full relative z-10 overflow-y-auto timeline-scroll-vertical"
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
