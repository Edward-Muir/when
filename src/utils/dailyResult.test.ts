import { buildDailyResult } from './dailyResult';
import { WhenGameState } from '../types';

function makeState(): WhenGameState {
  return {
    gameMode: 'daily',
    lastConfig: { dailySeed: '2026-08-15' },
    winners: [],
    placementHistory: [true, true, false, true],
  } as unknown as WhenGameState;
}

describe('buildDailyResult', () => {
  it('builds the result for a completed daily', () => {
    const result = buildDailyResult(makeState());

    expect(result).not.toBeNull();
    expect(result?.date).toBe('2026-08-15');
    expect(result?.correctCount).toBe(3);
    expect(result?.totalAttempts).toBe(4);
    expect(result?.won).toBe(false);
  });

  it('marks a win when there is a winner', () => {
    const state = {
      ...makeState(),
      winners: [{ id: '1', name: 'Ed' }],
    } as unknown as WhenGameState;

    expect(buildDailyResult(state)?.won).toBe(true);
  });

  it('returns null for a custom game', () => {
    const state = { ...makeState(), gameMode: 'suddenDeath' } as unknown as WhenGameState;

    expect(buildDailyResult(state)).toBeNull();
  });

  it('returns null without a dailySeed', () => {
    // There is no date to submit against, so there is no leaderboard for this game. Callers
    // read that null as "no submit step", which is what keeps the game-over popup dismissable.
    const state = { ...makeState(), lastConfig: {} } as unknown as WhenGameState;

    expect(buildDailyResult(state)).toBeNull();
  });
});
