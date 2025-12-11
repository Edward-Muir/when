import React, { useState, useMemo } from 'react';
import { Calendar, Zap, SlidersHorizontal, Settings, Play } from 'lucide-react';
import { GameConfig, GameMode, Difficulty, Category, Era, HistoricalEvent } from '../types';
import { ALL_ERAS } from '../utils/eras';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import SettingsPopup from './SettingsPopup';

const ALL_CATEGORIES: Category[] = ['conflict', 'disasters', 'exploration', 'cultural', 'infrastructure', 'diplomatic'];
const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

interface ModeSelectProps {
  onStart: (config: GameConfig) => void;
  isLoading?: boolean;
  allEvents: HistoricalEvent[];
}

const ModeSelect: React.FC<ModeSelectProps> = ({ onStart, isLoading = false, allEvents }) => {
  // Settings state for sudden death
  const [suddenDeathDifficulties, setSuddenDeathDifficulties] = useState<Difficulty[]>([...ALL_DIFFICULTIES]);
  const [suddenDeathCategories, setSuddenDeathCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [suddenDeathEras, setSuddenDeathEras] = useState<Era[]>([...ALL_ERAS]);

  // Settings state for freeplay
  const [freeplayTurns, setFreeplayTurns] = useState(8);
  const [freeplayDifficulties, setFreeplayDifficulties] = useState<Difficulty[]>([...ALL_DIFFICULTIES]);
  const [freeplayCategories, setFreeplayCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [freeplayEras, setFreeplayEras] = useState<Era[]>([...ALL_ERAS]);

  // Settings popup state
  const [settingsMode, setSettingsMode] = useState<GameMode | null>(null);

  // Check if settings are valid
  const isSuddenDeathValid = useMemo(() => {
    if (suddenDeathDifficulties.length === 0 || suddenDeathCategories.length === 0 || suddenDeathEras.length === 0) {
      return false;
    }
    const count = filterByEra(
      filterByCategory(
        filterByDifficulty(allEvents, suddenDeathDifficulties),
        suddenDeathCategories
      ),
      suddenDeathEras
    ).length;
    return count >= 2;
  }, [allEvents, suddenDeathDifficulties, suddenDeathCategories, suddenDeathEras]);

  const isFreeplayValid = useMemo(() => {
    if (freeplayDifficulties.length === 0 || freeplayCategories.length === 0 || freeplayEras.length === 0) {
      return false;
    }
    const count = filterByEra(
      filterByCategory(
        filterByDifficulty(allEvents, freeplayDifficulties),
        freeplayCategories
      ),
      freeplayEras
    ).length;
    return count >= freeplayTurns + 1;
  }, [allEvents, freeplayDifficulties, freeplayCategories, freeplayEras, freeplayTurns]);

  const handleDailyStart = () => {
    const today = new Date().toISOString().split('T')[0];
    onStart({
      mode: 'daily',
      totalTurns: 8,
      selectedDifficulties: [...ALL_DIFFICULTIES],
      selectedCategories: [...ALL_CATEGORIES],
      selectedEras: [...ALL_ERAS],
      dailySeed: today,
    });
  };

  const handleSuddenDeathStart = () => {
    onStart({
      mode: 'suddenDeath',
      totalTurns: -1, // Unlimited
      selectedDifficulties: suddenDeathDifficulties,
      selectedCategories: suddenDeathCategories,
      selectedEras: suddenDeathEras,
    });
  };

  const handleFreeplayStart = () => {
    onStart({
      mode: 'freeplay',
      totalTurns: freeplayTurns,
      selectedDifficulties: freeplayDifficulties,
      selectedCategories: freeplayCategories,
      selectedEras: freeplayEras,
    });
  };

  const openSettings = (mode: GameMode) => {
    setSettingsMode(mode);
  };

  const closeSettings = () => {
    setSettingsMode(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-cream pt-safe pb-safe">
        <div className="bg-paper rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
          <h1 className="text-4xl font-bold text-sketch mb-1">When?</h1>
          <p className="text-sketch/60 text-sm mb-6">The Timeline Game</p>
          <div className="text-xl font-medium text-sketch mb-2">Loading historical events...</div>
          <div className="animate-pulse text-sm text-sketch/60">
            Gathering history from across time
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-4 bg-cream pt-safe pb-safe overflow-auto">
      <div className="bg-paper rounded-2xl shadow-xl p-5 max-w-sm w-full text-center relative z-10">
        {/* Title */}
        <h1 className="text-4xl font-bold text-sketch mb-1">When?</h1>
        <p className="text-sketch/60 text-sm mb-5">The Timeline Game</p>

        {/* Game Modes */}
        <div className="space-y-3">
          {/* Daily Challenge */}
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-sketch text-sm">Daily Challenge</h3>
                <p className="text-[10px] text-sketch/60">Same puzzle for everyone today</p>
              </div>
            </div>
            <button
              onClick={handleDailyStart}
              className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              Play Daily
            </button>
          </div>

          {/* Sudden Death */}
          <div className="bg-red-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-sketch text-sm">Sudden Death</h3>
                <p className="text-[10px] text-sketch/60">One wrong answer and you're out</p>
              </div>
              <button
                onClick={() => openSettings('suddenDeath')}
                className="p-1.5 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-sketch/50" />
              </button>
            </div>
            <button
              onClick={handleSuddenDeathStart}
              disabled={!isSuddenDeathValid}
              className={`w-full py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                isSuddenDeathValid
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Play Sudden Death
            </button>
          </div>

          {/* Freeplay */}
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h3 className="font-bold text-sketch text-sm">Freeplay</h3>
                <p className="text-[10px] text-sketch/60">Customize your game</p>
              </div>
              <button
                onClick={() => openSettings('freeplay')}
                className="p-1.5 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-sketch/50" />
              </button>
            </div>
            <button
              onClick={handleFreeplayStart}
              disabled={!isFreeplayValid}
              className={`w-full py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                isFreeplayValid
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Play Freeplay
            </button>
          </div>
        </div>

        {/* How to play */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-[10px] text-sketch/50">
            Place historical events in the correct order on the timeline
          </p>
        </div>

        {/* Events loaded indicator */}
        {allEvents.length > 0 && (
          <p className="text-center mt-2 text-[10px] text-sketch/40">
            {allEvents.length} historical events loaded
          </p>
        )}
      </div>

      {/* Settings Popup for Sudden Death */}
      <SettingsPopup
        isOpen={settingsMode === 'suddenDeath'}
        onClose={closeSettings}
        mode="suddenDeath"
        allEvents={allEvents}
        totalTurns={0}
        setTotalTurns={() => {}}
        selectedDifficulties={suddenDeathDifficulties}
        setSelectedDifficulties={setSuddenDeathDifficulties}
        selectedCategories={suddenDeathCategories}
        setSelectedCategories={setSuddenDeathCategories}
        selectedEras={suddenDeathEras}
        setSelectedEras={setSuddenDeathEras}
      />

      {/* Settings Popup for Freeplay */}
      <SettingsPopup
        isOpen={settingsMode === 'freeplay'}
        onClose={closeSettings}
        mode="freeplay"
        allEvents={allEvents}
        totalTurns={freeplayTurns}
        setTotalTurns={setFreeplayTurns}
        selectedDifficulties={freeplayDifficulties}
        setSelectedDifficulties={setFreeplayDifficulties}
        selectedCategories={freeplayCategories}
        setSelectedCategories={setFreeplayCategories}
        selectedEras={freeplayEras}
        setSelectedEras={setFreeplayEras}
      />
    </div>
  );
};

export default ModeSelect;
