import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Share2, Check } from 'lucide-react';
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
import TopBar from './TopBar';
import ModePager from './ModePager';
import DailyDeckPreview from './DailyDeckPreview';
import TodaysLongest from './TodaysLongest';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { buildDailyConfig, getDailyPreviewEvent } from '../utils/dailyConfig';
import {
  getTodayResult,
  updateDailyResultWithLeaderboard,
  getCustomSettings,
  saveCustomSettings,
} from '../utils/playerStorage';
import { shareDailyResult } from '../utils/share';
import { encodeChallengeCode, generateChallengeSeed } from '../utils/challengeCode';

import { useLeaderboard } from '../hooks/useLeaderboard';

import Leaderboard from './Leaderboard';

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
  isLoading?: boolean;
  allEvents: HistoricalEvent[];
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

// Helper function to get default hand size based on player count
const getDefaultHandSize = (count: number): number => {
  switch (count) {
    case 1:
      return 7;
    case 2:
      return 6;
    case 3:
      return 5;
    case 4:
      return 4;
    case 5:
    case 6:
      return 3;
    default:
      return 5;
  }
};

const ModeSelect: React.FC<ModeSelectProps> = ({ onStart, isLoading = false, allEvents }) => {
  // Check if daily has been played today
  const todayResult = getTodayResult();

  // Toast state for share button
  const [showShareToast, setShowShareToast] = useState(false);

  // Leaderboard state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const {
    isLoading: isLeaderboardLoading,
    loadError: leaderboardError,
    leaderboard,
    totalPlayers,
    rank,
    playerEntry,
    fetchLeaderboard,
  } = useLeaderboard();

  // Source of truth for "today" (UTC date string). Refreshed on app resume, tab
  // visibility change, and at UTC midnight so the Daily tab rolls over to the new day
  // without a manual reload — important for the iOS Capacitor app, whose WKWebView keeps
  // its React state alive across background/foreground.
  const [today, setToday] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const refresh = () => {
      const next = new Date().toISOString().split('T')[0];
      setToday((curr) => (curr === next ? curr : next));
      // Always refetch the leaderboard on resume/visibility, even when the date hasn't
      // rolled over — other players' submissions need to land without a full reload.
      fetchLeaderboard(next);
    };
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    // `appResume` is dispatched by App.tsx via @capacitor/app's native `resume` event.
    window.addEventListener('appResume', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    // Fire once at the next UTC midnight even if the app stays foregrounded across it.
    const msUntilMidnight = 86_400_000 - (Date.now() % 86_400_000) + 1_000;
    const t = window.setTimeout(refresh, msUntilMidnight);
    return () => {
      window.removeEventListener('appResume', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(t);
    };
  }, [fetchLeaderboard]);

  // Prefetch leaderboard data in background; refetch when the day rolls over.
  useEffect(() => {
    fetchLeaderboard(today);
  }, [fetchLeaderboard, today]);

  // Sync leaderboard data to localStorage when fetched (for returning users)
  useEffect(() => {
    if (rank && totalPlayers && todayResult) {
      updateDailyResultWithLeaderboard(rank, totalPlayers);
    }
  }, [rank, totalPlayers, todayResult]);

  // Restore the player's last Custom-game configuration (read localStorage once on mount).
  // The deck seed is NOT restored — it stays random per play, so a refresh keeps the settings
  // but still yields a different game.
  const [savedSettings] = useState(() => getCustomSettings());

  // Play mode settings. The Marathon/Casual, players and hand-size controls are hidden for
  // now (Marathon is the default), but their setters are still wired so the Share Game
  // Settings code input can apply a decoded code to all settings.
  const [isSuddenDeath, setIsSuddenDeath] = useState(savedSettings?.isSuddenDeath ?? true);
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
      isSuddenDeath,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      playerCount,
      cardsPerHand,
      suddenDeathHandSize,
    });
  }, [
    isSuddenDeath,
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
    const effectiveHandSize = isSuddenDeath ? suddenDeathHandSize : cardsPerHand;
    const minRequired = playerCount * effectiveHandSize + 1 + playerCount * 2;
    return count >= minRequired;
  }, [
    allEvents,
    selectedDifficulties,
    selectedCategories,
    selectedEras,
    playerCount,
    cardsPerHand,
    isSuddenDeath,
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

  const handleShareDaily = async () => {
    if (!todayResult) return;
    const showToast = await shareDailyResult(
      todayResult.date,
      todayResult.theme,
      todayResult.emojiGrid,
      todayResult.correctCount,
      todayResult.leaderboardRank,
      todayResult.leaderboardTotalPlayers
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
    const effectiveHandSize = isSuddenDeath ? suddenDeathHandSize : cardsPerHand;
    const challengeCode = encodeChallengeCode({
      mode: isSuddenDeath ? 'suddenDeath' : 'freeplay',
      handSize: effectiveHandSize,
      playerCount,
      difficulties: selectedDifficulties,
      categories: selectedCategories,
      eras: selectedEras,
      seed: generateChallengeSeed(),
    });

    onStart({
      mode: isSuddenDeath ? 'suddenDeath' : 'freeplay',
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

  // Daily CTA: play when unplayed, share when already completed today.
  const dailyCta = todayResult ? (
    <button
      onClick={handleShareDaily}
      className="w-full py-3.5 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body"
    >
      <Share2 className="w-4 h-4" />
      Challenge a Friend
    </button>
  ) : (
    <button
      onClick={handleDailyStart}
      className="w-full py-3.5 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body"
    >
      <Play className="w-4 h-4" />
      Play Daily Challenge
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-dvh min-h-screen-safe bg-bg pt-topbar-wide pb-safe overflow-hidden transition-colors"
    >
      {/* Top Bar */}
      <TopBar showHome={false} showTitle={false} showStatsAchievements />

      <div className="w-full max-w-sm mx-auto flex flex-col flex-1 min-h-0 px-3">
        <ModePager
          labels={['Daily', 'Custom']}
          hintKey="when:modeSwipeHintSeen"
          activeColors={[
            { dot: 'bg-accent', text: 'text-accent' },
            { dot: 'bg-accent-secondary', text: 'text-accent-secondary' },
          ]}
        >
          {/* Daily page */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="text-left mb-3">
              <h1 className="text-5xl font-bold text-text font-display leading-none">
                When<span className="text-accent">?</span>
              </h1>
              <p className="text-text-muted text-sm mt-1 font-body">
                Place events to make the longest timeline
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

          {/* Custom page */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="text-left mb-3">
              <h1 className="text-5xl font-bold text-text font-display leading-none">Custom</h1>
              <p className="text-text-muted text-sm mt-1 font-body">
                Choose your eras, categories & difficulty
              </p>
            </div>

            <CustomGameSettings
              isSuddenDeath={isSuddenDeath}
              setIsSuddenDeath={setIsSuddenDeath}
              selectedDifficulties={selectedDifficulties}
              setSelectedDifficulties={setSelectedDifficulties}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedEras={selectedEras}
              setSelectedEras={setSelectedEras}
              playerCount={playerCount}
              onPlayerCountChange={handlePlayerCountChange}
              cardsPerHand={cardsPerHand}
              setCardsPerHand={setCardsPerHand}
              suddenDeathHandSize={suddenDeathHandSize}
              setSuddenDeathHandSize={setSuddenDeathHandSize}
              onPlay={handlePlayStart}
              deckCount={deckCount}
              isPlayValid={isPlayValid}
            />
          </div>
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
        isLoading={isLeaderboardLoading}
        error={leaderboardError}
        onRefresh={() => {
          void fetchLeaderboard(today);
        }}
      />
    </motion.div>
  );
};

export default ModeSelect;
