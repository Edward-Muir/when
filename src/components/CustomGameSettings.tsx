import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Play, RefreshCw, Share2, Check } from 'lucide-react';
import { Difficulty, Category, Era } from '../types';
import {
  encodeChallengeCode,
  decodeChallengeCode,
  generateChallengeSeed,
} from '../utils/challengeCode';
import { shareContent, CHALLENGE_URL } from '../utils/share';
import FilterControls from './FilterControls';

interface CustomGameSettingsProps {
  // Mode (Marathon = suddenDeath). UI hidden for now; defaults to Marathon in ModeSelect.
  // Setters are needed by the share-code input, which applies a decoded code to all settings.
  isSuddenDeath: boolean;
  setIsSuddenDeath: (value: boolean) => void;
  // Filter state
  selectedDifficulties: Difficulty[];
  setSelectedDifficulties: (difficulties: Difficulty[]) => void;
  selectedCategories: Category[];
  setSelectedCategories: (categories: Category[]) => void;
  selectedEras: Era[];
  setSelectedEras: (eras: Era[]) => void;
  // Player / hand size — controls hidden, but values + setters feed the deck/share code
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  cardsPerHand: number;
  setCardsPerHand: (value: number) => void;
  suddenDeathHandSize: number;
  setSuddenDeathHandSize: (value: number) => void;
  // Play action
  onPlay: () => void;
  isPlayValid: boolean;
  // Total cards matching the current era/category/difficulty selection
  deckCount: number;
}

/**
 * Inline custom-game configuration for the Custom page of the mode-select pager.
 * The card is a bounded flex column: the options (Categories / Eras / Difficulty pill
 * filters + the editable Share Game Settings code) scroll, while the Play button stays
 * pinned in a fixed footer so it is always visible and clickable. The mode selector,
 * hand-size, players and player-name controls are hidden for now and kept as commented-out
 * dead code at the bottom of this file for easy reinstatement.
 */
