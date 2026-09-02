/**
 * localStorage utilities for tracking player data:
 * - Daily game completion (Wordle-style play-once-per-day)
 * - First-time mode plays (for showing rules popup)
 */

import { GameMode, Difficulty, Category, Era } from '../types';
import { getLocalDateString } from './puzzleDate';

// --- Daily Result Storage ---

export interface DailyResult {
  date: string; // YYYY-MM-DD
  theme: string; // Theme display name
  won: boolean;
  /**
   * The deck ran dry rather than the hand emptying on mistakes — the player got through the
   * whole theme. Separate from `won`, which single-player never sets, rather than a reuse of
   * it: repurposing would make every previously stored result read as cleared.
   */
  cleared?: boolean;
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
    if (result.date === getLocalDateString()) {
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
}

const MODES_PLAYED_KEY = 'when-modes-played';

function getModePlayed(data: ModesPlayed, mode: GameMode): boolean {
  switch (mode) {
    case 'daily':
      return data.daily === true;
    case 'suddenDeath':
      return data.suddenDeath === true;
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

// --- Nav "new" Dot Storage ---

/**
 * Top-bar nav destinations that get a one-time "new" dot until first clicked. (A retired
 * `achievements` key may linger in stored JSON from before the badges moved onto Stats; it
 * is simply never read.)
 */
export type NavKey = 'archive' | 'stats' | 'timeline';

interface NavSeen {
  archive?: boolean;
  stats?: boolean;
  timeline?: boolean;
}

const NAV_SEEN_KEY = 'when-nav-seen';

// Switch-based access (mirrors getModePlayed/setModePlayed) to avoid dynamic key indexing.
function getNavSeen(data: NavSeen, key: NavKey): boolean {
  switch (key) {
    case 'archive':
      return data.archive === true;
    case 'stats':
      return data.stats === true;
    case 'timeline':
      return data.timeline === true;
  }
}

function setNavSeen(data: NavSeen, key: NavKey): NavSeen {
  switch (key) {
    case 'archive':
      return { ...data, archive: true };
    case 'stats':
      return { ...data, stats: true };
    case 'timeline':
      return { ...data, timeline: true };
  }
}

function clearNavSeen(data: NavSeen, key: NavKey): NavSeen {
  switch (key) {
    case 'archive':
      return { ...data, archive: false };
    case 'stats':
      return { ...data, stats: false };
    case 'timeline':
      return { ...data, timeline: false };
  }
}

/**
 * Check whether a nav destination's "new" dot has already been dismissed
 * (i.e. the user has clicked/visited it before).
 */
export function hasSeenNav(key: NavKey): boolean {
  try {
    const stored = localStorage.getItem(NAV_SEEN_KEY);
    if (!stored) return false;
    const data: NavSeen = JSON.parse(stored);
    return getNavSeen(data, key);
  } catch {
    return false;
  }
}

/**
 * Mark a nav destination as seen so its "new" dot no longer shows.
 */
export function markNavSeen(key: NavKey): void {
  try {
    const stored = localStorage.getItem(NAV_SEEN_KEY);
    const data: NavSeen = stored ? JSON.parse(stored) : {};
    localStorage.setItem(NAV_SEEN_KEY, JSON.stringify(setNavSeen(data, key)));
  } catch {
    console.warn('Failed to save nav seen state to localStorage');
  }
}

/**
 * Re-arm a nav destination's "new" dot (e.g. after a new achievement unlocks),
 * so it shows again until the user next visits that page.
 */
export function markNavUnseen(key: NavKey): void {
  try {
    const stored = localStorage.getItem(NAV_SEEN_KEY);
    const data: NavSeen = stored ? JSON.parse(stored) : {};
    localStorage.setItem(NAV_SEEN_KEY, JSON.stringify(clearNavSeen(data, key)));
  } catch {
    console.warn('Failed to save nav seen state to localStorage');
  }
}

// --- Timeline Intro Storage ---

const TIMELINE_INTRO_SEEN_KEY = 'when-timeline-intro-seen';

/**
 * Check if the first-view My Timeline explainer has been shown before.
 */
export function hasSeenTimelineIntro(): boolean {
  try {
    return localStorage.getItem(TIMELINE_INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Mark the My Timeline explainer as seen so it won't auto-show again.
 */
export function markTimelineIntroSeen(): void {
  try {
    localStorage.setItem(TIMELINE_INTRO_SEEN_KEY, '1');
  } catch {
    console.warn('Failed to save timeline intro seen state to localStorage');
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
    return stored === getLocalDateString();
  } catch {
    return false;
  }
}

/**
 * Mark that leaderboard submission was made for today
 */
export function markLeaderboardSubmitted(): void {
  try {
    localStorage.setItem(LEADERBOARD_SUBMITTED_KEY, getLocalDateString());
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

// --- Daily Reminder Storage ---

const DAILY_REMINDER_KEY = 'when-daily-reminder';

/**
 * Whether the player wants the 8am daily-puzzle reminder. Defaults to ON:
 * only an explicit opt-out (value '0') disables it. Intent only — the OS
 * notification permission is a separate gate checked at scheduling time.
 */
export function isDailyReminderEnabled(): boolean {
  try {
    return localStorage.getItem(DAILY_REMINDER_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setDailyReminderEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(DAILY_REMINDER_KEY, enabled ? '1' : '0');
  } catch {
    console.warn('Failed to save daily reminder setting to localStorage');
  }
}

// --- Reminder Priming Storage ---

const REMINDER_PRIMING_KEY = 'when-reminder-priming';

const PRIMING_MAX_DISMISSALS = 3;
const PRIMING_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

interface ReminderPriming {
  dismissedAt: string; // ISO timestamp of the last "Not now"
  count: number; // total dismissals
}

function getReminderPriming(): ReminderPriming | null {
  try {
    const stored = localStorage.getItem(REMINDER_PRIMING_KEY);
    return stored ? (JSON.parse(stored) as ReminderPriming) : null;
  } catch {
    return null;
  }
}

/**
 * Whether the pre-permission priming card ("Get a reminder at 8 AM?") may show:
 * fewer than 3 dismissals and at least 7 days since the last one.
 */
export function shouldShowReminderPriming(now: Date = new Date()): boolean {
  const priming = getReminderPriming();
  if (!priming) return true;
  if (priming.count >= PRIMING_MAX_DISMISSALS) return false;
  const dismissedAt = Date.parse(priming.dismissedAt);
  if (Number.isNaN(dismissedAt)) return true;
  return now.getTime() - dismissedAt >= PRIMING_COOLDOWN_MS;
}

/**
 * Record a "Not now" on the priming card, starting the 7-day cooldown.
 */
export function recordPrimingDismissed(now: Date = new Date()): void {
  try {
    const priming = getReminderPriming();
    const updated: ReminderPriming = {
      dismissedAt: now.toISOString(),
      count: (priming?.count ?? 0) + 1,
    };
    localStorage.setItem(REMINDER_PRIMING_KEY, JSON.stringify(updated));
  } catch {
    console.warn('Failed to save reminder priming state to localStorage');
  }
}

/**
 * Clear priming dismissal state (dev/admin use — /reminder-preview).
 */
export function resetReminderPriming(): void {
  try {
    localStorage.removeItem(REMINDER_PRIMING_KEY);
  } catch {
    console.warn('Failed to clear reminder priming state from localStorage');
  }
}

// --- Custom Game Settings Storage ---

/**
 * The player's last Custom-game configuration, persisted so their tuned filters/mode
 * survive a refresh. The random deck seed is intentionally NOT stored — it is generated
 * fresh per play, so reloading keeps the settings but still produces a different game.
 */
export interface CustomSettings {
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

    // Validate: filters must be non-empty arrays and numbers finite. A retired
    // `isSuddenDeath` key may still be present in older records; it is simply ignored,
    // deliberately not validated, so an old record still restores rather than resetting.
    if (
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
