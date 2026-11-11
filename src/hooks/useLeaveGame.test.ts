import { act, renderHook } from '@testing-library/react';
import { leaveAction, useLeaveGame } from './useLeaveGame';
import { clearHomeNotice, readHomeNotice } from '../utils/homeNotice';
import { runTopBackHandler } from '../utils/backStack';

const playing = { phase: 'playing', isReview: false } as const;

describe('leaveAction', () => {
  it('leaves a Daily in progress with a saved notice', () => {
    expect(leaveAction({ ...playing, gameMode: 'daily' })).toBe('saved');
  });

  it('asks before leaving a Custom or Archive game', () => {
    expect(leaveAction({ ...playing, gameMode: 'suddenDeath' })).toBe('confirm');
  });

  it('just leaves a finished game or a board being re-read', () => {
    expect(leaveAction({ gameMode: 'suddenDeath', phase: 'gameOver', isReview: false })).toBe(
      'leave'
    );
    expect(leaveAction({ gameMode: 'daily', phase: 'gameOver', isReview: true })).toBe('leave');
  });
});

describe('useLeaveGame', () => {
  beforeEach(() => clearHomeNotice());

  it('leaves a Daily at once and leaves the notice for the home screen', () => {
    const onLeave = jest.fn();
    const { result } = renderHook(() => useLeaveGame({ ...playing, gameMode: 'daily' }, onLeave));

    act(() => result.current.requestHome());

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(result.current.confirmOpen).toBe(false);
    expect(readHomeNotice()).toBe('saved');
  });

  it('opens the confirm for a Custom game, and leaves nothing behind', () => {
    const onLeave = jest.fn();
    const { result } = renderHook(() =>
      useLeaveGame({ ...playing, gameMode: 'suddenDeath' }, onLeave)
    );

    act(() => result.current.requestHome());
    expect(result.current.confirmOpen).toBe(true);
    expect(onLeave).not.toHaveBeenCalled();
    expect(readHomeNotice()).toBeNull();

    act(() => result.current.closeConfirm());
    expect(result.current.confirmOpen).toBe(false);
  });

  it('is what the system Back gesture runs when nothing else is open', () => {
    const onLeave = jest.fn();
    const { unmount } = renderHook(() => useLeaveGame({ ...playing, gameMode: 'daily' }, onLeave));

    act(() => {
      runTopBackHandler();
    });
    expect(onLeave).toHaveBeenCalledTimes(1);

    unmount();
    expect(runTopBackHandler()).toBe(false);
  });
});
