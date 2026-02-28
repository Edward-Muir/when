import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Play, Share2, Check, Trophy } from 'lucide-react';
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
import SettingsPopup from './SettingsPopup';
import TopBar from './TopBar';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { buildDailyConfig } from '../utils/dailyConfig';
import { getTodayResult, updateDailyResultWithLeaderboard } from '../utils/playerStorage';
import { shareDailyResult } from '../utils/share';

import { useLeaderboard, LeaderboardEntry } from '../hooks/useLeaderboard';

import Leaderboard from './Leaderboard';

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
  onViewTimeline?: () => void;
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

// Inline mini-leaderboard showing top 3 entries, tappable to open full leaderboard
const MiniLeaderboard: React.FC<{
  entries: LeaderboardEntry[];
  isLoading: boolean;
  onOpenFull: () => void;
}> = ({ entries, isLoading, onOpenFull }) => {
  const top4 = entries.slice(0, 4);

  return (
    <button
      onClick={onOpenFull}
      className="mt-4 w-full text-left cursor-pointer rounded-lg hover:bg-bg/50 p-2 pt-3 transition-colors border-t border-border h-[156px] relative overflow-hidden"
    >
      <div className="flex items-center gap-1.5 text-sm text-text-muted font-medium font-body mb-2">
        <Trophy className="w-3.5 h-3.5" />
        <span>Longest Timelines</span>
      </div>
      {isLoading ? (
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <div className="w-5 h-4 bg-border/50 rounded animate-pulse" />
              <div
                className="flex-1 h-4 bg-border/50 rounded animate-pulse"
                style={{ width: `${65 - i * 10}%` }}
              />
              <div className="w-6 h-4 bg-border/50 rounded animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : top4.length === 0 ? (
        <div className="text-sm text-text-muted font-body text-center mt-4">
          No entries yet. Be the first!
        </div>
      ) : (
        <div className="space-y-1">
          {top4.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm py-0.5">
              <span className="w-5 text-center flex-shrink-0 text-text-muted font-body">
                {entry.rank}
              </span>
              <span className="flex-1 text-left truncate text-text font-body">
                {entry.displayName}
              </span>
              <span className="font-body text-accent font-semibold flex-shrink-0">
                {entry.correctCount}
              </span>
            </div>
          ))}
        </div>
      )}
      {entries.length > 4 && (
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
      )}
    </button>
  );
};

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

