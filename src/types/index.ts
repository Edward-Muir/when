export type Category =
  | 'conflict'
  | 'disasters'
  | 'exploration'
  | 'cultural'
  | 'infrastructure'
  | 'diplomatic';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Era =
  | 'prehistory'
  | 'ancient'
  | 'medieval'
  | 'earlyModern'
  | 'industrial'
  | 'worldWars'
  | 'coldWar'
  | 'modern';

export type GameMode = 'daily' | 'suddenDeath' | 'freeplay';

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
  deck: HistoricalEvent[];
  placementHistory: boolean[];
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
}

export interface EventManifest {
  categories: {
    name: Category;
    files: string[];
  }[];
}

export interface GameConfig {
  mode: GameMode;
  totalTurns: number;
  selectedDifficulties: Difficulty[];
  selectedCategories: Category[];
  selectedEras: Era[];
  dailySeed?: string;

  // Multiplayer settings
  playerCount?: number;
  playerNames?: string[];
  cardsPerHand?: number;

  // Sudden death settings
  suddenDeathHandSize?: number; // 1-5 cards in hand for sudden death mode (default 3)
}
