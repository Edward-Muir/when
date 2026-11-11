import { LeaderboardEntry } from '../hooks/useLeaderboard';
import {
  getMedalColor,
  ordinal,
  playerPlaceLine,
  podiumPlaces,
  resolvePlayerRow,
} from './leaderboardUtils';

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

describe('podiumPlaces', () => {
  const board = (scores: number[]): LeaderboardEntry[] =>
    scores.map((correctCount, i) => ({ displayName: `P${i + 1}`, correctCount, rank: i + 1 }));

  it('gives tied scores the place of the first row with that score', () => {
    const entries = board([11, 9, 7, 7, 7, 5]);
    expect(entries.map(podiumPlaces(entries))).toEqual([1, 2, 3, 3, 3, 6]);
  });

  it('skips the places a tie covers, as competition ranking does', () => {
    const entries = board([11, 11, 9, 8]);
    expect(entries.map(podiumPlaces(entries))).toEqual([1, 1, 3, 4]);
  });

  it('keeps the rank of a row whose score is not on the served slice', () => {
    const placeOf = podiumPlaces(board([11, 9, 7]));
    expect(placeOf({ displayName: 'Me', correctCount: 2, rank: 40 })).toBe(40);
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

describe('ordinal', () => {
  it('suffixes like English does, teens included', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111, 112].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '23rd',
      '101st',
      '111th',
      '112th',
    ]);
  });
});

describe('playerPlaceLine', () => {
  it('reads the place and the size of the board', () => {
    const entries = [entry(1), entry(2), entry(3), entry(4)];
    expect(playerPlaceLine(entries, 3, entries[2], 16)).toBe('3rd of 16 today');
  });

  it('gives a tie the shared place the row shows, not the server rank', () => {
    // 11, 9, 7, 7: the server ranks the player 4th, the row numbers them 3rd.
    const entries = [
      entry(1, { correctCount: 11 }),
      entry(2, { correctCount: 9 }),
      entry(3, { correctCount: 7 }),
      entry(4, { correctCount: 7 }),
    ];
    expect(playerPlaceLine(entries, 4, entries[3], 16)).toBe('3rd of 16 today');
  });

  it('places a player below the capped slice from the server row', () => {
    const entries = [entry(1), entry(2), entry(3)];
    expect(playerPlaceLine(entries, 40, entry(40), 120)).toBe('40th of 120 today');
  });

  it('finds the row in the list when the server sent no player entry', () => {
    const entries = [
      entry(1, { correctCount: 11 }),
      entry(2, { correctCount: 9 }),
      entry(3, { correctCount: 9 }),
    ];
    expect(playerPlaceLine(entries, 3, null, 3)).toBe('2nd of 3 today');
  });

  it('drops the count when the board size is unknown', () => {
    expect(playerPlaceLine([entry(1)], 1, entry(1), null)).toBe('1st today');
  });

  it('is null without a place: no board, or not submitted', () => {
    expect(playerPlaceLine([], null, null, null)).toBeNull();
    expect(playerPlaceLine([entry(1), entry(2)], null, null, 2)).toBeNull();
  });
});