const ModeSelect: React.FC<ModeSelectProps> = ({
  onStart,
  onViewTimeline,
  isLoading = false,
  allEvents,
}) => {
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

  // Prefetch leaderboard data in background on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchLeaderboard(today);
  }, [fetchLeaderboard]);

  // Sync leaderboard data to localStorage when fetched (for returning users)
  useEffect(() => {
    if (rank && totalPlayers && todayResult) {
      updateDailyResultWithLeaderboard(rank, totalPlayers);
    }
  }, [rank, totalPlayers, todayResult]);

  // Play mode settings
  const [isSuddenDeath, setIsSuddenDeath] = useState(true);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([
    ...DEFAULT_DIFFICULTIES,
  ]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [selectedEras, setSelectedEras] = useState<Era[]>([...ALL_ERAS]);

  // Player settings
  const [playerCount, setPlayerCount] = useState(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '', '', '']);

  // Settings popup state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Hand size setting (3-8 cards) - default varies by player count
  const [cardsPerHand, setCardsPerHand] = useState(7);

  // Sudden death hand size (1-7 cards, acts as "lives")
  const [suddenDeathHandSize, setSuddenDeathHandSize] = useState(5);

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

  // Daily theme - computed from today's date
  const dailySeed = new Date().toISOString().split('T')[0];
  const dailyTheme = useMemo(() => getDailyTheme(dailySeed), [dailySeed]);
  const dailyThemeDisplayName = getThemeDisplayName(dailyTheme);

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

    onStart({
      mode: isSuddenDeath ? 'suddenDeath' : 'freeplay',
      totalTurns: cardsPerHand,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      playerCount,
      playerNames: names,
      cardsPerHand,
      suddenDeathHandSize,
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-bg pt-14 pb-safe overflow-auto transition-colors"
    >
      {/* Top Bar */}
      <TopBar showHome={false} showTitle={false} onViewTimeline={onViewTimeline} />

      <div className="max-w-sm w-full text-center relative z-10">
        {/* Title */}
        <h1 className="text-4xl font-bold text-text mb-1 font-display">When?</h1>
        <p className="text-text-muted text-sm mb-2 font-body">
          Place events to make the longest timeline
        </p>

        {/* Game Modes */}
        <div className="space-y-4">
          {/* Daily Challenge (Hero) */}
          <div className="bg-surface rounded-2xl border border-border p-5">
            <h3 className="text-lg font-semibold font-body text-left">
              <span className="text-text">Daily Challenge: </span>
              <span className="text-accent">
                {todayResult ? todayResult.theme : dailyThemeDisplayName}
              </span>
            </h3>
            <p className="text-sm text-text-muted text-left mb-3 font-body">
              Same puzzle for everyone, every day
            </p>

            {todayResult ? (
              /* Completed daily state */
              <div className="space-y-2">
                <div className="text-sm font-medium text-text-muted font-body text-left">
                  {todayResult.correctCount} event
                  {todayResult.correctCount !== 1 ? 's' : ''} placed correctly
                </div>
                <button
                  onClick={handleShareDaily}
                  className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body"
                >
                  <Share2 className="w-4 h-4" />
                  Challenge a Friend
                </button>
              </div>
            ) : (
              /* Play daily CTA */
              <button
                onClick={handleDailyStart}
                className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body"
              >
                <Play className="w-4 h-4" />
                Play Daily Challenge
              </button>
            )}

            {/* Mini-Leaderboard */}
            <MiniLeaderboard
              entries={leaderboard}
              isLoading={isLeaderboardLoading}
              onOpenFull={() => setIsLeaderboardOpen(true)}
            />
          </div>

          {/* Custom Game */}
          <div className="bg-surface rounded-2xl border border-border p-5">
            <h3 className="text-lg font-semibold font-body text-left text-text">Custom Game</h3>
            <p className="text-sm text-text-muted text-left mb-3 font-body">
              Choose eras, categories & local multiplayer
            </p>
            <div className="space-y-2">
              <button
                onClick={handlePlayStart}
                disabled={!isPlayValid}
                className={`w-full py-3 px-4 text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body ${
                  isPlayValid
                    ? 'bg-accent-secondary hover:bg-accent-secondary/90 text-white'
                    : 'bg-border text-text-muted cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4" />
                Play
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full py-3 px-4 text-text-muted hover:text-text border border-border hover:bg-bg rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Share toast */}
        {showShareToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 z-50 font-body">
            <Check className="w-4 h-4" />
            Copied to clipboard!
          </div>
        )}
      </div>

      {/* Settings Popup */}
      <SettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        allEvents={allEvents}
        isSuddenDeath={isSuddenDeath}
        setIsSuddenDeath={setIsSuddenDeath}
        selectedDifficulties={selectedDifficulties}
        setSelectedDifficulties={setSelectedDifficulties}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedEras={selectedEras}
        setSelectedEras={setSelectedEras}
        playerCount={playerCount}
        playerNames={playerNames}
        setPlayerNames={setPlayerNames}
        cardsPerHand={cardsPerHand}
        setCardsPerHand={setCardsPerHand}
        suddenDeathHandSize={suddenDeathHandSize}
        setSuddenDeathHandSize={setSuddenDeathHandSize}
        onPlayerCountChange={handlePlayerCountChange}
      />

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
      />
    </motion.div>
  );
};

export default ModeSelect;
