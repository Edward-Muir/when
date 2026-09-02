import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Share2, Check, Trophy } from 'lucide-react';
import {
  GameConfig,
  Difficulty,
  Category,
  Era,
  HistoricalEvent,
  ALL_CATEGORIES,
  DEFAULT_DIFFICULTIES,
} from '../types';
import { ALL_ERAS } from '../utils/eras';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import CustomGameSettings from './CustomGameSettings';
import TopBar, { NavDest, navForPath, pathForNav } from './TopBar';
import ModePager, { ModePagerHandle } from './ModePager';
import ArchivePanel from './panels/ArchivePanel';
import StatsPanel from './panels/StatsPanel';
import TimelinePanel from './panels/TimelinePanel';
import DailyDeckPreview from './DailyDeckPreview';
import NextDailyCountdown from './NextDailyCountdown';
import TodaysLongest from './TodaysLongest';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { CuratedTheme, loadCuratedThemes } from '../utils/curatedThemes';
import { buildThemeReplayConfig } from '../utils/themeReplay';
import { buildDailyConfig, getDailyPreviewEvent } from '../utils/dailyConfig';
import {
  getTodayResult,
  DailyResult,
  getCustomSettings,
  saveCustomSettings,
} from '../utils/playerStorage';
import { shareDailyResult } from '../utils/share';
import { encodeChallengeCode, generateChallengeSeed } from '../utils/challengeCode';

import { useDailyLeaderboard, DailyLeaderboard } from '../hooks/useDailyLeaderboard';
import { useToday } from '../hooks/useToday';

import Leaderboard from './Leaderboard';

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
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

