import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gamepad2, Settings, Play, Share2, Check } from 'lucide-react';
import { GameConfig, Difficulty, Category, Era, HistoricalEvent } from '../types';
import { ALL_ERAS } from '../utils/eras';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import SettingsPopup from './SettingsPopup';
import TopBar from './TopBar';
import {
  getDailyTheme,
  getThemeDisplayName,
  getThemedCategories,
  getThemedEras,
} from '../utils/dailyTheme';
import { getTodayResult } from '../utils/playerStorage';
import { shareDailyResult } from '../utils/share';
import { APP_VERSION } from '../version';

const ALL_CATEGORIES: Category[] = [
  'conflict',
  'disasters',
  'exploration',
  'cultural',
  'infrastructure',
  'diplomatic',
];
const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
  isLoading?: boolean;
  allEvents: HistoricalEvent[];
}

const ModeSelect: React.FC<ModeSelectProps> = ({ onStart, isLoading = false, allEvents }) => {
  // Check if daily has been played today
  const todayResult = getTodayResult();

  // Toast state for share button
  const [showShareToast, setShowShareToast] = useState(false);

  // Play mode settings
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([
    ...ALL_DIFFICULTIES,
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

  // Sudden death hand size (1-5 cards, acts as "lives")
  const [suddenDeathHandSize, setSuddenDeathHandSize] = useState(3);

  // Update default hand size when player count changes
  const getDefaultHandSize = (count: number) => {
    const defaults: Record<number, number> = { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 3 };
    return defaults[count] ?? 5;
  };

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
    onStart({
      mode: 'daily',
      totalTurns: 7,
      selectedDifficulties: [...ALL_DIFFICULTIES],
      selectedCategories: getThemedCategories(dailyTheme),
      selectedEras: getThemedEras(dailyTheme),
      dailySeed,
      playerCount: 1,
      playerNames: ['Player 1'],
      cardsPerHand: 3, // Daily uses sudden death mechanics with 3 starting cards
    });
  };

  const handleShareDaily = async () => {
    if (!todayResult) return;
    const showToast = await shareDailyResult(
      todayResult.date,
      todayResult.theme,
      todayResult.emojiGrid,
      todayResult.won,
      todayResult.correctCount,
      todayResult.totalAttempts
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
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-light-bg dark:bg-dark-bg pt-safe pb-safe transition-colors"
      >
        <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl dark:shadow-card-rest-dark p-6 max-w-sm w-full text-center border border-light-border dark:border-dark-border">
          <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-1 font-display">
            When?
          </h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mb-6 font-body">
            The Timeline Game
          </p>
          <div className="text-xl font-medium text-light-text dark:text-dark-text mb-2 font-body">
            Loading historical events...
          </div>
          <div className="animate-pulse text-sm text-light-muted dark:text-dark-muted font-body">
            Gathering history from across time
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-light-bg dark:bg-dark-bg pt-14 pb-safe overflow-auto transition-colors"
    >
      {/* Top Bar */}
      <TopBar showHome={false} />

      <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl dark:shadow-card-rest-dark p-5 max-w-sm w-full text-center relative z-10 border border-light-border dark:border-dark-border">
        {/* Title */}
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-1 font-display">
          When?
        </h1>
        <p className="text-light-muted dark:text-dark-muted text-sm mb-5 font-body">
          The Timeline Game
        </p>

        {/* Game Modes */}
        <div className="space-y-3">
          {/* Play */}
          <div className="bg-blue-500/10 dark:bg-blue-400/20 rounded-xl p-3 border border-blue-500/20 dark:border-blue-400/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-light-text dark:text-dark-text text-sm font-body">
                  Play
                </h3>
                <p className="text-[10px] text-light-muted dark:text-dark-muted font-body">
                  Place events in the correct order
                </p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 hover:bg-blue-500/20 rounded-full transition-colors flex-shrink-0"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-light-muted dark:text-dark-muted" />
              </button>
            </div>

            {/* Player count selector */}
            <div className="mb-2">
              <label className="block text-[10px] text-light-muted dark:text-dark-muted mb-1 font-body text-left">
                Players
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePlayerCountChange(num)}
                    className={`
                      flex-1 h-8 rounded-lg text-sm font-medium transition-all font-body
                      ${
                        playerCount === num
                          ? 'bg-blue-500 dark:bg-blue-400 text-white shadow-md'
                          : 'bg-light-border dark:bg-dark-border text-light-muted dark:text-dark-muted hover:bg-blue-500/20'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePlayStart}
              disabled={!isPlayValid}
              className={`w-full py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 font-body ${
                isPlayValid
                  ? 'bg-blue-500 hover:bg-blue-500/90 dark:bg-blue-400 dark:hover:bg-blue-400/90 text-white'
                  : 'bg-light-border dark:bg-dark-border text-light-muted dark:text-dark-muted cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Play
            </button>
          </div>

          {/* Daily Challenge */}
          <div className="bg-accent/10 dark:bg-accent-dark/20 rounded-xl p-3 border border-accent/20 dark:border-accent-dark/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-accent dark:bg-accent-dark rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-sm font-body">
                  <span className="text-light-text dark:text-dark-text">Daily Challenge: </span>
                  <span className="text-accent dark:text-accent-dark">
                    {todayResult ? todayResult.theme : dailyThemeDisplayName}
                  </span>
                </h3>
                <p className="text-[10px] text-light-muted dark:text-dark-muted font-body">
                  {todayResult ? 'Completed today' : 'Same puzzle for all · New theme daily'}
                </p>
              </div>
            </div>

            {todayResult ? (
              /* Completed daily state */
              <div className="space-y-2">
                {/* Results display */}
                <div className="text-sm font-medium text-light-text dark:text-dark-text font-body text-center">
                  {todayResult.correctCount} event{todayResult.correctCount !== 1 ? 's' : ''} placed
                  correctly.
                </div>

                {/* Share button */}
                <button
                  onClick={handleShareDaily}
                  className="w-full py-2 px-3 bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 font-body"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Result
                </button>

                {/* Come back tomorrow message */}
                <p className="text-[10px] text-light-muted dark:text-dark-muted font-body text-center">
                  Come back tomorrow for a new challenge!
                </p>
              </div>
            ) : (
              /* Play daily button */
              <button
                onClick={handleDailyStart}
                className="w-full py-2 px-3 bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 font-body"
              >
                <Play className="w-3.5 h-3.5" />
                Play Daily
              </button>
            )}
          </div>
        </div>

        {/* Share toast */}
        {showShareToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-light-text dark:bg-dark-text text-light-bg dark:text-dark-bg px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2 z-50 font-body">
            <Check className="w-4 h-4" />
            Copied to clipboard!
          </div>
        )}

        {/* Version display */}
        <p className="text-center mt-2 text-[10px] text-light-muted/60 dark:text-dark-muted/60 font-body">
          v{APP_VERSION}
        </p>
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
      />
    </motion.div>
  );
};

export default ModeSelect;
