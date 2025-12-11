import React, { useState, useMemo } from 'react';
import { Play, ChevronRight } from 'lucide-react';
import { GameConfig, Difficulty, Category, Era, HistoricalEvent } from '../types';
import { ERA_DEFINITIONS, ALL_ERAS } from '../utils/eras';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';

const ALL_CATEGORIES: Category[] = ['conflict', 'disasters', 'exploration', 'cultural', 'infrastructure', 'diplomatic'];

interface StartScreenProps {
  onStart: (config: GameConfig) => void;
  isLoading?: boolean;
  allEvents: HistoricalEvent[];
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, isLoading = false, allEvents }) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [totalTurns, setTotalTurns] = useState(8);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(['easy', 'medium', 'hard']);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [selectedEras, setSelectedEras] = useState<Era[]>([...ALL_ERAS]);

  // Calculate filtered event count based on selected options
  const filteredEventCount = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return 0;
    return filterByEra(
      filterByCategory(
        filterByDifficulty(allEvents, selectedDifficulties),
        selectedCategories
      ),
      selectedEras
    ).length;
  }, [allEvents, selectedDifficulties, selectedCategories, selectedEras]);

  // Minimum cards needed: totalTurns + 1 (for starting timeline event)
  const minRequiredCards = totalTurns + 1;
  const hasEnoughCards = filteredEventCount >= minRequiredCards;

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleEra = (era: Era) => {
    setSelectedEras(prev =>
      prev.includes(era)
        ? prev.filter(e => e !== era)
        : [...prev, era]
    );
  };

  const handleStart = () => {
    onStart({
      totalTurns,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
    });
  };

  const isValid = selectedDifficulties.length > 0 && selectedCategories.length > 0 && selectedEras.length > 0 && hasEnoughCards;

  return (
    <div className="min-h-dvh min-h-screen-safe flex flex-col items-center justify-center p-6 bg-cream pt-safe pb-safe overflow-auto">
      <div className="bg-paper rounded-2xl shadow-xl p-8 max-w-md w-full text-center relative z-10">
        {/* Title */}
        <h1 className="text-5xl font-bold text-sketch mb-2 mt-4">When?</h1>
        <p className="text-sketch/60 text-lg mb-8">The Timeline Game</p>

        {/* Instructions */}
        <div className="bg-amber-50 rounded-xl p-4 mb-6 text-left">
          <h2 className="font-bold text-sketch mb-2">How to play:</h2>
          <ul className="text-sketch/70 text-sm space-y-2">
            <li>- You'll see one historical event at a time</li>
            <li>- Tap where you think it belongs on the timeline</li>
            <li>- Get points for correct placements</li>
            <li>- You have {totalTurns} turns to score as high as you can!</li>
          </ul>
        </div>

        {/* Advanced Options Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center gap-2 mx-auto text-sketch/70 hover:text-sketch transition-colors"
          >
            <ChevronRight
              className={`w-5 h-5 transition-transform ${showAdvancedOptions ? 'rotate-90' : ''}`}
            />
            Advanced Options
          </button>
        </div>

        {/* Advanced Options Content */}
        {showAdvancedOptions && (
          <div className="mb-6 space-y-4 text-left pl-2 border-l-2 border-amber-200">
            {/* Number of Turns */}
            <div>
              <label className="block text-sm font-medium text-sketch mb-2">
                Number of Turns: {totalTurns}
              </label>
              <input
                type="range"
                min={5}
                max={20}
                value={totalTurns}
                onChange={(e) => setTotalTurns(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-sketch/40 text-xs">
                <span>Shorter</span>
                <span>Longer</span>
              </div>
            </div>

            {/* Difficulty selection */}
            <div>
              <label className="block text-sm font-medium text-sketch mb-2">
                Card Difficulty
              </label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => toggleDifficulty(difficulty)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg text-sm
                      transition-all capitalize
                      ${selectedDifficulties.includes(difficulty)
                        ? 'bg-amber-400 text-sketch shadow-md'
                        : 'bg-gray-200 text-sketch/60 hover:bg-gray-300'
                      }
                    `}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
              {selectedDifficulties.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Select at least one difficulty</p>
              )}
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-sm font-medium text-sketch mb-2">
                Categories
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`
                      py-2 px-2 rounded-lg text-xs
                      transition-all capitalize
                      ${selectedCategories.includes(category)
                        ? 'bg-amber-400 text-sketch shadow-md'
                        : 'bg-gray-200 text-sketch/60 hover:bg-gray-300'
                      }
                    `}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {selectedCategories.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Select at least one category</p>
              )}
            </div>

            {/* Era selection */}
            <div>
              <label className="block text-sm font-medium text-sketch mb-2">
                Eras
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ERA_DEFINITIONS.map((era) => (
                  <button
                    key={era.id}
                    onClick={() => toggleEra(era.id)}
                    className={`
                      py-2 px-2 rounded-lg text-xs
                      transition-all
                      ${selectedEras.includes(era.id)
                        ? 'bg-amber-400 text-sketch shadow-md'
                        : 'bg-gray-200 text-sketch/60 hover:bg-gray-300'
                      }
                    `}
                  >
                    {era.name}
                  </button>
                ))}
              </div>
              {selectedEras.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Select at least one era</p>
              )}
            </div>

            {/* Deck card counter */}
            <div className="pt-2 border-t border-amber-200/50">
              <div className="flex justify-between text-sm text-sketch/70">
                <span>Cards in deck:</span>
                <span className={!hasEnoughCards ? 'text-red-500 font-medium' : ''}>
                  {filteredEventCount}
                </span>
              </div>
              <div className="flex justify-between text-xs text-sketch/50">
                <span>Minimum required:</span>
                <span>{minRequiredCards}</span>
              </div>
              {!hasEnoughCards && (
                <p className="text-red-500 text-xs mt-2">
                  Not enough cards! Select more categories, difficulties, or eras.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isLoading || !isValid}
          className={`
            w-full py-4 px-6
            ${isValid
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              : 'bg-gray-400'
            }
            disabled:from-gray-400 disabled:to-gray-500
            text-white text-lg font-medium
            rounded-xl shadow-lg
            transition-all duration-200
            flex items-center justify-center gap-2
            active:scale-95
            disabled:cursor-not-allowed
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Game
            </>
          )}
        </button>

        {/* Events loaded indicator */}
        {allEvents.length > 0 && (
          <p className="text-center mt-3 text-xs text-sketch/40">
            {allEvents.length} historical events loaded
          </p>
        )}
      </div>
    </div>
  );
};

export default StartScreen;
