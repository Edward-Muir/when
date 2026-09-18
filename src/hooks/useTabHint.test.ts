import { act, renderHook } from '@testing-library/react';
import { TAB_HINT_MOUNT_DELAY_MS, useTabHint } from './useTabHint';
import { markHintSeen, resetHintsSeen } from '../utils/playerStorage';

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const settle = (ms = TAB_HINT_MOUNT_DELAY_MS) => act(() => void jest.advanceTimersByTime(ms));

describe('useTabHint', () => {
  it('shows once the tab has been active for the delay, and marks it seen', () => {
    const { result, rerender } = renderHook(({ active }) => useTabHint('archiveTab', active), {
      initialProps: { active: true },
    });

    expect(result.current.show).toBe(false);
    settle();
    expect(result.current.show).toBe(true);

    // Leaving the tab hides it, and it does not come back: it has been seen.
    rerender({ active: false });
    expect(result.current.show).toBe(false);
    rerender({ active: true });
    settle();
    expect(result.current.show).toBe(false);
  });

  it('never fires for a tab the player has not opened', () => {
    // The pager pre-mounts every panel at idle, so this is the case `active` exists for.
    const { result } = renderHook(() => useTabHint('archiveTab', false));
    settle();
    expect(result.current.show).toBe(false);
    expect(localStorage.getItem('when-hints-seen')).toBeNull();
  });

  it('re-arms on the menu\'s "Reset Hints", without a remount', () => {
    // "Reset Hints" is reachable from the home screen itself, so the strip has to come back
    // in place. Before the broadcast was wired up here it cleared storage and nothing
    // re-read it, leaving the strips away until a reload.
    markHintSeen('archiveTab');
    const { result } = renderHook(() => useTabHint('archiveTab', true));
    settle();
    expect(result.current.show).toBe(false);

    act(() => resetHintsSeen());
    settle();
    expect(result.current.show).toBe(true);
  });
});
