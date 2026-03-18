import React, { useState, useMemo, useEffect } from 'react';
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
import SettingsPopup from './SettingsPopup';
import TopBar from './TopBar';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { buildDailyConfig } from '../utils/dailyConfig';
import { getTodayResult, updateDailyResultWithLeaderboard } from '../utils/playerStorage';
import { shareDailyResult } from '../utils/share';
import { encodeChallengeCode, generateChallengeSeed } from '../utils/challengeCode';

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
    className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 disco-bg pt-safe pb-safe transition-colors"
  >
    <div className="disco-card rounded-2xl p-6 max-w-sm w-full text-center">
      <h1 className="text-4xl font-bold disco-text-magenta mb-1 font-disco disco-title">WHEN?</h1>
      <p className="disco-text-muted text-sm mb-6 font-body">The Timeline Game</p>
      <div className="text-xl font-medium text-white mb-2 font-body">
        Loading historical events...
      </div>
      <div className="animate-pulse text-sm disco-text-muted font-body">
        Gathering history from across time
      </div>
    </div>
  </motion.div>
);

// Disco ball
const DiscoBall: React.FC = () => (
  <div className="disco-ball text-5xl select-none" aria-hidden="true">
    🪩
  </div>
);

// Starfield background dots
const Stars: React.FC = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        top: `${Math.random() * 60}%`,
        left: `${Math.random() * 100}%`,
        duration: `${1.5 + Math.random() * 3}s`,
        delay: `${Math.random() * 3}s`,
      })),
    []
  );
  return (
    <>
      {stars.map((s) => (
        <span
          key={s.id}
          className="disco-star"
          style={
            {
              top: s.top,
              left: s.left,
              '--duration': s.duration,
              '--delay': s.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
};

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
      className="mt-4 w-full text-left cursor-pointer rounded-lg p-2 pt-3 transition-colors disco-separator border-t h-[156px] relative overflow-hidden hover:bg-white/5"
    >
      <div className="flex items-center gap-1.5 text-sm disco-text-gold font-medium font-body mb-2">
        <Trophy className="w-3.5 h-3.5" />
        <span>Longest Timelines</span>
      </div>
      {!isLoading && top4.length === 0 ? (
        <div className="text-sm disco-text-muted font-body text-center mt-4">
          No entries yet. Be the first!
        </div>
      ) : (
        <div className="space-y-1">
          {[0, 1, 2, 3].map((i) => {
            const entry = !isLoading ? (top4.at(i) ?? null) : null;
            return (
              <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                {entry ? (
                  <>
                    <span className="w-5 text-center flex-shrink-0 disco-text-muted font-body">
                      {entry.rank}
                    </span>
                    <span className="flex-1 text-left truncate text-white font-body">
                      {entry.displayName}
                    </span>
                    <span className="font-body disco-text-cyan font-semibold flex-shrink-0">
                      {entry.correctCount}
                    </span>
                  </>
                ) : isLoading ? (
                  <>
                    <div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
                    <div
                      className="flex-1 h-5 bg-white/10 rounded animate-pulse"
                      style={{ width: `${65 - i * 10}%` }}
                    />
                    <div className="w-6 h-5 bg-white/10 rounded animate-pulse flex-shrink-0" />
                  </>
                ) : (
                  <span className="flex-1 invisible">&nbsp;</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {entries.length > 4 && (
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#06000f] to-transparent pointer-events-none" />
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 disco-bg pt-20 pb-safe overflow-auto transition-colors relative"
    >
      {/* Scanning light line */}
      <div className="disco-scanline" aria-hidden="true" />

      {/* Grid floor */}
      <div className="disco-grid" aria-hidden="true" />

      {/* Star field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <Stars />
      </div>

      {/* Top Bar */}
      <TopBar showHome={false} showTitle={false} onViewTimeline={onViewTimeline} />

      <div className="max-w-sm w-full text-center relative z-10">
        {/* Disco ball + Title */}
        <div className="flex flex-col items-center mb-4">
          <DiscoBall />
          <h1 className="text-4xl font-bold mt-2 mb-1 font-disco disco-title tracking-widest uppercase">
            When?
          </h1>
          <p className="disco-text-muted text-sm font-body">
            Place events to make the longest timeline
          </p>
        </div>

        {/* Game Modes */}
        <div className="space-y-4">
          {/* Daily Challenge (Hero) */}
          <div className="disco-card rounded-2xl p-5">
            <h3 className="text-lg font-semibold font-body text-left">
              <span className="text-white">Daily Challenge: </span>
              <span className="disco-text-magenta">
                {todayResult ? todayResult.theme : dailyThemeDisplayName}
              </span>
            </h3>
            <p className="text-sm disco-text-muted text-left mb-3 font-body">
              Same puzzle for everyone, every day
            </p>

            {todayResult ? (
              /* Completed daily state */
              <div className="space-y-2">
                <div className="text-sm font-medium disco-text-muted font-body text-left">
                  {todayResult.correctCount} event
                  {todayResult.correctCount !== 1 ? 's' : ''} placed correctly
                </div>
                <button
                  onClick={handleShareDaily}
                  className="w-full py-3 px-4 text-base font-semibold rounded-xl flex items-center justify-center gap-2 font-body disco-btn-magenta"
                >
                  <Share2 className="w-4 h-4" />
                  Challenge a Friend
                </button>
              </div>
            ) : (
              /* Play daily CTA */
              <button
                onClick={handleDailyStart}
                className="w-full py-3 px-4 text-base font-semibold rounded-xl flex items-center justify-center gap-2 font-body disco-btn-magenta"
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
          <div className="disco-card disco-card-cyan rounded-2xl p-5">
            <h3 className="text-lg font-semibold font-body text-left text-white">Custom Game</h3>
            <p className="text-sm disco-text-muted text-left mb-3 font-body">
              Choose eras, categories &amp; local multiplayer
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full py-3 px-4 text-base font-semibold rounded-xl flex items-center justify-center gap-2 font-body disco-btn-cyan"
            >
              <Play className="w-4 h-4" />
              Play
            </button>
          </div>
        </div>

        {/* Share toast */}
        {showShareToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 z-50 font-body">
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
        onPlay={handlePlayStart}
        isPlayValid={isPlayValid}
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
