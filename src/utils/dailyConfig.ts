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
 */
export function getDailyPreviewEvent(allEvents: HistoricalEvent[]): HistoricalEvent | null {
  const dailySeed = new Date().toISOString().split('T')[0];
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
