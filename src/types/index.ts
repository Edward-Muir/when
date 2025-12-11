export type Category =
  | 'conflict'
  | 'disasters'
  | 'exploration'
  | 'cultural'
  | 'infrastructure'
  | 'diplomatic';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Era = 'prehistory' | 'ancient' | 'medieval' | 'earlyModern' | 'industrial' | 'worldWars' | 'coldWar' | 'modern';

export type GameMode = 'daily' | 'suddenDeath' | 'freeplay';

export interface EraDefinition {
  id: Era;
  name: string;
  startYear: number;
  endYear: number;
}

export interface HistoricalEvent {
  name: string;           // Internal ID (e.g., "wwi-end")
  friendly_name: string;  // Display name (e.g., "World War I Ends")
  year: number;
  category: Category;
  description: string;
  difficulty: Difficulty;
  image_url?: string;     // Optional Wikipedia thumbnail URL
}

export type GamePhase = 'loading' | 'modeSelect' | 'playing' | 'gameOver';

export interface PlacementResult {
  success: boolean;
  event: HistoricalEvent;
  correctPosition: number;
  attemptedPosition: number;
}

export interface WhenGameState {
  phase: GamePhase;
  gameMode: GameMode | null;
  timeline: HistoricalEvent[];
  activeCard: HistoricalEvent | null;
  deck: HistoricalEvent[];
  currentTurn: number;
  totalTurns: number;
  correctPlacements: number;
  lastPlacementResult: PlacementResult | null;
  isAnimating: boolean;
  lastConfig: GameConfig | null;
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
}
