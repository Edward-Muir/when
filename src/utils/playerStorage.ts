/**
 * localStorage utilities for tracking player data:
 * - Daily game completion (Wordle-style play-once-per-day)
 * - First-time mode plays (for showing rules popup)
 */

import { GameMode, Difficulty, Category, Era } from '../types';

// --- Daily Result Storage ---

export interface DailyResult {
  date: string; // YYYY-MM-DD
  theme: string; // Theme display name
  won: boolean;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string; // For display
  bestStreak?: number; // Best consecutive correct placements
  // Leaderboard data (populated after submission)
  leaderboardRank?: number;
  leaderboardTotalPlayers?: number;
}

const DAILY_RESULT_KEY = 'when-daily-result';

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Save the daily game result to localStorage
 */
export function saveDailyResult(result: DailyResult): void {
  try {
    localStorage.setItem(DAILY_RESULT_KEY, JSON.stringify(result));
  } catch {
    // localStorage may be disabled or full - fail silently
    console.warn('Failed to save daily result to localStorage');
  }
}

/**
 * Get today's daily result if it exists
 * Returns null if no result for today or if date doesn't match
 */
export function getTodayResult(): DailyResult | null {
  try {
    const stored = localStorage.getItem(DAILY_RESULT_KEY);
    if (!stored) return null;

    const result: DailyResult = JSON.parse(stored);

    // Only return if the stored result is for today
    if (result.date === getTodayDateString()) {
      return result;
    }

    return null;
  } catch {
    // localStorage may be disabled or data corrupted - fail silently
    return null;
  }
}

/**
 * Check if the daily game has been played today
 */
export function hasPlayedToday(): boolean {
  return getTodayResult() !== null;
}

// --- Modes Played Storage ---

interface ModesPlayed {
  daily?: boolean;
  suddenDeath?: boolean;
  freeplay?: boolean;
}

const MODES_PLAYED_KEY = 'when-modes-played';

function getModePlayed(data: ModesPlayed, mode: GameMode): boolean {
  switch (mode) {
    case 'daily':
      return data.daily === true;
    case 'suddenDeath':
      return data.suddenDeath === true;
    case 'freeplay':
      return data.freeplay === true;
  }
}

/**
 * Check if a game mode has been played before (for first-time rules popup)
 */
export function hasPlayedMode(mode: GameMode): boolean {
  try {
    const stored = localStorage.getItem(MODES_PLAYED_KEY);
    if (!stored) return false;
    const data: ModesPlayed = JSON.parse(stored);
    return getModePlayed(data, mode);
  } catch {
    return false;
  }
}

function setModePlayed(data: ModesPlayed, mode: GameMode): ModesPlayed {
  switch (mode) {
    case 'daily':
      return { ...data, daily: true };
    case 'suddenDeath':
      return { ...data, suddenDeath: true };
    case 'freeplay':
      return { ...data, freeplay: true };
  }
}

/**
 * Mark a game mode as having been played
 */
export function markModePlayed(mode: GameMode): void {
  try {
    const stored = localStorage.getItem(MODES_PLAYED_KEY);
    const data: ModesPlayed = stored ? JSON.parse(stored) : {};
    const updated = setModePlayed(data, mode);
    localStorage.setItem(MODES_PLAYED_KEY, JSON.stringify(updated));
  } catch {
    console.warn('Failed to save modes played to localStorage');
  }
}

// --- Timeline High Score Storage ---

const TIMELINE_HIGH_SCORE_KEY = 'when-timeline-high-score';

/**
 * Get the high score for Sudden Death mode (longest timeline)
 */
