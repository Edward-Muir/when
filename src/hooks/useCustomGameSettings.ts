import { useState, useMemo, useEffect } from 'react';
import {
  GameConfig,
  Difficulty,
  Category,
  Era,
  HistoricalEvent,
  ALL_CATEGORIES,
  DEFAULT_DIFFICULTIES,
} from '../types';
import { ALL_ERAS } from '../utils/eras';
import { ALL_REGIONS, countryOptionsByRegion } from '../utils/regions';
import { filterPool } from '../utils/eventLoader';
import { getCustomSettings, saveCustomSettings } from '../utils/playerStorage';
import { encodeChallengeCode, generateChallengeSeed } from '../utils/challengeCode';
import { minDeckSize } from '../utils/gameLogic';
import { useRegionSelection } from './useRegionSelection';

// Default hand size by player count (1–6 players); anything else falls back to 5.
const DEFAULT_HAND_SIZES = [7, 6, 5, 4, 3, 3];
const getDefaultHandSize = (count: number): number =>
  (count >= 1 ? DEFAULT_HAND_SIZES.at(count - 1) : undefined) ?? 5;

/** Keep the saved values still in `all`; if none survive (an old install), select all. */
function restoreSelection<T>(saved: T[] | undefined, all: readonly T[]): T[] {
  const restored = saved?.filter((item) => all.includes(item));
  return restored && restored.length > 0 ? restored : [...all];
}

/**
 * The Custom tab's settings: the filters, the hidden player/hand controls, the pool they
 * select and the game config they start. Lifted out of `ModeSelect`, which only lays it out.
 *
 * The player's last configuration is restored from localStorage once on mount and saved on
 * every change. The deck seed is NOT restored: it stays random per play, so a refresh keeps
 * the settings but still yields a different game.
 */
export function useCustomGameSettings(allEvents: HistoricalEvent[]) {
  const [savedSettings] = useState(() => getCustomSettings());

  // Play settings. The players and hand-size controls are hidden for now, but their setters
  // are still wired so the Share Game Settings code input can apply a decoded code to all
  // settings.
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>(
    savedSettings?.selectedDifficulties ?? [...DEFAULT_DIFFICULTIES]
  );
  // Stale categories from a previous taxonomy are dropped.
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(() =>
    restoreSelection(savedSettings?.selectedCategories, ALL_CATEGORIES)
  );
  const [selectedEras, setSelectedEras] = useState<Era[]>(
    savedSettings?.selectedEras ?? [...ALL_ERAS]
  );
  // Settings saved before the region filter have no regions, and mean all of them.
  const { selectedRegions, setSelectedRegions, selectedCountries, setSelectedCountries } =
    useRegionSelection(
      () => restoreSelection(savedSettings?.selectedRegions, ALL_REGIONS),
      savedSettings?.selectedCountries
    );
  // Offered countries come from the whole catalogue, most-tagged first.
  const countryOptions = useMemo(() => countryOptionsByRegion(allEvents), [allEvents]);

  // Player settings (the players UI is hidden; `playerNames` is unused until it returns)
  const [playerCount, setPlayerCount] = useState(savedSettings?.playerCount ?? 1);
  const [playerNames] = useState<string[]>(['', '', '', '', '', '']);

  // Hand size setting (3-8 cards) - default varies by player count
  const [cardsPerHand, setCardsPerHand] = useState(savedSettings?.cardsPerHand ?? 7);

  // Sudden death hand size (1-7 cards, acts as "lives")
  const [suddenDeathHandSize, setSuddenDeathHandSize] = useState(
    savedSettings?.suddenDeathHandSize ?? 5
  );

  useEffect(() => {
    saveCustomSettings({
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      selectedRegions,
      selectedCountries,
      playerCount,
      cardsPerHand,
      suddenDeathHandSize,
    });
  }, [
    selectedDifficulties,
    selectedCategories,
    selectedEras,
    selectedRegions,
    selectedCountries,
    playerCount,
    cardsPerHand,
    suddenDeathHandSize,
  ]);

  const onPlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setCardsPerHand(getDefaultHandSize(count));
  };

  // Total cards matching the current selection — shown on the Play button.
  const deckCount = useMemo(
    () =>
      filterPool(allEvents, {
        difficulties: selectedDifficulties,
        categories: selectedCategories,
        eras: selectedEras,
        regions: selectedRegions,
        countries: selectedCountries,
      }).length,
    [
      allEvents,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      selectedRegions,
      selectedCountries,
    ]
  );

  const groupEmpty =
    selectedDifficulties.length === 0 ||
    selectedCategories.length === 0 ||
    selectedEras.length === 0 ||
    selectedRegions.length === 0;
  const isPlayValid = !groupEmpty && deckCount >= minDeckSize(playerCount, suddenDeathHandSize);

  /** A fresh game from the current settings, with a new seed packed into its share code. */
  const buildGameConfig = (): GameConfig => {
    const names = playerNames
      .slice(0, playerCount)
      .map((name, i) => name.trim() || `Player ${i + 1}`);

    const challengeCode = encodeChallengeCode({
      handSize: suddenDeathHandSize,
      playerCount,
      difficulties: selectedDifficulties,
      categories: selectedCategories,
      eras: selectedEras,
      regions: selectedRegions,
      countries: selectedCountries,
      seed: generateChallengeSeed(),
    });

    return {
      mode: 'suddenDeath',
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      selectedRegions,
      selectedCountries,
      challengeSeed: challengeCode,
      challengeCode,
      playerCount,
      playerNames: names,
      cardsPerHand,
      suddenDeathHandSize,
    };
  };

  return {
    /** Spread straight into `CustomPanel`. */
    panelProps: {
      selectedDifficulties,
      setSelectedDifficulties,
      selectedCategories,
      setSelectedCategories,
      selectedEras,
      setSelectedEras,
      selectedRegions,
      setSelectedRegions,
      selectedCountries,
      setSelectedCountries,
      countryOptions,
      playerCount,
      onPlayerCountChange,
      suddenDeathHandSize,
      setSuddenDeathHandSize,
      deckCount,
      isPlayValid,
    },
    buildGameConfig,
  };
}
