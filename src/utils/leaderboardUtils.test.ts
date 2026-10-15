import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { getMedalColor, resolvePlayerRow } from './leaderboardUtils';

const entry = (rank: number, overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  displayName: `Player ${rank}`,
  correctCount: 20 - rank,
  rank,
  ...overrides,
});

describe('getMedalColor', () => {
  it('gives the podium three distinct frames', () => {
    const podium = [1, 2, 3].map(getMedalColor);
    expect(podium.every(Boolean)).toBe(true);
    expect(new Set(podium).size).toBe(3);
  });

  it('frames nobody past the podium', () => {
    expect(getMedalColor(4)).toBeNull();
    expect(getMedalColor(50)).toBeNull();
  });
});

describe('resolvePlayerRow', () => {
  const entries = [entry(1), entry(2), entry(3)];

  it('reports the player as in the list when their rank is on screen', () => {
    const playerEntry = entry(2);
    expect(resolvePlayerRow(entries, 2, playerEntry)).toEqual({ row: playerEntry, inList: true });
  });

  it('reports no row when the player has not submitted today', () => {
    expect(resolvePlayerRow(entries, null, null)).toEqual({ row: null, inList: false });
  });

  // Why this function exists: the list is a capped slice, so a player ranked below the cap is
  // absent from `entries` entirely, and searching the slice would silently drop their own row
  // from the game-over preview.
  it('returns the server row for a player ranked below the rendered slice', () => {
    const playerEntry = entry(87);
    const resolved = resolvePlayerRow(entries, 87, playerEntry);
    expect(resolved.inList).toBe(false);
    expect(resolved.row).toBe(playerEntry);
  });

  it('handles an empty board', () => {
    const playerEntry = entry(1);
    expect(resolvePlayerRow([], 1, playerEntry)).toEqual({ row: playerEntry, inList: false });
  });

  it('trusts the server entry rank over a stale playerRank', () => {
    // The board polls every 15s; `rank` and `playerEntry` can briefly disagree mid-refresh.
    const playerEntry = entry(3);
    expect(resolvePlayerRow(entries, 99, playerEntry).inList).toBe(true);
  });
});
