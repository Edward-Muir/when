import { renderHook } from '@testing-library/react';
import { HistoricalEvent, WhenGameState } from '../types';
import { useSaveDailyResult } from './useSaveDailyResult';
import { useGameStatsRecorder } from './useGameStatsRecorder';
import { getTodayResult, updateDailyResultWithLeaderboard } from '../utils/playerStorage';
import { getTodayDailyBoard } from '../utils/dailyBoard';
import { getLifetimeStats } from '../utils/statsStorage';
import { getLocalDateString } from '../utils/puzzleDate';

const event = (name: string, year: number): HistoricalEvent =>
  ({ name, year, category: 'science', difficulty: 'easy' }) as HistoricalEvent;

const CATALOGUE = [event('seed-event', 1500), event('placed-card', 1800)];

function finishedDaily(overrides: Partial<WhenGameState> = {}): WhenGameState {
  return {
    phase: 'gameOver',
    gameMode: 'daily',
    timeline: CATALOGUE,
    seedEventName: 'seed-event',
    deck: [],
    placementHistory: [true, false],
    failedPlacements: [],
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: { dailySeed: getLocalDateString(), mode: 'daily' },
    players: [{ id: 0, name: 'Player 1', hand: [], hasWon: false, placementHistory: [] }],
    currentPlayerIndex: 0,
    turnNumber: 2,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: 0,
    bestStreak: 1,
    ...overrides,
  } as unknown as WhenGameState;
}

beforeEach(() => {
  localStorage.clear();
});

describe('the game-over writes, on a played daily', () => {
  it('stores the result and the board', () => {
    renderHook(() => useSaveDailyResult(finishedDaily()));

    expect(getTodayResult()?.correctCount).toBe(1);
    expect(getTodayDailyBoard()?.timeline).toEqual(['seed-event', 'placed-card']);
  });
});

describe('the same writes, on a board reopened for review', () => {
  // Re-entering `gameOver` re-arms every game-over effect. These two write, so both check
  // `isReview` — without the guards, reading yesterday's board back corrupts today's record.
  it('leaves the stored rank alone', () => {
    renderHook(() => useSaveDailyResult(finishedDaily()));
    updateDailyResultWithLeaderboard(7, 400);
    const before = localStorage.getItem('when-daily-result');

    renderHook(() => useSaveDailyResult(finishedDaily({ isReview: true })));

    expect(localStorage.getItem('when-daily-result')).toBe(before);
    expect(getTodayResult()?.leaderboardRank).toBe(7);
  });

  it('does not count the game a second time', () => {
    renderHook(() => useGameStatsRecorder(finishedDaily(), CATALOGUE));
    const played = getLifetimeStats().gamesPlayed.daily;
    expect(played).toBe(1);

    const { result } = renderHook(() =>
      useGameStatsRecorder(finishedDaily({ isReview: true }), CATALOGUE)
    );

    expect(getLifetimeStats().gamesPlayed.daily).toBe(played);
    // And no achievement re-fires, so the end-of-game sequence has nothing to replay.
    expect(result.current.newlyUnlockedAchievements).toEqual([]);
  });
});
