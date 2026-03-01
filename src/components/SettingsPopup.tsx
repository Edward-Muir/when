import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Hourglass,
  TrendingUp,
  Play,
  Share2,
  RefreshCw,
  Check,
  Copy,
  ChevronDown,
} from 'lucide-react';
import { Difficulty, Category, Era, HistoricalEvent } from '../types';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import {
  encodeChallengeCode,
  decodeChallengeCode,
  generateChallengeSeed,
} from '../utils/challengeCode';
import { shareContent, CHALLENGE_URL } from '../utils/share';
import FilterControls from './FilterControls';

// Extracted to reduce cyclomatic complexity in SettingsPopup
const HandSizeSection: React.FC<{
  isSuddenDeath: boolean;
  suddenDeathHandSize: number;
  setSuddenDeathHandSize: (value: number) => void;
  cardsPerHand: number;
  setCardsPerHand: (value: number) => void;
}> = ({
  isSuddenDeath,
  suddenDeathHandSize,
  setSuddenDeathHandSize,
  cardsPerHand,
  setCardsPerHand,
}) => {
  if (isSuddenDeath) {
    return (
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
      </div>
    );
  }
  return (
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
    </div>
  );
};

const GameModeSelector: React.FC<{
  isSuddenDeath: boolean;
  setIsSuddenDeath: (value: boolean) => void;
}> = ({ isSuddenDeath, setIsSuddenDeath }) => (
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
        <div className="text-sm font-medium leading-tight">Casual</div>
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
);

