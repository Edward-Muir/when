import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GameConfig, HistoricalEvent, WhenGameState } from '../types';
import CustomPanel from './panels/CustomPanel';
import TopBar, { NavDest, navForPath, pathForNav } from './TopBar';
import ModePager, { ModePagerHandle } from './ModePager';
import HomeTabBar from './HomeTabBar';
import { TABS, TabKey, indexForTabKey, tabKeyForIndex } from './homeTabs';
import ArchivePanel from './panels/ArchivePanel';
import StatsPanel from './panels/StatsPanel';
import TimelinePanel from './panels/TimelinePanel';
import DailyPanel from './panels/DailyPanel';
import GamePopup from './GamePopup';
import DailyCta from './DailyCta';
import { loadCuratedThemes } from '../utils/curatedThemes';
import { buildDailyConfig } from '../utils/dailyConfig';
import { getTodayDailyBoard, restoreDailyBoard } from '../utils/dailyBoard';
import { canResumeDailyProgress, getTodayDailyProgress } from '../utils/dailyProgress';
import { getTodayResult, DailyResult } from '../utils/playerStorage';
import { shareDailyResult } from '../utils/share';

import { useDailyLeaderboard, DailyLeaderboard } from '../hooks/useDailyLeaderboard';
import { useToday } from '../hooks/useToday';
import { useCustomGameSettings } from '../hooks/useCustomGameSettings';
import { useDailyPreview } from '../hooks/useDailyPreview';

import Leaderboard from './Leaderboard';
import { useDailyTabHints } from '../hooks/useDailyTabHints';
import { useHomeNotice } from '../hooks/useHomeNotice';
import { useTabChangeHaptic } from '../hooks/useTabChangeHaptic';
import { Toast } from './Toast';

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
  /** Reopen today's finished daily board, already restored from storage by this component. */
  onReviewDaily: (restored: WhenGameState) => void;
  isLoading?: boolean;
  allEvents: HistoricalEvent[];
  /** The tab to open on: the one the URL names (`src/pages/Home.tsx`). */
  initialTab?: NavDest;
}

const LoadingState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-bg pt-safe pb-safe transition-colors"
  >
    <div className="bg-surface rounded-2xl border border-border p-6 max-w-sm w-full text-center">
      <h1 className="text-4xl font-bold text-text mb-1 font-display">When?</h1>
      <p className="text-text-muted text-sm mb-6 font-body">The Timeline Game</p>
      <div className="text-xl font-medium text-text mb-2 font-body">
        Loading historical events...
      </div>
      <div className="animate-pulse text-sm text-text-muted font-body">
        Gathering history from across time
      </div>
    </div>
  </motion.div>
);

const ALL_TAB_INDICES = TABS.map((_, i) => i);

