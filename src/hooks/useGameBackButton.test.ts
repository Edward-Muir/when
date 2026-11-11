import { act, renderHook } from '@testing-library/react';
import { useGameBackButton } from './useGameBackButton';
import { registerBackHandler } from '../utils/backStack';
import { leaveGameEntry, resetGameBackEntry } from '../utils/gameBackEntry';

/** jsdom's `history.back()` lands on a later task; wait for its `popstate`. */
function nextPop(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener('popstate', () => resolve(), { once: true });
  });
}

async function pressBack(): Promise<void> {
  const popped = nextPop();
  window.history.back();
  await act(async () => {
    await popped;
  });
}

describe('useGameBackButton', () => {
  beforeEach(() => {
    resetGameBackEntry();
    window.history.replaceState(null, '', '/custom');
  });

  it('adds one history entry for a game, on the same URL', () => {
    const before = window.history.length;
    const { rerender } = renderHook(({ inGame }) => useGameBackButton(inGame), {
      initialProps: { inGame: false },
    });
    expect(window.history.length).toBe(before);

    rerender({ inGame: true });
    expect(window.history.length).toBe(before + 1);
    expect(window.location.pathname).toBe('/custom');

    // A restart stays in the game: no second entry.
    rerender({ inGame: true });
    expect(window.history.length).toBe(before + 1);
  });

  it('runs the top back handler on Back and returns to the game entry', async () => {
    const handler = jest.fn();
    const off = registerBackHandler(handler);
    renderHook(() => useGameBackButton(true));

    const restored = new Promise<void>((resolve) => {
      // The first pop is Back, the second is the forward() that restores the entry.
      let pops = 0;
      const onPop = () => {
        pops += 1;
        if (pops === 2) {
          window.removeEventListener('popstate', onPop);
          resolve();
        }
      };
      window.addEventListener('popstate', onPop);
    });
    await pressBack();
    await act(async () => {
      await restored;
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(window.history.state).toEqual(expect.objectContaining({ whenGame: true }));
    off();
  });

  it('consumes the entry when the game is left by a button, then runs the leave', async () => {
    const handler = jest.fn();
    const off = registerBackHandler(handler);
    renderHook(() => useGameBackButton(true));
    const leave = jest.fn();

    const popped = nextPop();
    leaveGameEntry(leave);
    expect(leave).not.toHaveBeenCalled();
    await act(async () => {
      await popped;
    });

    expect(leave).toHaveBeenCalledTimes(1);
    // Not a Back press: nothing on the stack ran, and the entry is gone.
    expect(handler).not.toHaveBeenCalled();
    expect(window.history.state).toBeNull();
    off();
  });

  it('does not step back onto the entry when the Back press itself left the game', async () => {
    const leave = jest.fn();
    const off = registerBackHandler(() => leaveGameEntry(leave));
    renderHook(() => useGameBackButton(true));

    await pressBack();
    // Time for a stray forward() to land, were there one.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(leave).toHaveBeenCalledTimes(1);
    expect(window.history.state).toBeNull();
    off();
  });

  it('leaves at once when there is no game entry to consume', () => {
    const leave = jest.fn();
    leaveGameEntry(leave);
    expect(leave).toHaveBeenCalledTimes(1);
  });
});
