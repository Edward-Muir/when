import { getThemeOutcome } from './themeOutcome';
import { DAILY_HAND_SIZE } from './dailyConfig';
import { WhenGameState, Player } from '../types';

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

  it('ignores non-daily games', () => {
    expect(getThemeOutcome(state(run(20, 0), { gameMode: 'suddenDeath' })).survived).toBe(false);
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