// Pre-mount the remaining pager panels (Stats and Timeline) at idle rather than on first
// visit: mounting a panel mid-swipe mutates the DOM during scroll-snap momentum, which stalls
// the gesture on iOS. (Learned when the full badge grid was a tab — 59 cards + an image
// burst; it now mounts only on demand inside Stats, see `stats/AchievementsSection.tsx`.)
function useIdlePremount(setVisited: React.Dispatch<React.SetStateAction<Set<number>>>) {
  useEffect(() => {
    const mountAll = () => setVisited(new Set(ALL_TAB_INDICES));
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(mountAll, { timeout: 2000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(mountAll, 300);
    return () => window.clearTimeout(handle);
  }, [setVisited]);
}

/**
 * Today's score exists and the board came back without it — so it can still be claimed.
 *
 * Both halves matter. `submitted` is also false while the first fetch is in flight and after a
 * failed one, and treating either as "not on the board" would flash a submit button at players
 * who are already on it. The guard is `loadError` rather than `unavailable` because the latter
 * folds in `submitError` too, which would retract the offer the moment a submission failed —
 * precisely when the player needs it.
 */
function hasUnclaimedScore(result: DailyResult | null, board: DailyLeaderboard): boolean {
  if (!result || board.isLoading || board.loadError) return false;
  return !board.submitted;
}

const ModeSelect: React.FC<ModeSelectProps> = ({
  onStart,
  onReviewDaily,
  isLoading = false,
  allEvents,
  initialTab = 'home',
}) => {
  const navigate = useNavigate();
  // Check if daily has been played today. Deliberately re-read every render rather than memoized:
  // `updateDailyResultWithLeaderboard` writes the placing into this record after the board
  // resolves, and the share below reads `leaderboardRank` straight off it.
  const todayResult = getTodayResult();

  // Toast state for share button
  const [showShareToast, setShowShareToast] = useState(false);
  // "Saved", when the player has just left a Daily in progress.
  const homeNotice = useHomeNotice();

  // `activePage` is written only by the pager's onIndexChange (scroll position) — buttons
  // scroll via the ref, not by setting it, so the highlight tracks the scroll without flashing.
  const pagerRef = useRef<ModePagerHandle>(null);
  const [activePage, setActivePage] = useState(() => indexForTabKey(initialTab));
  // Daily, Archive and Custom mount immediately, plus whichever tab the page opened on;
  // Stats and Timeline otherwise wait for a visit or idle.
  const [visited, setVisited] = useState<Set<number>>(
    () => new Set((['home', 'archive', 'custom', initialTab] as TabKey[]).map(indexForTabKey))
  );
  useEffect(() => {
    setVisited((prev) => (prev.has(activePage) ? prev : new Set(prev).add(activePage)));
  }, [activePage]);
  useIdlePremount(setVisited);
  useTabChangeHaptic(activePage);
  // Keep the URL on the active tab, so a refresh or a shared link comes back to it. Replaced,
  // not pushed, so swiping never stacks history. Only while the URL is one of the tab paths:
  // the daily and challenge routes also mount this screen while they load, and must keep
  // their own path.
  useEffect(() => {
    const path = pathForNav(tabKeyForIndex(activePage));
    const current = window.location.pathname;
    if (navForPath(current) !== null && current !== path) navigate(path, { replace: true });
  }, [activePage, navigate]);

  // Leaderboard state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // The event whose long-form read is open from the Daily hero, or null. Held here rather than in
  // DailyDeckPreview so that card stays presentational.
  const [infoEvent, setInfoEvent] = useState<HistoricalEvent | null>(null);

  // Held in a ref because the two hooks below need each other: `useToday` refetches the board on
  // every resume, and the board hook needs `today` to know which board to read. `useToday` only
  // ever calls this from an event listener, long after the assignment below has run.
  const refreshBoardRef = useRef<(date?: string) => void>(() => {});

  // Source of truth for "today" (the player's local date). The hook handles rollover via
  // app resume, tab visibility and a re-arming local-midnight timer. Always refetch the
  // leaderboard on each trigger, even when the date hasn't rolled over — other players'
  // submissions need to land without a full reload.
  //
  // The theme calendar is refetched on the same triggers, and for the same reason a session
  // left open across midnight needs it: a client that booted yesterday holds yesterday's
  // calendar, so without this it would miss a theme scheduled for the day it just rolled into.
  //
  // The refetch mutates module state, which nothing re-renders on; `calendarVersion` is the
  // signal the Archive tab recomputes its rows on, so a theme fetched after boot appears.
  const [calendarVersion, setCalendarVersion] = useState(0);
  const today = useToday((date) => {
    refreshBoardRef.current(date);
    void loadCuratedThemes({ force: true }).then(() => setCalendarVersion((v) => v + 1));
  });

  // `todayResult` is what makes the score claimable here: the game-over popup is the only other
  // place to submit, and it is gone for good once dismissed, so a submission that failed there
  // could otherwise never be retried. `boardDate` keeps the board loading for players who have
  // not played today (no result, but still a board to read), and `poll: false` leaves polling to
  // the modal — the home screen would otherwise hold a 15s request loop open all day.
  const leaderboardState = useDailyLeaderboard(todayResult, { boardDate: today, poll: false });
  refreshBoardRef.current = leaderboardState.refresh;

  const {
    entries: leaderboard,
    isLoading: isLeaderboardLoading,
    loadError: leaderboardError,
    totalPlayers,
    rank,
    playerEntry,
    truncated: leaderboardTruncated,
  } = leaderboardState;

  const canSubmitScore = hasUnclaimedScore(todayResult, leaderboardState);

  const customSettings = useCustomGameSettings(allEvents);

  // Today's theme and whole deck: the Daily card shows the first card, the Resume check below
  // reads the rest.
  const { themeName: dailyThemeDisplayName, deck: dailyDeck } = useDailyPreview(
    today,
    allEvents,
    calendarVersion
  );
  const previewEvent = dailyDeck[0] ?? null;

  // Today's finished board, restored here rather than on the tap so the eye never renders as a
  // button that does nothing: `restoreDailyBoard` returns null when there is no board for today
  // or its cards have left the catalogue. `today` is the dep that clears it at rollover.
  const reviewBoard = useMemo(
    () => restoreDailyBoard(getTodayDailyBoard(today), allEvents),
    [allEvents, today]
  );

  // The Daily card's two one-shot strips (play your first game, and the eye), and which of
  // them has the slot. Both take the leaderboard's place while up, so the hero image keeps
  // its height.
  const dailyHints = useDailyTabHints({
    onDailyTab: activePage === indexForTabKey('home'),
    todayResult,
    board: reviewBoard,
    onReview: onReviewDaily,
  });

  const handleDailyStart = () => {
    onStart(buildDailyConfig());
  };

  const handleShareDaily = async () => {
    if (!todayResult) return;
    const showToast = await shareDailyResult(
      todayResult.date,
      todayResult.theme,
      todayResult.correctCount,
      {
        leaderboardRank: todayResult.leaderboardRank,
        // Today's seed card, already face-up on this screen, and the board the game ended
        // on, which the share draws as a shuffled collage (see `shareTiles`).
        seedEvent: previewEvent,
        timeline: reviewBoard?.timeline,
      }
    );
    if (showToast) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const handlePlayStart = () => onStart(customSettings.buildGameConfig());

  if (isLoading) {
    return <LoadingState />;
  }

  const dailyCta = (
    <DailyCta
      played={!!todayResult}
      inProgress={canResumeDailyProgress(getTodayDailyProgress(today), dailyDeck)}
      unclaimed={canSubmitScore}
      onShare={handleShareDaily}
      onPlay={handleDailyStart}
      onSubmit={() => setIsLeaderboardOpen(true)}
      canReview={!!reviewBoard}
      onReview={dailyHints.openReview}
      reviewNudge={dailyHints.reviewNudge}
      nudge={dailyHints.playNudge}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-dvh min-h-screen-safe bg-bg pt-topbar-wide overflow-hidden transition-colors"
    >
      {/* Top bar: Menu only. The five places are the tab bar at the foot. */}
      <TopBar showTitle={false} toastAboveTabBar />

      {/* Full-width track: Daily/Custom keep the narrow centered column (below); the
          Archive, Stats and Timeline panels use their own widths. The children are in `TABS`
          order (`homeTabs.ts`). */}
      <div className="flex flex-col flex-1 min-h-0">
        <ModePager
          ref={pagerRef}
          onIndexChange={setActivePage}
          initialIndex={indexForTabKey(initialTab)}
        >
          {/* Daily page */}
          <DailyPanel
            previewEvent={previewEvent}
            themeName={todayResult ? todayResult.theme : dailyThemeDisplayName}
            cta={dailyCta}
            hint={dailyHints.strip}
            leaderboard={leaderboard}
            isLeaderboardLoading={isLeaderboardLoading}
            playerEntry={playerEntry}
            playerRank={rank}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onReadMore={() => setInfoEvent(previewEvent)}
          />

          {/* Archive page: every daily from the last 30 days, each one playable */}
          <ArchivePanel
            allEvents={allEvents}
            today={today}
            calendarVersion={calendarVersion}
            onPlay={onStart}
            active={activePage === indexForTabKey('archive')}
          />

          {/* Custom page */}
          <CustomPanel
            active={activePage === indexForTabKey('custom')}
            {...customSettings.panelProps}
            onPlay={handlePlayStart}
          />

          {/* Stats page (lazy: mounted once first visited) */}
          {visited.has(indexForTabKey('stats')) ? (
            <StatsPanel active={activePage === indexForTabKey('stats')} />
          ) : (
            <div />
          )}

          {/* My Timeline page (lazy): the collection, laid out on the game's own timeline */}
          {visited.has(indexForTabKey('timeline')) ? (
            <TimelinePanel
              allEvents={allEvents}
              active={activePage === indexForTabKey('timeline')}
            />
          ) : (
            <div />
          )}
        </ModePager>
      </div>

      {/* The tabs scroll the same pager the swipe does; the highlight follows the scroll. */}
      <HomeTabBar
        activeKey={tabKeyForIndex(activePage)}
        onSelect={(key) => pagerRef.current?.scrollToPage(indexForTabKey(key))}
      />

      <Toast
        message={homeNotice.message}
        isVisible={homeNotice.visible}
        onClose={homeNotice.close}
        aboveTabBar
      />

      {/* Share toast */}
      {showShareToast && (
        <div className="fixed bottom-above-tabbar left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-sm flex items-center gap-2 z-50 font-body">
          <Check className="w-4 h-4" />
          Copied to clipboard!
        </div>
      )}

      {/* The Daily hero's read-more. Its event is the deck's starting card, placed face-up with
          its year on turn 1, so the detail card opens on the prose like any other placed card. */}
      <GamePopup
        type="description"
        event={infoEvent}
        onDismiss={() => setInfoEvent(null)}
        showYear
      />

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboard}
        totalPlayers={totalPlayers ?? 0}
        playerRank={rank}
        playerEntry={playerEntry}
        truncated={leaderboardTruncated}
        isLoading={isLeaderboardLoading}
        error={leaderboardError}
        submit={canSubmitScore ? leaderboardState : null}
        onRefresh={() => {
          leaderboardState.refresh(today);
        }}
      />
    </motion.div>
  );
};

export default ModeSelect;
