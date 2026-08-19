import { WhenGameState } from '../types';
import { DAILY_HAND_SIZE } from './dailyConfig';

/**
 * Whether a finished daily ran out of cards rather than out of lives.
 *
 * A daily deals a hand of DAILY_HAND_SIZE and ends when that hand empties. The hand shrinks
 * on a wrong placement, which discards without drawing — and also on a *correct* one when
 * the deck has nothing left to draw (see `processCorrectPlacement`). So a game that ended
 * with fewer than DAILY_HAND_SIZE mistakes can only have got there by emptying the deck.
 *
 * That makes this exact, with no new state to track. What it is NOT is a claim that the
 * player saw every card: a run that draws the last card and then misses five times also
 * exhausts the pool, with five mistakes. The honest reading is "you got through the theme
 * without losing all five", which is why the copy says survived rather than completed.
 *
 * Only reachable on a pool smaller than a full run — a curated theme, or a very thin
 * category like `sports`. On an ordinary day the deck is thousands of cards deep and the
 * hand always empties first.
 */
export interface ThemeOutcome {
  /** The deck ran dry: the player got through the whole theme. */
  survived: boolean;
  /** Survived it without a single mistake. */
  perfect: boolean;
}

export function getThemeOutcome(state: WhenGameState): ThemeOutcome {
  const { gameMode, lastConfig, players, placementHistory } = state;

  // Multiplayer has round reprieves and eliminations, so "the hand emptied" no longer implies
  // a fixed mistake count. No UI reaches it, but the arithmetic below would be wrong there.
  //
  // Optional chaining because callers legitimately hand this partial state — buildDailyResult
  // is reached from tests and from a game that ended before players were seated.
  if (gameMode !== 'daily' || !lastConfig?.dailySeed || players?.length !== 1) {
    return { survived: false, perfect: false };
  }

  const mistakes = (placementHistory ?? []).filter((correct) => !correct).length;
  const survived = mistakes < DAILY_HAND_SIZE;

  return { survived, perfect: survived && mistakes === 0 };
}
