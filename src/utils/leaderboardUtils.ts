import { LeaderboardEntry } from '../hooks/useLeaderboard';

/**
 * The podium's frame colour for a place's portrait, or null past third. The board marks the top
 * three by framing their portrait rather than with medal emoji beside it (LeaderboardRow).
 */
export function getMedalColor(place: number): string | null {
  switch (place) {
    case 1:
      return '#d4a72c';
    case 2:
      return '#aeb4bc';
    case 3:
      return '#b8733d';
    default:
      return null;
  }
}

/**
 * Each row's place, which decides its number, frame and size. Tied scores share the place of the
 * first row with that score (standard competition ranking), so scores 11, 9, 7, 7, 7 read 1, 2,
 * 3, 3, 3 and are framed gold, silver, bronze, bronze, bronze. A row whose score is not in
 * `entries` (the player below a capped slice) keeps its own rank.
 */
export function podiumPlaces(entries: LeaderboardEntry[]): (entry: LeaderboardEntry) => number {
  const firstRank = new Map<number, number>();
  for (const { correctCount, rank } of entries) {
    const seen = firstRank.get(correctCount);
    if (seen === undefined || rank < seen) firstRank.set(correctCount, rank);
  }
  return (entry) => Math.min(entry.rank, firstRank.get(entry.correctCount) ?? entry.rank);
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
