/**
 * localStorage utilities for tracking daily game completion
 * Implements Wordle-style play-once-per-day restriction
 */

export interface DailyResult {
  date: string; // YYYY-MM-DD
  theme: string; // Theme display name
  won: boolean;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string; // For display
}

const STORAGE_KEY = 'when-daily-result';

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
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
    const stored = localStorage.getItem(STORAGE_KEY);
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
