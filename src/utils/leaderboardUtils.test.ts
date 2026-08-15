import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { getMedalEmoji, getMistakeCount, resolvePlayerRow } from './leaderboardUtils';

const entry = (rank: number, overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  displayName: `Player ${rank}`,
  correctCount: 20 - rank,
  totalAttempts: 20 - rank + 2,
  rank,
  ...overrides,
});

describe('getMedalEmoji', () => {
  it('medals the podium', () => {
    expect(getMedalEmoji(1)).toBe('🥇');
    expect(getMedalEmoji(2)).toBe('🥈');
    expect(getMedalEmoji(3)).toBe('🥉');
  });

  it('returns an empty string past the podium, so the caller falls back to #N', () => {
    expect(getMedalEmoji(4)).toBe('');
    expect(getMedalEmoji(50)).toBe('');
  });
});

describe('getMistakeCount', () => {
  it('derives mistakes from the two counts the server sends', () => {
    expect(getMistakeCount(entry(1, { correctCount: 12, totalAttempts: 15 }))).toBe(3);
  });

  it('never reports a negative count if the two counts disagree', () => {
    expect(getMistakeCount(entry(1, { correctCount: 12, totalAttempts: 9 }))).toBe(0);
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

  // The regression this function exists for: the list is a capped slice, so a player ranked
  // below the cap is absent from `entries` entirely. Searching the slice finds nothing, which
  // is how the game-over preview used to silently drop the player's own row.
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
