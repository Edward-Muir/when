import { renderHook, act } from '@testing-library/react';
import { useEndOfGameSequence } from './useEndOfGameSequence';
import { GamePhase, GamePopupType } from '../types';

/**
 * The sequence is pure state given its inputs, which is the reason it is a hook rather than
 * more effects in `Game.tsx` — the ordering is the part worth pinning.
 */
function setup(opts: { hasMilestones?: boolean; hasAchievements?: boolean } = {}) {
  const initial = {
    popupType: 'gameOver' as GamePopupType | undefined,
    phase: 'gameOver' as GamePhase,
    hasMilestones: !!opts.hasMilestones,
    hasAchievements: !!opts.hasAchievements,
  };
  const view = renderHook((props) => useEndOfGameSequence(props), { initialProps: initial });
  /** Dismiss the game-over popup, which is what starts the queue. */
  const dismissGameOver = () => view.rerender({ ...initial, popupType: undefined });
  return { ...view, initial, dismissGameOver };
}

describe('useEndOfGameSequence', () => {
  it('does nothing until the game-over popup is dismissed', () => {
    const { result } = setup({ hasMilestones: true, hasAchievements: true });
    expect(result.current.step).toBeNull();
  });

  it('runs milestones, then achievements, then the share', () => {
    const { result, dismissGameOver } = setup({ hasMilestones: true, hasAchievements: true });

    dismissGameOver();
    expect(result.current.step).toBe('milestones');

    act(() => result.current.advance());
    expect(result.current.step).toBe('achievements');

    act(() => result.current.advance());
    expect(result.current.step).toBe('share');

    act(() => result.current.advance());
    expect(result.current.step).toBeNull();
  });

  it('skips milestones when there are none', () => {
    const { result, dismissGameOver } = setup({ hasAchievements: true });
    dismissGameOver();
    expect(result.current.step).toBe('achievements');
  });

  it('skips achievements when there are none', () => {
    const { result, dismissGameOver } = setup({ hasMilestones: true });
    dismissGameOver();
    expect(result.current.step).toBe('milestones');
    act(() => result.current.advance());
    expect(result.current.step).toBe('share');
  });

  it('still ends on the share when the game unlocked nothing', () => {
    // The common case, and the reason the share step is unconditional: the finale is the
    // same screen whether or not anything was earned.
    const { result, dismissGameOver } = setup();
    dismissGameOver();
    expect(result.current.step).toBe('share');
  });

  it('runs once per game, so reopening a popup cannot replay it', () => {
    const { result, rerender, initial } = setup();
    rerender({ ...initial, popupType: undefined });
    act(() => result.current.advance());
    expect(result.current.step).toBeNull();

    // A later popup opening and closing must not start the sequence again.
    rerender({ ...initial, popupType: 'description' });
    rerender({ ...initial, popupType: undefined });
    expect(result.current.step).toBeNull();
  });

  it('re-arms for the next game', () => {
    const { result, rerender, initial } = setup({ hasMilestones: true });
    rerender({ ...initial, popupType: undefined });
    expect(result.current.step).toBe('milestones');

    // New game starts: the queue clears and the once-per-game guard resets.
    rerender({ ...initial, popupType: undefined, phase: 'playing' });
    expect(result.current.step).toBeNull();

    rerender({ ...initial, popupType: 'gameOver', phase: 'gameOver' });
    rerender({ ...initial, popupType: undefined, phase: 'gameOver' });
    expect(result.current.step).toBe('milestones');
  });
});
