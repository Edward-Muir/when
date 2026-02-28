import React from 'react';
import { X, Hourglass, TrendingUp, Play } from 'lucide-react';
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
  // Player count change handler
  onPlayerCountChange: (count: number) => void;
  // Play action
  onPlay: () => void;
  isPlayValid: boolean;
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
  onPlayerCountChange,
  onPlay,
  isPlayValid,
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
    const newNames = playerNames.map((n, i) => (i === index ? name : n));
    setPlayerNames(newNames);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-text font-display">Game Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-border rounded-full transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Play button */}
        <button
          onClick={onPlay}
          disabled={!isPlayValid}
          className={`w-full mb-4 py-3 px-6 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body ${
            isPlayValid
              ? 'bg-accent-secondary hover:bg-accent-secondary/90 text-white'
              : 'bg-border text-text-muted cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4" />
          Play
        </button>

        <div className="space-y-4">
          {/* Game Mode Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsSuddenDeath(true)}
              className={`flex-1 flex items-center gap-2.5 py-3 px-3.5 rounded-lg transition-all font-body ${
                isSuddenDeath
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-border text-text-muted hover:bg-accent/20'
              }`}
            >
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium leading-tight">Marathon</div>
                <div
                  className={`text-[10px] leading-tight mt-0.5 ${isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}
                >
                  Longest timeline
                </div>
                <div
                  className={`text-[10px] leading-tight ${isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}
                >
                  Draw when right
                </div>
              </div>
            </button>
            <button
              onClick={() => setIsSuddenDeath(false)}
              className={`flex-1 flex items-center gap-2.5 py-3 px-3.5 rounded-lg transition-all font-body ${
                !isSuddenDeath
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-border text-text-muted hover:bg-accent/20'
              }`}
            >
              <Hourglass className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium leading-tight">Classic</div>
                <div
                  className={`text-[10px] leading-tight mt-0.5 ${!isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}
                >
                  Empty your hand
                </div>
                <div
                  className={`text-[10px] leading-tight ${!isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}
                >
                  Draw when wrong
                </div>
              </div>
            </button>
          </div>

          {/* Starting Hand Size - different settings for Sudden Death vs regular */}
          {isSuddenDeath ? (
            <div>
              <label className="block text-sm font-medium text-text mb-2 font-body">
                Starting Hand Size
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={suddenDeathHandSize}
                  onChange={(e) => setSuddenDeathHandSize(Number(e.target.value))}
                  className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-error"
                />
                <span className="text-sm font-medium text-text w-6 text-center font-body">
                  {suddenDeathHandSize}
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-1 font-body">
                Place events correctly to draw cards. Make the longest timeline!
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
                Be the first to play all your cards. Draw a card if incorrect.
              </p>
            </div>
          )}

          {/* Player Count */}
          <div>
            <label className="block text-sm font-medium text-text mb-2 font-body">Players</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => onPlayerCountChange(num)}
                  className={`
                    flex-1 h-10 rounded-lg text-sm font-medium transition-all font-body
                    ${
                      playerCount === num
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-border text-text-muted hover:bg-accent/20'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

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
                    value={playerNames.at(index) || ''}
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
      </div>
    </div>
  );
};

export default SettingsPopup;
