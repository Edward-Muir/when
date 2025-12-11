import React from 'react';
import { X } from 'lucide-react';
import { Difficulty, Category, Era, HistoricalEvent, GameMode } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';

const ALL_CATEGORIES: Category[] = ['conflict', 'disasters', 'exploration', 'cultural', 'infrastructure', 'diplomatic'];

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
  allEvents: HistoricalEvent[];
  // Settings state
  totalTurns: number;
  setTotalTurns: (turns: number) => void;
  selectedDifficulties: Difficulty[];
  setSelectedDifficulties: (difficulties: Difficulty[]) => void;
  selectedCategories: Category[];
  setSelectedCategories: (categories: Category[]) => void;
  selectedEras: Era[];
  setSelectedEras: (eras: Era[]) => void;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({
  isOpen,
  onClose,
  mode,
  allEvents,
  totalTurns,
  setTotalTurns,
  selectedDifficulties,
  setSelectedDifficulties,
  selectedCategories,
  setSelectedCategories,
  selectedEras,
  setSelectedEras,
}) => {
  if (!isOpen) return null;

  const filteredEventCount = filterByEra(
    filterByCategory(
      filterByDifficulty(allEvents, selectedDifficulties),
      selectedCategories
    ),
    selectedEras
  ).length;

  // For sudden death, we need at least 2 cards (1 starting + 1 to play)
  const minRequiredCards = mode === 'suddenDeath' ? 2 : totalTurns + 1;
  const hasEnoughCards = filteredEventCount >= minRequiredCards;

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties(
      selectedDifficulties.includes(difficulty)
        ? selectedDifficulties.filter(d => d !== difficulty)
        : [...selectedDifficulties, difficulty]
    );
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(
      selectedCategories.includes(category)
        ? selectedCategories.filter(c => c !== category)
        : [...selectedCategories, category]
    );
  };

  const toggleEra = (era: Era) => {
    setSelectedEras(
      selectedEras.includes(era)
        ? selectedEras.filter(e => e !== era)
        : [...selectedEras, era]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-paper rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-sketch">
            {mode === 'suddenDeath' ? 'Sudden Death Settings' : 'Game Settings'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-sketch/70" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Number of Turns - only for freeplay mode */}
          {mode === 'freeplay' && (
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
          )}

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

        {/* Done button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default SettingsPopup;
