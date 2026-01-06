import React from 'react';
import { X, Hourglass } from 'lucide-react';
import { Difficulty, Category, Era, HistoricalEvent } from '../types';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import FilterControls from './FilterControls';

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
          {/* Classic Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2">
              <Hourglass
                className={`w-4 h-4 ${!isSuddenDeath ? 'text-accent' : 'text-text-muted'}`}
              />
              <div>
                <span className="text-sm font-medium text-text font-body">Classic Mode</span>
                <p className="text-[10px] text-text-muted font-body">Empty your hand to win</p>
              </div>
            </div>
            <label className="relative inline-block w-11 h-6 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={!isSuddenDeath}
                onChange={(e) => setIsSuddenDeath(!e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-accent transition-colors" />
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

          {/* Filter Controls (Difficulty, Category, Era) */}
          <FilterControls
            selectedDifficulties={selectedDifficulties}
            onDifficultiesChange={setSelectedDifficulties}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            selectedEras={selectedEras}
            onErasChange={setSelectedEras}
          />

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
