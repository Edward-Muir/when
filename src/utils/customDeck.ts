import {
  Category,
  Difficulty,
  Era,
  GameConfig,
  HistoricalEvent,
  ALL_CATEGORIES,
  DEFAULT_DIFFICULTIES,
} from '../types';
import { ALL_ERAS } from './eras';
import { ALL_REGIONS } from './regions';
import { filterPool } from './eventLoader';
import { buildRampedDeck } from './deckBuilder';
import { encodeChallengeCode, generateChallengeSeed } from './challengeCode';

/**
 * Everything that decides a Custom deck: the four filter groups, the switched-off countries,
 * and the two hidden controls a share code also carries. A Quick deck preset, the last deck
 * played and the Custom tab's own settings are all one of these, so a tile and the Play button
 * start their games through the same `buildCustomGameConfig`, and the challenge-code encoding
 * never learns about presets.
 */
export interface DeckSettings {
  selectedDifficulties: Difficulty[];
  selectedCategories: Category[];
  selectedEras: Era[];
  selectedRegions: string[];
  excludedCountries: string[];
  playerCount: number;
  suddenDeathHandSize: number;
}

/** The Custom tab's defaults: every option on, one player, a hand of five. */
export const DEFAULT_DECK_SETTINGS: DeckSettings = {
  selectedDifficulties: [...DEFAULT_DIFFICULTIES],
  selectedCategories: [...ALL_CATEGORIES],
  selectedEras: [...ALL_ERAS],
  selectedRegions: [...ALL_REGIONS],
  excludedCountries: [],
  playerCount: 1,
  suddenDeathHandSize: 5,
};

/** The cards a deck's filters select, before the deck builder orders them. */
export function deckPool(allEvents: HistoricalEvent[], settings: DeckSettings): HistoricalEvent[] {
  return filterPool(allEvents, {
    difficulties: settings.selectedDifficulties,
    categories: settings.selectedCategories,
    eras: settings.selectedEras,
    regions: settings.selectedRegions,
    excludedCountries: settings.excludedCountries,
  });
}

/**
 * A fresh Custom game from deck settings, with a new seed packed into its share code. Played
 * as `suddenDeath`, the mode every Custom game uses. `cardsPerHand` is persisted with the
 * settings but dealt only by the daily; `playerNames` stay blank while the players control is
 * hidden, so every player is "Player N".
 */
export function buildCustomGameConfig(
  settings: DeckSettings,
  extras: { cardsPerHand?: number; playerNames?: string[] } = {}
): GameConfig {
  const { playerCount, suddenDeathHandSize } = settings;
  const names = Array.from(
    { length: playerCount },
    (_, i) => extras.playerNames?.at(i)?.trim() || `Player ${i + 1}`
  );
  const challengeCode = encodeChallengeCode({
    handSize: suddenDeathHandSize,
    playerCount,
    difficulties: settings.selectedDifficulties,
    categories: settings.selectedCategories,
    eras: settings.selectedEras,
    regions: settings.selectedRegions,
    excludedCountries: settings.excludedCountries,
    seed: generateChallengeSeed(),
  });

  return {
    mode: 'suddenDeath',
    // Copies, so a game never holds a preset's own arrays.
    selectedDifficulties: [...settings.selectedDifficulties],
    selectedCategories: [...settings.selectedCategories],
    selectedEras: [...settings.selectedEras],
    selectedRegions: [...settings.selectedRegions],
    excludedCountries: [...settings.excludedCountries],
    challengeSeed: challengeCode,
    challengeCode,
    playerCount,
    playerNames: names,
    cardsPerHand: extras.cardsPerHand ?? 7,
    suddenDeathHandSize,
  };
}

/**
 * The starting timeline card a Custom config deals: index 0 of the same ramped deck
 * `useWhenGame` builds from it (the deck is deterministic for its seed). Only the composed
 * window is built, since the tail never moves the first card. Null for an empty pool.
 */
export function startingEventName(config: GameConfig, allEvents: HistoricalEvent[]): string | null {
  const pool = filterPool(allEvents, {
    difficulties: config.selectedDifficulties,
    categories: config.selectedCategories,
    eras: config.selectedEras,
    regions: config.selectedRegions,
    excludedCountries: config.excludedCountries,
  });
  const deck = buildRampedDeck(pool, config.challengeSeed, { allEvents, windowOnly: true });
  return deck[0]?.name ?? null;
}
