import { act, renderHook, waitFor } from '@testing-library/react';
import { useDailyLeaderboard } from './useDailyLeaderboard';
import { DailyResult } from '../utils/playerStorage';
import { getLocalDateString } from '../utils/puzzleDate';

jest.mock('../utils/deviceFingerprint', () => ({
  getDeviceFingerprint: () => Promise.resolve('test-device'),
}));

const SUBMITTED_KEY = 'when-leaderboard-submitted';

// playerStorage stamps the submitted-marker with today's *local* date, so the two expectations
// that read it have to move with the clock. RESULT.date below is only ever a board key, which is
// why it can stay a literal. The literal that used to be here passed for one evening: the suite
// landed at 23:46 Pacific on 2026-08-15 and failed every run after midnight.
const TODAY = getLocalDateString();

const RESULT: DailyResult = {
  date: '2026-08-15',
  theme: 'Everything',
  won: false,
  correctCount: 3,
  totalAttempts: 5,
  emojiGrid: '',
};

function mockBoard(body: Record<string, unknown>) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ date: RESULT.date, leaderboard: [], totalPlayers: 29, ...body }),
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  localStorage.clear();
});

describe('useDailyLeaderboard', () => {
  it('treats a server-side rank as submitted, even with no local record', async () => {
    // The regression this hook exists for. The server knows the player by device fingerprint,
    // localStorage by a date string; when they disagreed, the game-over popup's submit gate
    // never opened and the popup could not be dismissed at all.
    expect(localStorage.getItem(SUBMITTED_KEY)).toBeNull();
    mockBoard({ playerRank: 26, playerEntry: null });

    const { result } = renderHook(() => useDailyLeaderboard(RESULT));

    await waitFor(() => expect(result.current.submitted).toBe(true));
    expect(result.current.rank).toBe(26);
  });

  it('heals the local record from the server answer', async () => {
    mockBoard({ playerRank: 26, playerEntry: null });

    renderHook(() => useDailyLeaderboard(RESULT));

    // Writing it back is what stops the submit form flashing on the next game-over popup.
    await waitFor(() => expect(localStorage.getItem(SUBMITTED_KEY)).toBe(TODAY));
  });

  it('is not submitted when the player has no rank on the board', async () => {
    mockBoard({ playerRank: null, playerEntry: null });

    const { result } = renderHook(() => useDailyLeaderboard(RESULT));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.submitted).toBe(false);
    expect(result.current.unavailable).toBe(false);
  });

  it('trusts the local record before the board answers', async () => {
    // Seeded synchronously so a returning player never sees the form flash.
    localStorage.setItem(SUBMITTED_KEY, TODAY);
    mockBoard({ playerRank: null, playerEntry: null });

    const { result } = renderHook(() => useDailyLeaderboard(RESULT));

    expect(result.current.submitted).toBe(true);

    // Let the in-flight fetch settle so it does not update state after the test ends.
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.submitted).toBe(true);
  });

  it('reports unavailable when the board cannot be read', async () => {
    // Drives the popup to a dismissable state: a player who cannot submit must not be trapped.
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    const { result } = renderHook(() => useDailyLeaderboard(RESULT));

    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.submitted).toBe(false);
  });

  it('stays inert without a daily result', () => {
    global.fetch = jest.fn() as unknown as typeof fetch;

    const { result } = renderHook(() => useDailyLeaderboard(null));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.submitted).toBe(false);
  });

  it('reads the board from boardDate when there is no result to submit', async () => {
    // The home screen shows the board to everyone, including players who have not played today.
    // Keying the fetch off the result alone left them looking at a permanently empty board.
    mockBoard({ playerRank: null, playerEntry: null });

    const { result } = renderHook(() =>
      useDailyLeaderboard(null, { boardDate: '2026-08-15', poll: false })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalPlayers).toBe(29);
  });

  it('does not poll when polling is switched off', async () => {
    // The mount fetch resolves the device fingerprint first, so the request only goes out on a
    // microtask — hence the flush before counting. Without it both counts read 0 and the
    // assertion passes whatever the hook does.
    jest.useFakeTimers();
    try {
      mockBoard({ playerRank: null, playerEntry: null });

      renderHook(() => useDailyLeaderboard(RESULT, { poll: false }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Well past several 15s ticks. An idle home screen holding a request loop open all day is
      // the reason this switch exists.
      await act(async () => {
        jest.advanceTimersByTime(120_000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('polls by default', async () => {
    jest.useFakeTimers();
    try {
      mockBoard({ playerRank: null, playerEntry: null });

      renderHook(() => useDailyLeaderboard(RESULT));
      await act(async () => {
        await Promise.resolve();
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(60_000);
      });

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('refreshes a date it was not tracking', async () => {
    // What day rollover needs: `useToday` hands the new date to the callback, and the board has
    // to follow it rather than refetching yesterday.
    mockBoard({ playerRank: null, playerEntry: null });

    const { result } = renderHook(() =>
      useDailyLeaderboard(null, { boardDate: '2026-08-15', poll: false })
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.refresh('2026-08-16');
    });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('2026-08-16'),
        expect.anything()
      )
    );
  });
});
