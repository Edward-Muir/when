import React from 'react';
import { X, Zap } from 'lucide-react';
import { Difficulty, Category, Era, HistoricalEvent } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';

const ALL_CATEGORIES: Category[] = [
  'conflict',
  'disasters',
  'exploration',
  'cultural',
  'infrastructure',
  'diplomatic',
];

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  allEvents: HistoricalEvent[];
  // Sudden death toggle
  isSuddenDeath: boolean;
  setIsSuddenDeath: (value: boolean) => void;
  // Settings state
  selectedDifficulties: Difficulty[];
  setSelectedDifficulties: (difficulties: Difficulty[]) => void;
  selectedCategories: Category[];
  setSelectedCategories: (categories: Category[]) => void;
  selectedEras: Era[];
  setSelectedEras: (eras: Era[]) => void;
  // Player settings
  playerCount: number;
  playerNames: string[];
  setPlayerNames: (names: string[]) => void;
  // Hand size setting
  cardsPerHand: number;
  setCardsPerHand: (value: number) => void;
  // Sudden death hand size
  suddenDeathHandSize: number;
  setSuddenDeathHandSize: (value: number) => void;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({
  isOpen,
  onClose,
  allEvents,
  isSuddenDeath,
  setIsSuddenDeath,
  selectedDifficulties,
  setSelectedDifficulties,
  selectedCategories,
  setSelectedCategories,
  selectedEras,
  setSelectedEras,
  playerCount,
  playerNames,
  setPlayerNames,
  cardsPerHand,
  setCardsPerHand,
  suddenDeathHandSize,
  setSuddenDeathHandSize,
}) => {
  if (!isOpen) return null;

  const filteredEventCount = filterByEra(
    filterByCategory(filterByDifficulty(allEvents, selectedDifficulties), selectedCategories),
    selectedEras
  ).length;

  const effectiveHandSize = isSuddenDeath ? suddenDeathHandSize : cardsPerHand;
  const minRequiredCards = playerCount * effectiveHandSize + 1 + playerCount * 2;
  const hasEnoughCards = filteredEventCount >= minRequiredCards;

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties(
      selectedDifficulties.includes(difficulty)
        ? selectedDifficulties.filter((d) => d !== difficulty)
        : [...selectedDifficulties, difficulty]
    );
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories(
      selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category]
    );
  };

  const toggleEra = (era: Era) => {
    setSelectedEras(
      selectedEras.includes(era) ? selectedEras.filter((e) => e !== era) : [...selectedEras, era]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text font-display">Game Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-border rounded-full transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Sudden Death Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-error/10 border border-error/20">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isSuddenDeath ? 'text-error' : 'text-text-muted'}`} />
              <div>
                <span className="text-sm font-medium text-text font-body">Sudden Death</span>
                <p className="text-[10px] text-text-muted font-body">
                  One wrong answer ends the game
                </p>
              </div>
            </div>
            <label className="relative inline-block w-11 h-6 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={isSuddenDeath}
                onChange={(e) => setIsSuddenDeath(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-error transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {/* Starting Hand Size - different settings for Sudden Death vs regular */}
          {isSuddenDeath ? (
            <div>
              <label className="block text-sm font-medium text-text mb-2 font-body">
                Starting Lives
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={suddenDeathHandSize}
                  onChange={(e) => setSuddenDeathHandSize(Number(e.target.value))}
                  className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-error"
                />
                <span className="text-sm font-medium text-text w-6 text-center font-body">
                  {suddenDeathHandSize}
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-1 font-body">
                Wrong answers don't draw new cards · Empty hand = game over
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text mb-2 font-body">
                Starting Hand Size
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={3}
                  max={8}
                  value={cardsPerHand}
                  onChange={(e) => setCardsPerHand(Number(e.target.value))}
                  className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="text-sm font-medium text-text w-6 text-center font-body">
                  {cardsPerHand}
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-1 font-body">
                Number of cards dealt to each player
              </p>
            </div>
          )}

          {/* Player Names - only show when more than 1 player */}
          {playerCount > 1 && (
            <div>
              <label className="block text-sm font-medium text-text mb-2 font-body">
                Player Names
              </label>
              <div className="space-y-2">
                {Array.from({ length: playerCount }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Player ${index + 1}`}
                    value={playerNames[index] || ''}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    className="
                      w-full px-3 py-2 rounded-lg text-sm
                      border border-border
                      bg-bg
                      text-text
                      placeholder:text-text-muted/60
                      focus:outline-none focus:border-accent
                      transition-colors font-body
                    "
                  />
                ))}
              </div>
            </div>
          )}

          {/* Difficulty selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-2 font-body">
              Card Difficulty
            </label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => toggleDifficulty(difficulty)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-sm font-body
                    transition-all capitalize
                    ${
                      selectedDifficulties.includes(difficulty)
                        ? 'bg-accent text-white shadow-md'
                        : 'bg-border text-text-muted hover:bg-border/80'
                    }
                  `}
                >
                  {difficulty}
                </button>
              ))}
            </div>
            {selectedDifficulties.length === 0 && (
              <p className="text-error text-xs mt-1 font-body">Select at least one difficulty</p>
            )}
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-2 font-body">Categories</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`
                    py-2 px-2 rounded-lg text-xs font-body
                    transition-all capitalize
                    ${
                      selectedCategories.includes(category)
                        ? 'bg-accent text-white shadow-md'
                        : 'bg-border text-text-muted hover:bg-border/80'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-error text-xs mt-1 font-body">Select at least one category</p>
            )}
          </div>

          {/* Era selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-2 font-body">Eras</label>
            <div className="grid grid-cols-2 gap-2">
              {ERA_DEFINITIONS.map((era) => (
                <button
                  key={era.id}
                  onClick={() => toggleEra(era.id)}
                  className={`
                    py-2 px-2 rounded-lg text-xs font-body
                    transition-all
                    ${
                      selectedEras.includes(era.id)
                        ? 'bg-accent text-white shadow-md'
                        : 'bg-border text-text-muted hover:bg-border/80'
                    }
                  `}
                >
                  {era.name}
                </button>
              ))}
            </div>
            {selectedEras.length === 0 && (
              <p className="text-error text-xs mt-1 font-body">Select at least one era</p>
            )}
          </div>

          {/* Deck card counter */}
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between text-sm text-text-muted font-body">
              <span>Cards in deck:</span>
              <span className={!hasEnoughCards ? 'text-error font-medium' : ''}>
                {filteredEventCount}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-muted/60 font-body">
              <span>Minimum required:</span>
              <span>{minRequiredCards}</span>
            </div>
            {!hasEnoughCards && (
              <p className="text-error text-xs mt-2 font-body">
                Not enough cards! Select more categories, difficulties, or eras.
              </p>
            )}
          </div>
        </div>

        {/* Done button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 px-6 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors font-body"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default SettingsPopup;