// Unified pager tabs, in render order — the single source of the page order. The TopBar nav
// buttons and the swipe pager both address pages by key; the ModePager children below must
// be rendered in this same order. Indicator accent per tab: Custom is blue
// (accent-secondary), the rest gold.
type TabKey = NavDest;
const GOLD = { dot: 'bg-accent', text: 'text-accent' };
const TABS: { key: TabKey; label: string; color: { dot: string; text: string } }[] = [
  { key: 'home', label: 'Daily', color: GOLD },
  { key: 'archive', label: 'Archive', color: GOLD },
  {
    key: 'custom',
    label: 'Custom',
    color: { dot: 'bg-accent-secondary', text: 'text-accent-secondary' },
  },
  { key: 'stats', label: 'Stats', color: GOLD },
  { key: 'timeline', label: 'Timeline', color: GOLD },
];
const tabKeyForIndex = (i: number): TabKey => TABS.at(i)?.key ?? 'home';
const indexForTabKey = (key: TabKey): number =>
  Math.max(
    0,
    TABS.findIndex((tab) => tab.key === key)
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

// Daily CTA: play when unplayed, share + next-daily countdown when already completed today —
// or, when today's score is not on the board, the way to put it there.
const DailyCta: React.FC<{
  played: boolean;
  /** Today's score exists and is not on the board (see `canSubmitScore` in ModeSelect). */
  unclaimed: boolean;
  onShare: () => void;
  onPlay: () => void;
  onSubmit: () => void;
}> = ({ played, unclaimed, onShare, onPlay, onSubmit }) => {
  const buttonClass =
    'w-full py-3.5 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body';

  if (played) {
    return (
      <div className="w-full flex flex-col items-center gap-2">
        {/* An unclaimed score takes the share slot for as long as it is unclaimed. Sharing a
            score is the lesser thing to offer someone whose score did not make the board, and
            this is the only route back to submitting once the game-over popup is gone. */}
        {unclaimed ? (
          <button onClick={onSubmit} className={buttonClass}>
            <Trophy className="w-4 h-4" />
            Submit Your Score
          </button>
        ) : (
          <button onClick={onShare} className={buttonClass}>
            <Share2 className="w-4 h-4" />
            Challenge a Friend
          </button>
        )}
        <NextDailyCountdown />
      </div>
    );
  }

  return (
    <button onClick={onPlay} className={buttonClass}>
      <Play className="w-4 h-4" />
      Play Daily Challenge
    </button>
  );
};

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

// Default hand size by player count (1–6 players); anything else falls back to 5.
const DEFAULT_HAND_SIZES = [7, 6, 5, 4, 3, 3];
const getDefaultHandSize = (count: number): number =>
  (count >= 1 ? DEFAULT_HAND_SIZES.at(count - 1) : undefined) ?? 5;

const ModeSelect: React.FC<ModeSelectProps> = ({
  onStart,
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
  // signal the Archive tab recomputes its list on, so a theme fetched after boot appears.
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

  // Restore the player's last Custom-game configuration (read localStorage once on mount).
  // The deck seed is NOT restored — it stays random per play, so a refresh keeps the settings
  // but still yields a different game.
  const [savedSettings] = useState(() => getCustomSettings());

  // Play settings. The players and hand-size controls are hidden for now, but their setters
  // are still wired so the Share Game Settings code input can apply a decoded code to all
  // settings.
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(
    savedSettings?.selectedDifficulties ?? [...DEFAULT_DIFFICULTIES]
  );
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(() => {
    // Drop any stale categories from a previous taxonomy in saved settings; if nothing
    // valid remains (e.g. an old install), fall back to all categories.
    const restored = savedSettings?.selectedCategories?.filter((c) => ALL_CATEGORIES.includes(c));
    return restored && restored.length > 0 ? restored : [...ALL_CATEGORIES];
  });
  const [selectedEras, setSelectedEras] = useState<Era[]>(
    savedSettings?.selectedEras ?? [...ALL_ERAS]
  );

  // Player settings (the players UI is hidden; `playerNames` is unused until it returns)
  const [playerCount, setPlayerCount] = useState(savedSettings?.playerCount ?? 1);
  const [playerNames] = useState<string[]>(['', '', '', '', '', '']);

  // Hand size setting (3-8 cards) - default varies by player count
  const [cardsPerHand, setCardsPerHand] = useState(savedSettings?.cardsPerHand ?? 7);

  // Sudden death hand size (1-7 cards, acts as "lives")
  const [suddenDeathHandSize, setSuddenDeathHandSize] = useState(
    savedSettings?.suddenDeathHandSize ?? 5
  );

  // Persist Custom-game settings on every change so they survive a refresh.
  useEffect(() => {
    saveCustomSettings({
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      playerCount,
      cardsPerHand,
      suddenDeathHandSize,
    });
  }, [
    selectedDifficulties,
    selectedCategories,
    selectedEras,
    playerCount,
    cardsPerHand,
    suddenDeathHandSize,
  ]);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setCardsPerHand(getDefaultHandSize(count));
  };

  // Check if settings are valid
  const isPlayValid = useMemo(() => {
    if (
      selectedDifficulties.length === 0 ||
      selectedCategories.length === 0 ||
      selectedEras.length === 0
    ) {
      return false;
    }
    const count = filterByEra(
      filterByCategory(filterByDifficulty(allEvents, selectedDifficulties), selectedCategories),
      selectedEras
    ).length;
    // Need: (players * cards per hand) + 1 starting + (players * 2 for replacements)
    const minRequired = playerCount * suddenDeathHandSize + 1 + playerCount * 2;
    return count >= minRequired;
  }, [
    allEvents,
    selectedDifficulties,
    selectedCategories,
    selectedEras,
    playerCount,
    suddenDeathHandSize,
  ]);

  // Total cards matching the current selection — shown on the Custom page.
  const deckCount = useMemo(
    () =>
      filterByEra(
        filterByCategory(filterByDifficulty(allEvents, selectedDifficulties), selectedCategories),
        selectedEras
      ).length,
    [allEvents, selectedDifficulties, selectedCategories, selectedEras]
  );

  // Daily theme + preview - keyed on `today` so they recompute when the day rolls over.
  const dailyTheme = useMemo(() => getDailyTheme(today), [today]);
  const dailyThemeDisplayName = getThemeDisplayName(dailyTheme);
  const previewEvent = useMemo(() => getDailyPreviewEvent(allEvents, today), [allEvents, today]);

  const handleDailyStart = () => {
    onStart(buildDailyConfig());
  };

  const handleArchivePlay = (theme: CuratedTheme) => {
    onStart(buildThemeReplayConfig(theme));
  };

  const handleShareDaily = async () => {
    if (!todayResult) return;
    const showToast = await shareDailyResult(
      todayResult.date,
      todayResult.theme,
      todayResult.correctCount,
      {
        leaderboardRank: todayResult.leaderboardRank,
        // Today's seed card — already face-up on this screen, so no spoiler.
        seedEvent: previewEvent,
      }
    );
    if (showToast) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const handlePlayStart = () => {
    const names = playerNames
      .slice(0, playerCount)
      .map((name, i) => name.trim() || `Player ${i + 1}`);

    // Generate a shareable challenge code encoding settings + random seed
    const challengeCode = encodeChallengeCode({
      handSize: suddenDeathHandSize,
      playerCount,
      difficulties: selectedDifficulties,
      categories: selectedCategories,
      eras: selectedEras,
      seed: generateChallengeSeed(),
    });

    onStart({
      mode: 'suddenDeath',
      totalTurns: cardsPerHand,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      challengeSeed: challengeCode,
      challengeCode,
      playerCount,
      playerNames: names,
      cardsPerHand,
      suddenDeathHandSize,
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const dailyCta = (
    <DailyCta
      played={!!todayResult}
      unclaimed={canSubmitScore}
      onShare={handleShareDaily}
      onPlay={handleDailyStart}
      onSubmit={() => setIsLeaderboardOpen(true)}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-dvh min-h-screen-safe bg-bg pt-topbar-wide pb-safe overflow-hidden transition-colors"
    >
      {/* Top Bar — nav buttons drive the same pager as swipe (onNavClick), keeping the
          two navigation methods unified. */}
      <TopBar
        showHome
        showTitle={false}
        showStatsAchievements
        activeNav={tabKeyForIndex(activePage)}
        onHomeClick={() => navigate('/')}
        onNavClick={(key) => pagerRef.current?.scrollToPage(indexForTabKey(key))}
      />

      {/* Full-width track: Daily/Custom keep the narrow centered column (below); the
          Archive, Stats and Timeline panels use their own widths. */}
      <div className="flex flex-col flex-1 min-h-0">
        <ModePager
          ref={pagerRef}
          labels={TABS.map((tab) => tab.label)}
          hintKey="when:modeSwipeHintSeen"
          onIndexChange={setActivePage}
          initialIndex={indexForTabKey(initialTab)}
          activeColors={TABS.map((tab) => tab.color)}
        >
          {/* Daily page */}
          <div className="mx-auto flex w-full max-w-sm flex-col flex-1 min-h-0 px-3">
            <div className="text-left mb-3">
              <h1 className="text-5xl font-bold text-text font-display leading-none">
                When<span className="text-accent">?</span>
              </h1>
              <p className="text-text-muted text-sm mt-1 font-body">
                Drag events into place, build the longest timeline
              </p>
            </div>

            <DailyDeckPreview
              event={previewEvent}
              themeName={todayResult ? todayResult.theme : dailyThemeDisplayName}
              cta={dailyCta}
              className="flex-1 min-h-0"
            />

            <div className="mt-3 flex-shrink-0">
              <TodaysLongest
                entries={leaderboard}
                isLoading={isLeaderboardLoading}
                playerEntry={playerEntry}
                playerRank={rank}
                onOpenFull={() => setIsLeaderboardOpen(true)}
              />
            </div>
          </div>

          {/* Archive page: past curated decks, replayable from the day after they ran */}
          <ArchivePanel
            allEvents={allEvents}
            today={today}
            calendarVersion={calendarVersion}
            onPlay={handleArchivePlay}
            active={activePage === indexForTabKey('archive')}
          />

          {/* Custom page */}
          <div className="mx-auto flex w-full max-w-sm flex-col flex-1 min-h-0 px-3">
            <div className="text-left mb-3">
              <h1 className="text-5xl font-bold text-text font-display leading-none">Custom</h1>
              <p className="text-text-muted text-sm mt-1 font-body">
                Choose your eras, categories & difficulty
              </p>
            </div>

            <CustomGameSettings
              selectedDifficulties={selectedDifficulties}
              setSelectedDifficulties={setSelectedDifficulties}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedEras={selectedEras}
              setSelectedEras={setSelectedEras}
              playerCount={playerCount}
              onPlayerCountChange={handlePlayerCountChange}
              suddenDeathHandSize={suddenDeathHandSize}
              setSuddenDeathHandSize={setSuddenDeathHandSize}
              onPlay={handlePlayStart}
              deckCount={deckCount}
              isPlayValid={isPlayValid}
            />
          </div>

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

      {/* Share toast */}
      {showShareToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 z-50 font-body">
          <Check className="w-4 h-4" />
          Copied to clipboard!
        </div>
      )}

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
