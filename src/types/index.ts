export type Category =
  | 'empires'
  | 'revolution'
  | 'architecture'
  | 'writing'
  | 'invention'
  | 'figures'
  | 'media'
  | 'craft'
  | 'diplomacy'
  | 'disasters'
  | 'commerce'
  | 'law'
  | 'agriculture'
  | 'warfare'
  | 'science'
  | 'trade'
  | 'migration'
  | 'art'
  | 'medicine'
  | 'nature'
  | 'sports';

export const ALL_CATEGORIES: Category[] = [
  'empires',
  'revolution',
  'architecture',
  'writing',
  'invention',
  'figures',
  'media',
  'craft',
  'diplomacy',
  'disasters',
  'commerce',
  'law',
  'agriculture',
  'warfare',
  'science',
  'trade',
  'migration',
  'art',
  'medicine',
  'nature',
  'sports',
];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'very-hard';

export const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'very-hard'];

// All four difficulties are in play. 'very-hard' used to be excluded as a blunt way
// to stop decks being punishing, but the deck builder now places those events where
// they belong — ~1% of opening cards and ~22% by the end of the ramp — and including
// them measurably *increases* the variety a player sees over a year.
export const DEFAULT_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'very-hard'];

export type Era =
  | 'prehistory'
  | 'ancient'
  | 'medieval'
  | 'earlyModern'
  | 'industrial'
  | 'worldWars'
  | 'coldWar'
  | 'modern';

/**
 * Both modes run the same sudden-death mechanics (draw on correct, hand shrinks on a
 * miss, game over when the hand empties); they differ only in how the deck is built.
 * `daily` is seeded from the calendar date, `suddenDeath` from the Custom page's filters.
 *
 * There is no mode picker in the UI, and no third rule-set: a `freeplay` mode (empty
 * your hand to win, draw a replacement on a miss) existed until it was removed, having
 * become unreachable. Legacy share links still carry its bit — see `challengeCode.ts`.
 */
export type GameMode = 'daily' | 'suddenDeath';

export interface EraDefinition {
  id: Era;
  name: string;
  startYear: number;
  endYear: number;
}

export interface HistoricalEvent {
  name: string; // Internal ID (e.g., "wwi-end")
  friendly_name: string; // Display name (e.g., "World War I Ends")
  year: number;
  category: Category;
  description: string;
  difficulty: Difficulty;
  image_url?: string; // Optional Wikipedia thumbnail URL
  image_width?: number; // Image width in pixels
  image_height?: number; // Image height in pixels
  color?: string; // Dominant color extracted from image, e.g. "#8B4513"
  text_color?: 'light' | 'dark'; // Whether to use light or dark text on this color
}

export interface Player {
  id: number;
  name: string;
  hand: HistoricalEvent[];
  hasWon: boolean;
  winTurn?: number;
  isEliminated?: boolean;
  eliminatedRound?: number;
  placementHistory: boolean[];
}

export type GamePhase = 'loading' | 'modeSelect' | 'transitioning' | 'playing' | 'gameOver';

export interface PlacementResult {
  success: boolean;
  event: HistoricalEvent;
  correctPosition: number;
  attemptedPosition: number;
}

export type AnimationPhase = 'flash' | 'moving' | null;

/** A card that was placed incorrectly — shown as a display-only tombstone at its true position. */
export interface FailedPlacement {
  event: HistoricalEvent;
  /** Timeline index the player attempted at the time of the miss (animation origin). */
  attemptedPosition: number;
  /** Turn number of the miss; stable ordering for equal-year tombstones. */
  seq: number;
}

export type GamePopupType = 'description' | 'correct' | 'incorrect' | 'gameOver';

export interface GamePopupData {
  type: GamePopupType;
  event: HistoricalEvent | null;
  nextPlayer?: Player;
  gameState?: WhenGameState;
}

export interface WhenGameState {
  phase: GamePhase;
  gameMode: GameMode | null;
  timeline: HistoricalEvent[];
  /** `name` of the initial seed event (excluded from per-game placement counts). */
  seedEventName?: string;
  deck: HistoricalEvent[];
  placementHistory: boolean[];
  /** Incorrectly placed cards, shown as tombstones at their true position (ignored by placement rules). */
  failedPlacements: FailedPlacement[];
  lastPlacementResult: PlacementResult | null;
  isAnimating: boolean;
  animationPhase: AnimationPhase;
  lastConfig: GameConfig | null;

  // Player state (single player = 1 player)
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  roundNumber: number;
  winners: Player[];
  activePlayersAtRoundStart: number;

  // Streak tracking (consecutive correct placements)
  currentStreak: number;
  bestStreak: number;
}

export interface EventManifest {
  files: string[];
}

export interface GameConfig {
  mode: GameMode;
  totalTurns: number;
  selectedDifficulties: Difficulty[];
  selectedCategories: Category[];
  selectedEras: Era[];
  dailySeed?: string;

  /**
   * An Archive replay of a curated theme: the deck is dealt from that theme's pool only. The
   * mode stays `suddenDeath` — a replay is a custom game with a hand-picked pool, and it must
   * not touch the daily's result, streak or leaderboard. See src/utils/themeReplay.ts.
   */
  curatedThemeId?: string;

  // Challenge mode (shareable seeded games)
  challengeSeed?: string; // Seed string for deterministic shuffle (the challenge code itself)
  challengeCode?: string; // The 3-word challenge code for display/sharing

  // Multiplayer settings
  playerCount?: number;
  playerNames?: string[];
  cardsPerHand?: number;

  // Sudden death settings
  suddenDeathHandSize?: number; // 1-7 cards in hand for sudden death mode (default 5)
}
