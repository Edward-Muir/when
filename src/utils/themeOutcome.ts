import { WhenGameState } from '../types';
import { DAILY_HAND_SIZE } from './dailyConfig';
import { getCuratedThemeIdForConfig } from './themeReplay';

/**
 * Whether a finished game on a curated theme ran out of cards rather than out of lives.
 *
 * The game deals a hand and ends when that hand empties. The hand shrinks on a wrong
 * placement, which discards without drawing — and also on a *correct* one when the deck has
 * nothing left to draw (see `processCorrectPlacement`). So a game that ended with fewer
 * mistakes than the hand size can only have got there by emptying the deck.
 *
 * That makes this exact, with no new state to track. What it is NOT is a claim that the
 * player saw every card: a run that draws the last card and then misses five times also
 * exhausts the pool, with five mistakes. The honest reading is "you got through the theme
 * without losing all five", which is why the copy says survived rather than completed.
 *
 * Only reachable on a pool smaller than a full run: a curated theme, on the day it ran as
 * the daily or as an Archive replay. The arithmetic would hold for any single-player pool,
 * but it stays gated to curated themes on purpose — a thin Custom filter that runs dry
 * would otherwise read "Theme Cleared!" for a deck that was never a theme. On an ordinary
 * day the deck is thousands of cards deep and the hand always empties first.
 */
export interface ThemeOutcome {
  /** The deck ran dry: the player got through the whole theme. */
  survived: boolean;
  /** Survived it without a single mistake. */
  perfect: boolean;
}

const NOT_A_THEME: ThemeOutcome = { survived: false, perfect: false };

export function getThemeOutcome(state: WhenGameState): ThemeOutcome {
  const { lastConfig, players, placementHistory } = state;

  // Multiplayer has round reprieves and eliminations, so "the hand emptied" no longer implies
  // a fixed mistake count. No UI reaches it, but the arithmetic below would be wrong there.
  //
  // Optional chaining because callers legitimately hand this partial state — buildDailyResult
  // is reached from tests and from a game that ended before players were seated.
  if (players?.length !== 1 || !lastConfig || !getCuratedThemeIdForConfig(lastConfig)) {
    return NOT_A_THEME;
  }

  // The hand the game was dealt: the daily's fixed size, or the replay's (which pins it to
  // the same number, but read the config rather than assume).
  const handSize =
    lastConfig.mode === 'suddenDeath'
      ? (lastConfig.suddenDeathHandSize ?? DAILY_HAND_SIZE)
      : DAILY_HAND_SIZE;

  const mistakes = (placementHistory ?? []).filter((correct) => !correct).length;
  const survived = mistakes < handSize;

  return { survived, perfect: survived && mistakes === 0 };
}
