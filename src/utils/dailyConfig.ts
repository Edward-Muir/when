import { GameConfig, HistoricalEvent, DEFAULT_DIFFICULTIES } from '../types';
import { getDailyTheme, getThemedCategories, getThemedEras } from './dailyTheme';
import { filterByDifficulty, filterByCategory, filterByEra } from './eventLoader';
import { shuffleArraySeeded } from './gameLogic';

/**
 * Build the GameConfig for today's daily challenge.
 * Shared between ModeSelect (manual start) and /daily route (auto-start).
 */
export function buildDailyConfig(): GameConfig {
  const dailySeed = new Date().toISOString().split('T')[0];
  const dailyTheme = getDailyTheme(dailySeed);

  return {
    mode: 'daily',
    totalTurns: 7,
    selectedDifficulties: [...DEFAULT_DIFFICULTIES],
    selectedCategories: getThemedCategories(dailyTheme),
    selectedEras: getThemedEras(dailyTheme),
    dailySeed,
    playerCount: 1,
    playerNames: ['Player 1'],
    cardsPerHand: 5,
  };
}

/**
 * Get the first card of today's daily deck, for previewing on the mode-select screen.
 * Mirrors the daily seeding pipeline (same filters + seeded shuffle as gameplay) so the
 * preview matches the real starting event. Returns null if no events qualify.
 *
 * `dateString` (UTC YYYY-MM-DD) defaults to today; callers can pass an explicit date so
 * memoization deps stay visible to the linter and the preview refreshes on day rollover.
 */
export function getDailyPreviewEvent(
  allEvents: HistoricalEvent[],
  dateString: string = new Date().toISOString().split('T')[0]
): HistoricalEvent | null {
  const dailySeed = dateString;
  const dailyTheme = getDailyTheme(dailySeed);

  const filtered = filterByEra(
    filterByCategory(
      filterByDifficulty(allEvents, [...DEFAULT_DIFFICULTIES]),
      getThemedCategories(dailyTheme)
    ),
    getThemedEras(dailyTheme)
  );

  return shuffleArraySeeded(filtered, dailySeed)[0] ?? null;
}
