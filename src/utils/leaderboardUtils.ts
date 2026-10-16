import type { PortraitSize } from '../components/ui/Portrait';
import { LeaderboardEntry } from '../hooks/useLeaderboard';

/**
 * The podium's frame colour for a rank's portrait, or null past third. The board marks the top
 * three by framing their portrait rather than with medal emoji beside it (LeaderboardRow).
 */
export function getMedalColor(rank: number): string | null {
  switch (rank) {
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

export interface PodiumStyle {
  portrait: PortraitSize;
  /** Vertical padding: the podium rows are a little taller. */
  pad: string;
  name: string;
  score: string;
}

// Literal strings so Tailwind's JIT sees them. Used by LeaderboardRow, and by LeaderboardSkeleton
// so the loading rows are the height the loaded ones will be.
// The steps are deliberately gentle (60, 52, 48, then 44px): enough to lead the eye to first
// place without the podium shouting over the rest of the board.
const PODIUM: readonly PodiumStyle[] = [
  { portrait: 'md3', pad: 'py-2.5', name: 'font-semibold', score: 'text-2xl' },
  { portrait: 'md2', pad: 'py-2.5', name: '', score: 'text-xl' },
  { portrait: 'md1', pad: 'py-2', name: '', score: 'text-xl' },
];
const FIELD: PodiumStyle = { portrait: 'md', pad: 'py-2', name: '', score: 'text-lg' };

/** First place is the largest, then second, then third; everyone else shares one size. */
export function podiumStyle(rank: number): PodiumStyle {
  return (rank >= 1 ? PODIUM.at(rank - 1) : undefined) ?? FIELD;
}
