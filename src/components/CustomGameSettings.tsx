import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Share2, Check } from 'lucide-react';
import { Difficulty, Category, Era } from '../types';
import {
  encodeChallengeCode,
  decodeChallengeCode,
  generateChallengeSeed,
} from '../utils/challengeCode';
import { generateChallengeInviteText, shareContent, CHALLENGE_URL } from '../utils/share';
import FilterControls from './FilterControls';
import CustomSharePopup from './CustomSharePopup';

interface CustomGameSettingsProps {
  // Filter state
  selectedDifficulties: Difficulty[];
  setSelectedDifficulties: (difficulties: Difficulty[]) => void;
  selectedCategories: Category[];
  setSelectedCategories: (categories: Category[]) => void;
  selectedEras: Era[];
  setSelectedEras: (eras: Era[]) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  excludedCountries: string[];
  setExcludedCountries: (countries: string[]) => void;
  countryOptions: Map<string, string[]>;
  // Player / hand size — controls hidden, but values + setters feed the deck/share code
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  suddenDeathHandSize: number;
  setSuddenDeathHandSize: (value: number) => void;
  // Play action
  onPlay: () => void;
  isPlayValid: boolean;
  // Total cards matching the current difficulty/category/era/region selection
  deckCount: number;
  /** Shown above the filter rows, in the same scroll region (the Quick decks). */
  top?: React.ReactNode;
}

/**
 * Inline custom-game configuration for the Custom tab of the home screen pager.
 * A bounded flex column: whatever `top` holds (the Quick decks) and the folded filter rows
 * (Difficulty / Categories / Eras / Regions / Countries) scroll together, while Play and the
 * Share button beside it stay pinned in a footer, so both are always visible. Share opens the
 * link field in a popup (`CustomSharePopup`). The hand-size, players and player-name controls
 * are hidden and kept as commented-out dead code at the bottom of this file for easy
 * reinstatement.
 */