export function getTimelineHighScore(): number {
  try {
    const stored = localStorage.getItem(TIMELINE_HIGH_SCORE_KEY);
    if (!stored) return 0;
    return parseInt(stored, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Save a new high score if it beats the current record
 * @returns true if a new record was set
 */
export function saveTimelineHighScore(score: number): boolean {
  try {
    const currentBest = getTimelineHighScore();
    if (score > currentBest) {
      localStorage.setItem(TIMELINE_HIGH_SCORE_KEY, score.toString());
      return true;
    }
    return false;
  } catch {
    console.warn('Failed to save timeline high score to localStorage');
    return false;
  }
}

// --- Display Name Storage ---

const DISPLAY_NAME_KEY = 'when-display-name';

/**
 * Get the saved display name for leaderboard submissions
 */
export function getDisplayName(): string {
  try {
    return localStorage.getItem(DISPLAY_NAME_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Save the display name for future leaderboard submissions
 */
export function saveDisplayName(name: string): void {
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, name);
  } catch {
    console.warn('Failed to save display name to localStorage');
  }
}

// --- Leaderboard Submission Tracking ---

const LEADERBOARD_SUBMITTED_KEY = 'when-leaderboard-submitted';

/**
 * Check if leaderboard submission was made for today's daily
 */
export function hasSubmittedToLeaderboard(): boolean {
  try {
    const stored = localStorage.getItem(LEADERBOARD_SUBMITTED_KEY);
    if (!stored) return false;
    // Only return true if it was submitted for today
    return stored === getTodayDateString();
  } catch {
    return false;
  }
}

/**
 * Mark that leaderboard submission was made for today
 */
export function markLeaderboardSubmitted(): void {
  try {
    localStorage.setItem(LEADERBOARD_SUBMITTED_KEY, getTodayDateString());
  } catch {
    console.warn('Failed to save leaderboard submission status');
  }
}

/**
 * Update today's daily result with leaderboard ranking data
 */
export function updateDailyResultWithLeaderboard(rank: number, totalPlayers: number): void {
  try {
    const result = getTodayResult();
    if (result) {
      const updated: DailyResult = {
        ...result,
        leaderboardRank: rank,
        leaderboardTotalPlayers: totalPlayers,
      };
      localStorage.setItem(DAILY_RESULT_KEY, JSON.stringify(updated));
    }
  } catch {
    console.warn('Failed to update daily result with leaderboard data');
  }
}

// --- Custom Game Settings Storage ---

/**
 * The player's last Custom-game configuration, persisted so their tuned filters/mode
 * survive a refresh. The random deck seed is intentionally NOT stored — it is generated
 * fresh per play, so reloading keeps the settings but still produces a different game.
 */
export interface CustomSettings {
  isSuddenDeath: boolean;
  selectedDifficulties: Difficulty[];
  selectedCategories: Category[];
  selectedEras: Era[];
  playerCount: number;
  cardsPerHand: number;
  suddenDeathHandSize: number;
}

const CUSTOM_SETTINGS_KEY = 'when-custom-settings';

/**
 * Save the player's Custom-game settings to localStorage.
 */
export function saveCustomSettings(settings: CustomSettings): void {
  try {
    localStorage.setItem(CUSTOM_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be disabled or full - fail silently
    console.warn('Failed to save custom settings to localStorage');
  }
}

const isNonEmptyArray = (value: unknown): boolean => Array.isArray(value) && value.length > 0;

/**
 * Get the player's saved Custom-game settings, or null if none/corrupted.
 * Returns null on any validation failure so callers fall back to defaults.
 */
export function getCustomSettings(): CustomSettings | null {
  try {
    const stored = localStorage.getItem(CUSTOM_SETTINGS_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<CustomSettings>;

    // Validate: filters must be non-empty arrays, numbers must be finite, mode a boolean.
    if (
      typeof parsed.isSuddenDeath !== 'boolean' ||
      !isNonEmptyArray(parsed.selectedDifficulties) ||
      !isNonEmptyArray(parsed.selectedCategories) ||
      !isNonEmptyArray(parsed.selectedEras) ||
      !Number.isFinite(parsed.playerCount) ||
      !Number.isFinite(parsed.cardsPerHand) ||
      !Number.isFinite(parsed.suddenDeathHandSize)
    ) {
      return null;
    }

    return parsed as CustomSettings;
  } catch {
    // localStorage may be disabled or data corrupted - fail silently
    return null;
  }
}
