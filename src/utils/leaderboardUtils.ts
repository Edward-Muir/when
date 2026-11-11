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
export function podiumPlaces(
  entries: readonly LeaderboardEntry[]
): (entry: LeaderboardEntry) => number {
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

/** "1st", "2nd", "3rd", "4th", "11th", "22nd". */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * The player's place on today's board as the closing card says it: "3rd of 16 today".
 *
 * Numbered exactly as the player's own row is (`LeaderboardSubmit`): the server's row for the
 * caller via `resolvePlayerRow`, placed by `podiumPlaces`, so a tie reads the shared place the
 * row shows rather than the server's sequential rank. Null when the player has no place, which
 * is every game without a board (Custom, the Archive) and a Daily not yet submitted.
 *
 * The share keeps the server's rank (`shareResults`); this line is for the player, beside the
 * row they have just seen.
 */
export function playerPlaceLine(
  entries: readonly LeaderboardEntry[],
  playerRank: number | null,
  playerEntry: LeaderboardEntry | null,
  totalPlayers: number | null
): string | null {
  const { row } = resolvePlayerRow(entries, playerRank, playerEntry);
  const own = row ?? entries.find((entry) => entry.rank === playerRank) ?? null;
  const place = own ? podiumPlaces(entries)(own) : playerRank;
  if (place === null) return null;
  return totalPlayers ? `${ordinal(place)} of ${totalPlayers} today` : `${ordinal(place)} today`;
}
