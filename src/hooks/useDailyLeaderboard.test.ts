import { renderHook, waitFor } from '@testing-library/react';
import { useDailyLeaderboard } from './useDailyLeaderboard';
import { DailyResult } from '../utils/playerStorage';

jest.mock('../utils/deviceFingerprint', () => ({
  getDeviceFingerprint: () => Promise.resolve('test-device'),
}));

const SUBMITTED_KEY = 'when-leaderboard-submitted';

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
    await waitFor(() => expect(localStorage.getItem(SUBMITTED_KEY)).toBe('2026-08-15'));
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
    localStorage.setItem(SUBMITTED_KEY, '2026-08-15');
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
});
