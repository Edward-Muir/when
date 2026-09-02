import { getThemeOutcome } from './themeOutcome';
import { DAILY_HAND_SIZE } from './dailyConfig';
import { WhenGameState, Player } from '../types';
import { __setCuratedThemesForTest } from './curatedThemes';

// The daily on 2030-01-01 is a curated day for these tests; the outcome only exists on one.
beforeEach(() => {
  __setCuratedThemesForTest([
    { id: 'test-theme', name: 'Test Theme', eventNames: ['a', 'b'], dates: ['2030-01-01'] },
  ]);
});

afterEach(() => {
  __setCuratedThemesForTest(null);
});

function player(): Player {
  return {
    id: 0,
    name: 'Player 1',
    hand: [],
    placementHistory: [],
    isEliminated: true,
    hasWon: false,
  } as unknown as Player;
}

/** `history` is the run's placements: true correct, false a mistake. */
function state(history: boolean[], overrides: Partial<WhenGameState> = {}): WhenGameState {
  return {
    gameMode: 'daily',
    lastConfig: { dailySeed: '2030-01-01' },
    players: [player()],
    placementHistory: history,
    ...overrides,
  } as unknown as WhenGameState;
}

const run = (correct: number, mistakes: number) => [
  ...Array(correct).fill(true),
  ...Array(mistakes).fill(false),
];

describe('getThemeOutcome', () => {
  it('is not survived when the hand emptied on mistakes alone', () => {
    expect(getThemeOutcome(state(run(30, DAILY_HAND_SIZE)))).toEqual({
      survived: false,
      perfect: false,
    });
  });

  /**
   * The only other way a daily can end: the deck ran dry, so correct placements stopped
   * drawing replacements and the hand drained without the player using up all five lives.
   */
  it('is survived when the hand emptied with mistakes to spare', () => {
    expect(getThemeOutcome(state(run(20, DAILY_HAND_SIZE - 1)))).toEqual({
      survived: true,
      perfect: false,
    });
  });

  it('is perfect only with a flawless run', () => {
    expect(getThemeOutcome(state(run(20, 0)))).toEqual({ survived: true, perfect: true });
  });

  it('ignores an ordinary daily that is not a curated theme', () => {
    expect(
      getThemeOutcome(state(run(20, 0), { lastConfig: { dailySeed: '2030-01-02' } as never }))
        .survived
    ).toBe(false);
  });

  /**
   * A Custom filter thin enough to run dry is not a theme, and must not read as one cleared —
   * only a curated pool, on its day or as an Archive replay, has this outcome.
   */
  it('ignores a custom game with no curated theme', () => {
    expect(
      getThemeOutcome(
        state(run(20, 0), {
          gameMode: 'suddenDeath',
          lastConfig: { mode: 'suddenDeath', suddenDeathHandSize: 5 } as never,
        })
      ).survived
    ).toBe(false);
  });

  describe('Archive replay', () => {
    const replay = (history: boolean[], handSize = DAILY_HAND_SIZE) =>
      state(history, {
        gameMode: 'suddenDeath',
        lastConfig: {
          mode: 'suddenDeath',
          curatedThemeId: 'test-theme',
          suddenDeathHandSize: handSize,
        } as never,
      });

    it('survives when the hand emptied with lives to spare', () => {
      expect(getThemeOutcome(replay(run(20, DAILY_HAND_SIZE - 1)))).toEqual({
        survived: true,
        perfect: false,
      });
    });

    it('does not survive when every life was used', () => {
      expect(getThemeOutcome(replay(run(20, DAILY_HAND_SIZE)))).toEqual({
        survived: false,
        perfect: false,
      });
    });

    it('is perfect with no mistakes', () => {
      expect(getThemeOutcome(replay(run(20, 0)))).toEqual({ survived: true, perfect: true });
    });

    it('reads the hand size from the config rather than assuming the daily', () => {
      expect(getThemeOutcome(replay(run(20, 2), 3)).survived).toBe(true);
      expect(getThemeOutcome(replay(run(20, 3), 3)).survived).toBe(false);
    });
  });

  it('ignores a daily with no seed to key it on', () => {
    expect(getThemeOutcome(state(run(20, 0), { lastConfig: null })).survived).toBe(false);
  });

  /**
   * Round reprieves and eliminations break the "hand emptied means five mistakes" arithmetic.
   * No UI reaches multiplayer, but the check should not quietly produce a wrong answer there.
   */
  it('ignores multiplayer', () => {
    expect(getThemeOutcome(state(run(20, 0), { players: [player(), player()] })).survived).toBe(
      false
    );
  });
});