const CustomGameSettings: React.FC<CustomGameSettingsProps> = ({
  selectedDifficulties,
  setSelectedDifficulties,
  selectedCategories,
  setSelectedCategories,
  selectedEras,
  setSelectedEras,
  selectedRegions,
  setSelectedRegions,
  excludedCountries,
  setExcludedCountries,
  countryOptions,
  playerCount,
  onPlayerCountChange,
  suddenDeathHandSize,
  setSuddenDeathHandSize,
  onPlay,
  isPlayValid,
  deckCount,
  top,
}) => {
  const [challengeSeed, setChallengeSeed] = useState(() => generateChallengeSeed());
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(true);
  const applyingCodeRef = useRef(false);

  const challengeCode = useMemo(
    () =>
      encodeChallengeCode({
        handSize: suddenDeathHandSize,
        playerCount,
        difficulties: selectedDifficulties,
        categories: selectedCategories,
        eras: selectedEras,
        regions: selectedRegions,
        excludedCountries,
        seed: challengeSeed,
      }),
    [
      suddenDeathHandSize,
      playerCount,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      selectedRegions,
      excludedCountries,
      challengeSeed,
    ]
  );

  const shareUrl = `${CHALLENGE_URL}/${challengeCode}`;
  // A group emptied (by Clear, on the way to a pick) has no link: the code can't encode an
  // empty group, so the one it would show wouldn't load for anyone. The input is left empty,
  // still ready for a pasted link, and Share waits.
  const groupsComplete = [
    selectedDifficulties,
    selectedCategories,
    selectedEras,
    selectedRegions,
  ].every((group) => group.length > 0);

  // Sync the displayed share URL to the computed game state when settings change
  useEffect(() => {
    if (!applyingCodeRef.current) {
      setCodeInput(groupsComplete ? shareUrl : '');
      setIsCodeValid(true);
    }
    applyingCodeRef.current = false;
  }, [shareUrl, groupsComplete]);

  const handleCodeInput = (value: string) => {
    setCodeInput(value);
    const d = decodeChallengeCode(value);
    if (!d) {
      setIsCodeValid(false);
      return;
    }
    setIsCodeValid(true);
    applyingCodeRef.current = true;
    setSuddenDeathHandSize(d.handSize);
    onPlayerCountChange(d.playerCount);
    setSelectedDifficulties(d.difficulties);
    setSelectedCategories(d.categories);
    setSelectedEras(d.eras);
    setSelectedRegions(d.regions);
    setExcludedCountries(d.excludedCountries);
    setChallengeSeed(d.seed);
  };

  // The popup closes first, so the toast lands on the tab, above the tab bar.
  const handleShareChallenge = async () => {
    setShareOpen(false);
    const copied = await shareContent(
      generateChallengeInviteText(shareUrl),
      'When? - The Timeline Game'
    );
    setShowShareToast(copied);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* One scroll region for the quick decks and the folded rows; Play and Share stay put.
          Folded, it all fits a 375x667 phone without scrolling. */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        {top}
        <FilterControls
          collapsible
          selectedDifficulties={selectedDifficulties}
          onDifficultiesChange={setSelectedDifficulties}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          selectedEras={selectedEras}
          onErasChange={setSelectedEras}
          selectedRegions={selectedRegions}
          onRegionsChange={setSelectedRegions}
          excludedCountries={excludedCountries}
          onExcludedChange={setExcludedCountries}
          countryOptions={countryOptions}
          matchCount={deckCount}
        />
      </div>

      {/* Footer: Play, and Share beside it. Both grey out while a group is empty. */}
      <div className="flex gap-2 py-1.5">
        <button
          onClick={onPlay}
          disabled={!isPlayValid}
          className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition-all active:scale-95 font-body ${
            isPlayValid
              ? 'bg-accent-secondary text-white'
              : 'bg-border text-text-muted cursor-not-allowed'
          }`}
        >
          <Play className="w-4 h-4" />
          Play · {deckCount} events
        </button>
        <button
          onClick={() => setShareOpen(true)}
          disabled={!groupsComplete}
          aria-haspopup="dialog"
          aria-label="Share settings"
          title="Share settings"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2 border-accent-secondary bg-surface text-accent-secondary transition-all active:scale-95 disabled:opacity-40"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      <CustomSharePopup
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        codeInput={codeInput}
        isCodeValid={isCodeValid}
        onCodeInput={handleCodeInput}
        onShuffle={() => setChallengeSeed(generateChallengeSeed())}
        onShare={handleShareChallenge}
      />

      {showShareToast && (
        <div className="pointer-events-none fixed bottom-above-tabbar left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-sm flex items-center gap-2 z-50 font-body">
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
 * The Starting Hand Size slider, Players counter and player-name inputs are not rendered.
 * Their implementation is preserved below so the features can return.
 *
 * To reinstate:
 *  1. Re-add the `playerNames` / `setPlayerNames` props to CustomGameSettingsProps + the
 *     destructuring. The state lives in `useCustomGameSettings` (expose `setPlayerNames`
 *     there) and flows in through `CustomPanel`'s props.
 *     The hand-size/player-count setters are already wired (the share-code input uses them).
 *  2. Restore the handlers + subcomponents and the JSX usages shown below.
 *
 * --- Handlers ---
 * const handlePlayerNameChange = (index: number, name: string) => {
 *   const newNames = playerNames.map((n, i) => (i === index ? name : n));
 *   setPlayerNames(newNames);
 * };
 *
 * --- Subcomponents ---
 * const HandSizeSection: React.FC<{
 *   suddenDeathHandSize: number;
 *   setSuddenDeathHandSize: (value: number) => void;
 * }> = ({ suddenDeathHandSize, setSuddenDeathHandSize }) => (
 *   <div>
 *     <label className="block text-sm font-medium text-text mb-2 font-body">Starting Hand Size</label>
 *     <div className="flex items-center gap-3">
 *       <input type="range" min={1} max={7} value={suddenDeathHandSize}
 *         onChange={(e) => setSuddenDeathHandSize(Number(e.target.value))}
 *         className="flex-1 h-2 bg-border rounded-lg appearance-none cursor-pointer accent-error" />
 *       <span className="text-sm font-medium text-text w-6 text-center font-body">{suddenDeathHandSize}</span>
 *     </div>
 *   </div>
 * );
 *
 * --- JSX usages (place inside the scroll area) ---
 * Hand size:
 *   <HandSizeSection suddenDeathHandSize={suddenDeathHandSize}
 *     setSuddenDeathHandSize={setSuddenDeathHandSize} />
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
