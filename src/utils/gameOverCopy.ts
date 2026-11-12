import { WhenGameState } from '../types';
import { getThemeOutcome } from './themeOutcome';
import { getThemeNameForConfig } from './themeReplay';
import { formatShareDate } from './share';

/** The plain ending. The one title the game-over screen does not show, only announce. */
export const GAME_OVER_TITLE = 'Game Over';

/**
 * What the ending is called: a cleared curated deck, a multiplayer win, or plain "Game Over".
 *
 * Reaching the end of a curated deck is its own outcome and the good one, so it never reads
 * "Game Over". A single player never has a `winner`, which is why the first branch asks
 * `getThemeOutcome` and not the winners list.
 */
export function getGameOverTitle(state: WhenGameState): string {
  const { winners, players } = state;
  if (players.length === 1) {
    const { survived, perfect } = getThemeOutcome(state);
    if (perfect) return 'Perfect Clear!';
    if (survived) return 'Theme Cleared!';
    return GAME_OVER_TITLE;
  }
  if (winners.length === 0) return GAME_OVER_TITLE;
  if (winners.length === 1) return `${winners[0].name} Wins!`;
  const names = winners.map((winner) => winner.name);
  const last = names.pop();
  return `${names.join(', ')} & ${last} Win!`;
}

/**
 * The small line above the score, saying which game this was: "Daily · China",
 * "Hard Currency · Nov 2" for a day played from the Archive, "Custom game", or "2 players".
 *
 * The date is split by `formatShareDate`, never parsed: `new Date('2026-11-02')` is UTC
 * midnight and prints the day before west of Greenwich.
 */
export function getGameOverEyebrow(state: WhenGameState): string {
  const { players, gameMode, lastConfig } = state;
  if (players.length > 1) return `${players.length} players`;
  const theme = getThemeNameForConfig(lastConfig);
  if (gameMode === 'daily') return theme ? `Daily · ${theme}` : 'Daily';
  if (!theme) return 'Custom game';
  const replayDate = lastConfig?.dailyReplayDate;
  return replayDate ? `${theme} · ${formatShareDate(replayDate)}` : theme;
}
