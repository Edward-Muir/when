import React, { useState, useMemo } from 'react';
import { Calendar, Gamepad2, Settings, Play, Sun, Moon, Share2 } from 'lucide-react';
import { GameConfig, Difficulty, Category, Era, HistoricalEvent } from '../types';
import { ALL_ERAS } from '../utils/eras';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import SettingsPopup from './SettingsPopup';
import { Toast } from './Toast';
import { useTheme } from '../hooks/useTheme';
import { shareApp } from '../utils/share';
import { getDailyTheme, getThemeDisplayName, getThemedCategories, getThemedEras } from '../utils/dailyTheme';

const ALL_CATEGORIES: Category[] = ['conflict', 'disasters', 'exploration', 'cultural', 'infrastructure', 'diplomatic'];
const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
  isLoading?: boolean;
  allEvents: HistoricalEvent[];
}

const ModeSelect: React.FC<ModeSelectProps> = ({ onStart, isLoading = false, allEvents }) => {
  const { isDark, toggleTheme } = useTheme();
  const [showToast, setShowToast] = useState(false);

  // Play mode settings
  const [isSuddenDeath, setIsSuddenDeath] = useState(false);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([...ALL_DIFFICULTIES]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [selectedEras, setSelectedEras] = useState<Era[]>([...ALL_ERAS]);

  // Player settings
  const [playerCount, setPlayerCount] = useState(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '', '', '']);

  // Settings popup state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Hand size setting (3-8 cards) - default varies by player count
  const [cardsPerHand, setCardsPerHand] = useState(7);

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
    if (selectedDifficulties.length === 0 || selectedCategories.length === 0 || selectedEras.length === 0) {
      return false;
    }
    const count = filterByEra(
      filterByCategory(
        filterByDifficulty(allEvents, selectedDifficulties),
        selectedCategories
      ),
      selectedEras
    ).length;
    // Need: (players * cards per hand) + 1 starting + (players * 2 for replacements)
    const minRequired = (playerCount * cardsPerHand) + 1 + (playerCount * 2);
    return count >= minRequired;
  }, [allEvents, selectedDifficulties, selectedCategories, selectedEras, playerCount, cardsPerHand]);

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
      cardsPerHand: 7,
    });
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
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-light-bg dark:bg-dark-bg pt-safe pb-safe transition-colors">
        <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl dark:shadow-card-rest-dark p-6 max-w-sm w-full text-center border border-light-border dark:border-dark-border">
          <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-1 font-display">When?</h1>
          <p className="text-light-muted dark:text-dark-muted text-sm mb-6 font-body">The Timeline Game</p>
          <div className="text-xl font-medium text-light-text dark:text-dark-text mb-2 font-body">Loading historical events...</div>
          <div className="animate-pulse text-sm text-light-muted dark:text-dark-muted font-body">
            Gathering history from across time
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-light-bg dark:bg-dark-bg pt-safe pb-safe overflow-auto transition-colors">
      <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-xl dark:shadow-card-rest-dark p-5 max-w-sm w-full text-center relative z-10 border border-light-border dark:border-dark-border">
        {/* Share Button */}
        <button
          onClick={async () => {
            const showClipboardToast = await shareApp();
            if (showClipboardToast) setShowToast(true);
          }}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border transition-colors"
          aria-label="Share game"
        >
          <Share2 className="w-5 h-5 text-accent dark:text-accent-dark" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-accent-dark" />
          ) : (
            <Moon className="w-5 h-5 text-accent" />
          )}
        </button>

        {/* Title */}
        <h1 className="text-4xl font-bold text-light-text dark:text-dark-text mb-1 font-display">When?</h1>
        <p className="text-light-muted dark:text-dark-muted text-sm mb-5 font-body">The Timeline Game</p>

        {/* Game Modes */}
        <div className="space-y-3">
          {/* Play */}
          <div className="bg-blue-500/10 dark:bg-blue-400/20 rounded-xl p-3 border border-blue-500/20 dark:border-blue-400/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-light-text dark:text-dark-text text-sm font-body">Play</h3>
                <p className="text-[10px] text-light-muted dark:text-dark-muted font-body">Place events in the correct order</p>
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
                      ${playerCount === num
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
                  <span className="text-accent dark:text-accent-dark">{dailyThemeDisplayName}</span>
                </h3>
                <p className="text-[10px] text-light-muted dark:text-dark-muted font-body">Same puzzle for all · New theme daily</p>
              </div>
            </div>
            <button
              onClick={handleDailyStart}
              className="w-full py-2 px-3 bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 font-body"
            >
              <Play className="w-3.5 h-3.5" />
              Play Daily
            </button>
          </div>
        </div>

        {/* How to play */}
        <div className="mt-4 pt-3 border-t border-light-border dark:border-dark-border">
          <p className="text-[10px] text-light-muted dark:text-dark-muted font-body">
            Place historical events in the correct order on the timeline
          </p>
        </div>

        {/* Events loaded indicator */}
        {allEvents.length > 0 && (
          <p className="text-center mt-2 text-[10px] text-light-muted/60 dark:text-dark-muted/60 font-body">
            {allEvents.length} historical events loaded
          </p>
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
      />

      {/* Toast */}
      <Toast
        message="Copied to clipboard!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default ModeSelect;
