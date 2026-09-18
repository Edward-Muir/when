import { act, renderHook } from '@testing-library/react';
import { DailyResult, markHintSeen, resetHintsSeen } from '../utils/playerStorage';
import { recordGameResult } from '../utils/statsStorage';
import { WhenGameState } from '../types';
import { useDailyTabHints } from './useDailyTabHints';
import { DRAG_NUDGE_MS } from './useOnboardingHints';

const noop = jest.fn();

function renderHints(over: { todayResult?: DailyResult | null; onDailyTab?: boolean } = {}) {
  return renderHook(() =>
    useDailyTabHints({
      onDailyTab: over.onDailyTab ?? true,
      todayResult: over.todayResult ?? null,
      board: null,
      onReview: noop,
    })
  );
}

/** A finished daily, so the lifetime counter the nudge gates on is no longer zero. */
function recordADaily() {
  recordGameResult(
    {
      gameMode: 'daily',
      lastConfig: { dailySeed: '2026-01-01' },
      timeline: [],
      placementHistory: [true],
      failedPlacements: [],
      players: [{ id: 0, name: 'P', hand: [], hasWon: false, placementHistory: [true] }],
      winners: [],
      bestStreak: 1,
    } as unknown as WhenGameState,
    new Map()
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const idle = () => act(() => void jest.advanceTimersByTime(DRAG_NUDGE_MS));

describe('the Daily tab first-play nudge', () => {
  it('shows to a player with no daily behind them', () => {
    const { result } = renderHints();
    idle();
    expect(result.current.strip.key).toBe('dailyTab');
    expect(result.current.strip.show).toBe(true);
    expect(result.current.playNudge).toBe(true);
  });

  it('stays away once they have played one, so an upgrade never says "your first"', () => {
    recordADaily();
    const { result } = renderHints();
    idle();
    expect(result.current.strip.show).toBe(false);
  });

  it('comes back for that player after an explicit Reset Hints', () => {
    // The lifetime counter is not something `resetHintsSeen` clears, so without the waiver
    // this is the one hint that would sit out a reset the player explicitly asked for.
    recordADaily();
    markHintSeen('dailyTab');
    const { result } = renderHints();
    idle();
    expect(result.current.strip.show).toBe(false);

    act(() => resetHintsSeen());
    idle();
    expect(result.current.strip.show).toBe(true);
    expect(result.current.strip.key).toBe('dailyTab');
  });

  it('stays away after a reset once today is played, with no Play button to point at', () => {
    const { result } = renderHints({ todayResult: { date: '2026-09-18' } as DailyResult });
    act(() => resetHintsSeen());
    idle();
    expect(result.current.strip.show).toBe(false);
  });
});
