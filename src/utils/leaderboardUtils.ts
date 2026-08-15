import { LeaderboardEntry } from '../hooks/useLeaderboard';

export function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

export interface ResolvedPlayerRow {
  /** The player's row, or null when they have not submitted today. */
  row: LeaderboardEntry | null;
  /** True when `row` is present in `entries` and so is already being rendered by the list. */
  inList: boolean;
}

/**
 * Locate the player's own row relative to a rendered slice of the board.
 *
 * Surfaces that show a short slice (top 3) and surfaces that show everything both need to
 * know whether the player is already on screen, so they can decide whether to pin a separate
 * "you" row. Searching `entries` for the rank is not enough on its own: the server caps the
 * list, so a player ranked below the cap is absent from `entries` entirely. The server always
 * sends `playerEntry` for exactly that reason — prefer it, and use `entries` only to answer
 * "is it already visible?".
 */
export function resolvePlayerRow(
  entries: readonly LeaderboardEntry[],
  playerRank: number | null,
  playerEntry: LeaderboardEntry | null
): ResolvedPlayerRow {
  if (playerRank === null && playerEntry === null) {
    return { row: null, inList: false };
  }

  const rank = playerEntry?.rank ?? playerRank;
  const inList = rank !== null && entries.some((entry) => entry.rank === rank);

  return { row: playerEntry, inList };
}
