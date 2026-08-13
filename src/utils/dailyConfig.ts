import { GameConfig, HistoricalEvent, DEFAULT_DIFFICULTIES } from '../types';
import { getDailyTheme, getThemedCategories, getThemedEras } from './dailyTheme';
import { buildRampedDeck } from './deckBuilder';
import { buildDailyPool } from './dailyPool';
import { getRecentDailyCardNames } from './dailyRecency';
import { getLocalDateString } from './puzzleDate';

/**
 * Build the GameConfig for today's daily challenge.
 * Shared between ModeSelect (manual start) and /daily route (auto-start).
 */
export function buildDailyConfig(): GameConfig {
  const dailySeed = getLocalDateString();
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
 * Today's daily deck, in dealing order. Mirrors the seeding pipeline gameplay uses
 * (`useWhenGame`: same filters, same composed deck), so index 0 is the starting timeline
 * card and the cards after it are what the hand is dealt from.
 *
 * `dateString` (local YYYY-MM-DD) defaults to today; callers can pass an explicit date so
 * memoization deps stay visible to the linter and results refresh on day rollover.
 */
export function buildDailyDeck(
  allEvents: HistoricalEvent[],
  dateString: string = getLocalDateString()
): HistoricalEvent[] {
  return buildRampedDeck(buildDailyPool(allEvents, dateString), dateString, {
    allEvents,
    exclude: getRecentDailyCardNames(allEvents, dateString),
  });
}

/**
 * Get the first card of today's daily deck, for previewing on the mode-select screen.
 * Returns null if no events qualify.
 */
export function getDailyPreviewEvent(
  allEvents: HistoricalEvent[],
  dateString: string = getLocalDateString()
): HistoricalEvent | null {
  return buildDailyDeck(allEvents, dateString)[0] ?? null;
}