const ChallengeSection: React.FC<{
  codeInput: string;
  isCodeValid: boolean;
  isPlayValid: boolean;
  onCodeChange: (value: string) => void;
  onRandomise: () => void;
  onCopy: () => void;
  onShare: () => void;
  showToast: boolean;
}> = ({
  codeInput,
  isCodeValid,
  isPlayValid,
  onCodeChange,
  onRandomise,
  onCopy,
  onShare,
  showToast,
}) => {
  const canShare = isPlayValid && isCodeValid;
  return (
    <>
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-text font-body mb-1">Share Game Settings</h3>
        <p className="text-xs text-text-muted font-body mb-3">
          Share your settings — copy the code or press share so others can play with the same cards
          in the same order.
        </p>

        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => onCodeChange(e.target.value)}
            className={`flex-1 text-sm font-mono text-accent bg-bg rounded-lg px-3 py-2 border transition-colors focus:outline-none font-body ${
              isCodeValid ? 'border-border focus:border-accent' : 'border-error'
            }`}
            placeholder="word-word-word"
          />
          <button
            onClick={onCopy}
            className="p-2 rounded-lg bg-border hover:bg-border/70 transition-colors flex-shrink-0"
            title="Copy code"
          >
            <Copy className="w-4 h-4 text-text-muted" />
          </button>
          <button
            onClick={onRandomise}
            className="p-2 rounded-lg bg-border hover:bg-border/70 transition-colors flex-shrink-0"
            title="Randomise seed"
          >
            <RefreshCw className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        <button
          onClick={onShare}
          disabled={!canShare}
          className={`w-full py-3 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body ${
            canShare
              ? 'bg-accent hover:bg-accent/90 text-white'
              : 'bg-border text-text-muted cursor-not-allowed'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Share Game Settings
        </button>
      </div>

      {showToast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 z-50 font-body">
          <Check className="w-4 h-4" />
          Copied to clipboard!
        </div>
      )}
    </>
  );
};

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
  // All hooks must be called before early return
  const [challengeSeed, setChallengeSeed] = useState(() => generateChallengeSeed());
  const [showShareToast, setShowShareToast] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(true);
  const applyingCodeRef = useRef(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const modeKey = isSuddenDeath ? ('suddenDeath' as const) : ('freeplay' as const);
  const effectiveHandSize = isSuddenDeath ? suddenDeathHandSize : cardsPerHand;

  const challengeCode = useMemo(
    () =>
      encodeChallengeCode({
        mode: modeKey,
        handSize: effectiveHandSize,
        playerCount,
        difficulties: selectedDifficulties,
        categories: selectedCategories,
        eras: selectedEras,
        seed: challengeSeed,
      }),
    [
      modeKey,
      effectiveHandSize,
      playerCount,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      challengeSeed,
    ]
  );

  // Sync codeInput to computed challengeCode when settings change
  useEffect(() => {
    if (!applyingCodeRef.current) {
      setCodeInput(challengeCode);
      setIsCodeValid(true);
    }
    applyingCodeRef.current = false;
  }, [challengeCode]);

  const handleCodeInput = (value: string) => {
    setCodeInput(value);
    const d = decodeChallengeCode(value);
    if (!d) {
      setIsCodeValid(false);
      return;
    }
    setIsCodeValid(true);
    applyingCodeRef.current = true;
    setIsSuddenDeath(d.mode === 'suddenDeath');
    const setHandSize = d.mode === 'suddenDeath' ? setSuddenDeathHandSize : setCardsPerHand;
    setHandSize(d.handSize);
    onPlayerCountChange(d.playerCount);
    setSelectedDifficulties(d.difficulties);
    setSelectedCategories(d.categories);
    setSelectedEras(d.eras);
    setChallengeSeed(d.seed);
  };

  const filteredEventCount = filterByEra(
    filterByCategory(filterByDifficulty(allEvents, selectedDifficulties), selectedCategories),
    selectedEras
  ).length;

  const minRequiredCards = playerCount * effectiveHandSize + 1 + playerCount * 2;
  const hasEnoughCards = filteredEventCount >= minRequiredCards;

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = playerNames.map((n, i) => (i === index ? name : n));
    setPlayerNames(newNames);
  };

  const handleShareChallenge = async () => {
    const text = `Play the same game I'm about to play! 👇\n${CHALLENGE_URL}/${challengeCode}`;
    const copied = await shareContent(text, 'When - Timeline Game');
    setShowShareToast(copied);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  if (!isOpen) return null;

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
          <GameModeSelector isSuddenDeath={isSuddenDeath} setIsSuddenDeath={setIsSuddenDeath} />

          {/* More Options toggle */}
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`w-full flex items-center justify-between py-3 px-4 text-sm font-medium rounded-lg transition-all active:scale-95 font-body ${
              isAdvancedOpen ? 'bg-accent text-white shadow-sm' : 'bg-border text-text-muted'
            }`}
          >
            <span>More Options</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              isAdvancedOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 pt-2">
                {/* Filter Controls (Difficulty, Category, Era) */}
                <FilterControls
                  selectedDifficulties={selectedDifficulties}
                  onDifficultiesChange={setSelectedDifficulties}
                  selectedCategories={selectedCategories}
                  onCategoriesChange={setSelectedCategories}
                  selectedEras={selectedEras}
                  onErasChange={setSelectedEras}
                />

                {/* Starting Hand Size */}
                <HandSizeSection
                  isSuddenDeath={isSuddenDeath}
                  suddenDeathHandSize={suddenDeathHandSize}
                  setSuddenDeathHandSize={setSuddenDeathHandSize}
                  cardsPerHand={cardsPerHand}
                  setCardsPerHand={setCardsPerHand}
                />

                {/* Player Count */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2 font-body">
                    Players
                  </label>
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

                {/* Share Game Settings */}
                <ChallengeSection
                  codeInput={codeInput}
                  isCodeValid={isCodeValid}
                  isPlayValid={isPlayValid}
                  onCodeChange={handleCodeInput}
                  onRandomise={() => setChallengeSeed(generateChallengeSeed())}
                  onCopy={() => {
                    navigator.clipboard.writeText(codeInput);
                    setShowShareToast(true);
                    setTimeout(() => setShowShareToast(false), 2000);
                  }}
                  onShare={handleShareChallenge}
                  showToast={showShareToast}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
