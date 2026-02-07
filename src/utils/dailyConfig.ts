import { GameConfig, DEFAULT_DIFFICULTIES } from '../types';
import { getDailyTheme, getThemedCategories, getThemedEras } from './dailyTheme';

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