const CustomGameSettings: React.FC<CustomGameSettingsProps> = ({
  isSuddenDeath,
  setIsSuddenDeath,
  selectedDifficulties,
  setSelectedDifficulties,
  selectedCategories,
  setSelectedCategories,
  selectedEras,
  setSelectedEras,
  playerCount,
  onPlayerCountChange,
  cardsPerHand,
  setCardsPerHand,
  suddenDeathHandSize,
  setSuddenDeathHandSize,
  onPlay,
  isPlayValid,
  deckCount,
}) => {
  const [challengeSeed, setChallengeSeed] = useState(() => generateChallengeSeed());
  const [showShareToast, setShowShareToast] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(true);
  const applyingCodeRef = useRef(false);

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

  // Sync codeInput to the computed challengeCode when settings change
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

  const handleShareChallenge = async () => {
    const text = `Play the same game I'm about to play! 👇\n${CHALLENGE_URL}/${challengeCode}`;
    const copied = await shareContent(text, 'When - Timeline Game');
    setShowShareToast(copied);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Scrollable options */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Filters (Categories, Eras, Difficulty) */}
        <FilterControls
          selectedDifficulties={selectedDifficulties}
          onDifficultiesChange={setSelectedDifficulties}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          selectedEras={selectedEras}
          onErasChange={setSelectedEras}
        />

        {/* Share Game Settings — editable code + shuffle + share */}
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted font-body mb-1.5">
            Share Game Settings
          </h3>
          <p className="text-xs text-text-muted font-body mb-2">
            Edit or shuffle the code, then share so others can play the same cards in the same
            order.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => handleCodeInput(e.target.value)}
              className={`flex-1 text-sm font-mono text-accent bg-bg rounded-lg px-3 py-2 border transition-colors focus:outline-none font-body ${
                isCodeValid ? 'border-border focus:border-accent' : 'border-error'
              }`}
              placeholder="word-word-word"
            />
            <button
              onClick={() => setChallengeSeed(generateChallengeSeed())}
              className="p-2 rounded-lg bg-border hover:bg-border/70 transition-colors flex-shrink-0"
              title="Shuffle seed"
            >
              <RefreshCw className="w-4 h-4 text-text-muted" />
            </button>
            <button
              onClick={handleShareChallenge}
              className="p-2 rounded-lg bg-border hover:bg-border/70 transition-colors flex-shrink-0"
              title="Share settings"
            >
              <Share2 className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed footer — Play button always visible. Greys out when the deck is invalid. */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onPlay}
          disabled={!isPlayValid}
          className={`w-full py-3.5 px-6 text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body ${
            isPlayValid
              ? 'bg-accent-secondary hover:bg-accent-secondary/90 text-white'
              : 'bg-border text-text-muted cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4" />
          Play · {deckCount} events
        </button>
      </div>

      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 z-50 font-body">
          <Check className="w-4 h-4" />
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default CustomGameSettings;

/* ---------------------------------------------------------------------------
 * DEAD CODE: hidden Custom-game controls, kept for reinstatement.
 *
 * The Marathon/Casual mode selector, Starting Hand Size slider, Players counter and
 * player-name inputs were removed from the rendered UI. (The share-code section has been
 * reinstated above.) Their implementation is preserved below so the features can return.
 *
 * To reinstate:
 *  1. Re-add the `playerNames` / `setPlayerNames` props to CustomGameSettingsProps + the
 *     destructuring, and pass them again from ModeSelect (restore `setPlayerNames` there).
 *     The mode/hand-size/player-count setters are already wired (the share-code input uses them).
 *  2. Add back any needed icon imports: `Hourglass, TrendingUp` (mode selector).
 *  3. Restore the handlers + subcomponents and the JSX usages shown below.
 *
 * --- Handlers ---
 * const handlePlayerNameChange = (index: number, name: string) => {
 *   const newNames = playerNames.map((n, i) => (i === index ? name : n));
 *   setPlayerNames(newNames);
 * };
 *
 * --- Subcomponents ---
 * const HandSizeSection: React.FC<{
 *   isSuddenDeath: boolean;
 *   suddenDeathHandSize: number;
 *   setSuddenDeathHandSize: (value: number) => void;
 *   cardsPerHand: number;
 *   setCardsPerHand: (value: number) => void;
 * }> = ({ isSuddenDeath, suddenDeathHandSize, setSuddenDeathHandSize, cardsPerHand, setCardsPerHand }) => {
 *   if (isSuddenDeath) {
 *     return (
 *       <div>
 *         <label className="block text-sm font-medium text-text mb-2 font-body">Starting Hand Size</label>
 *         <div className="flex items-center gap-3">
 *           <input type="range" min={1} max={7} value={suddenDeathHandSize}
 *             onChange={(e) => setSuddenDeathHandSize(Number(e.target.value))}
 *             className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-error" />
 *           <span className="text-sm font-medium text-text w-6 text-center font-body">{suddenDeathHandSize}</span>
 *         </div>
 *       </div>
 *     );
 *   }
 *   return (
 *     <div>
 *       <label className="block text-sm font-medium text-text mb-2 font-body">Starting Hand Size</label>
 *       <div className="flex items-center gap-3">
 *         <input type="range" min={3} max={8} value={cardsPerHand}
 *           onChange={(e) => setCardsPerHand(Number(e.target.value))}
 *           className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent" />
 *         <span className="text-sm font-medium text-text w-6 text-center font-body">{cardsPerHand}</span>
 *       </div>
 *     </div>
 *   );
 * };
 *
 * const GameModeSelector: React.FC<{
 *   isSuddenDeath: boolean;
 *   setIsSuddenDeath: (value: boolean) => void;
 * }> = ({ isSuddenDeath, setIsSuddenDeath }) => (
 *   <div className="flex gap-2">
 *     <button onClick={() => setIsSuddenDeath(true)}
 *       className={`flex-1 flex items-center gap-2.5 py-3 px-3.5 rounded-lg transition-all font-body ${
 *         isSuddenDeath ? 'bg-accent text-white shadow-sm' : 'bg-border text-text-muted hover:bg-accent/20'}`}>
 *       <TrendingUp className="w-4 h-4 flex-shrink-0" />
 *       <div className="text-left">
 *         <div className="text-sm font-medium leading-tight">Marathon</div>
 *         <div className={`text-[10px] leading-tight mt-0.5 ${isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}>Longest timeline</div>
 *         <div className={`text-[10px] leading-tight ${isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}>Draw when right</div>
 *       </div>
 *     </button>
 *     <button onClick={() => setIsSuddenDeath(false)}
 *       className={`flex-1 flex items-center gap-2.5 py-3 px-3.5 rounded-lg transition-all font-body ${
 *         !isSuddenDeath ? 'bg-accent text-white shadow-sm' : 'bg-border text-text-muted hover:bg-accent/20'}`}>
 *       <Hourglass className="w-4 h-4 flex-shrink-0" />
 *       <div className="text-left">
 *         <div className="text-sm font-medium leading-tight">Casual</div>
 *         <div className={`text-[10px] leading-tight mt-0.5 ${!isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}>Empty your hand</div>
 *         <div className={`text-[10px] leading-tight ${!isSuddenDeath ? 'text-white/70' : 'text-text-muted/60'}`}>Draw when wrong</div>
 *       </div>
 *     </button>
 *   </div>
 * );
 *
 * --- JSX usages (place inside the scroll area) ---
 * Mode selector (above the filters):
 *   <GameModeSelector isSuddenDeath={isSuddenDeath} setIsSuddenDeath={setIsSuddenDeath} />
 *
 * Hand size:
 *   <HandSizeSection isSuddenDeath={isSuddenDeath} suddenDeathHandSize={suddenDeathHandSize}
 *     setSuddenDeathHandSize={setSuddenDeathHandSize} cardsPerHand={cardsPerHand} setCardsPerHand={setCardsPerHand} />
 *
 * Players:
 *   <div>
 *     <label className="block text-sm font-medium text-text mb-2 font-body">Players</label>
 *     <div className="flex gap-1">
 *       {[1, 2, 3, 4, 5, 6].map((num) => (
 *         <button key={num} onClick={() => onPlayerCountChange(num)}
 *           className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all font-body ${
 *             playerCount === num ? 'bg-accent text-white shadow-sm' : 'bg-border text-text-muted hover:bg-accent/20'}`}>
 *           {num}
 *         </button>
 *       ))}
 *     </div>
 *   </div>
 *
 * Player names (when playerCount > 1):
 *   {playerCount > 1 && (
 *     <div>
 *       <label className="block text-sm font-medium text-text mb-2 font-body">Player Names</label>
 *       <div className="space-y-2">
 *         {Array.from({ length: playerCount }).map((_, index) => (
 *           <input key={index} type="text" placeholder={`Player ${index + 1}`}
 *             value={playerNames.at(index) || ''} onChange={(e) => handlePlayerNameChange(index, e.target.value)}
 *             className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-bg text-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent transition-colors font-body" />
 *         ))}
 *       </div>
 *     </div>
 *   )}
 * --------------------------------------------------------------------------- */
