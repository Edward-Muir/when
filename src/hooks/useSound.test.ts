import { renderHook, act } from '@testing-library/react';
import { useSound } from './useSound';

const SOUND_MUTED_KEY = 'when-sound-muted';

describe('useSound mute persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to sound ON (unmuted) with no stored preference', () => {
    const { result } = renderHook(() => useSound());
    expect(result.current.isMuted).toBe(false);
  });

  it('reads a persisted muted preference on init', () => {
    localStorage.setItem(SOUND_MUTED_KEY, 'true');
    const { result } = renderHook(() => useSound());
    expect(result.current.isMuted).toBe(true);
  });

  it('toggles and persists the muted state to localStorage', () => {
    const { result } = renderHook(() => useSound());

    act(() => result.current.toggleMuted());
    expect(result.current.isMuted).toBe(true);
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe('true');

    act(() => result.current.toggleMuted());
    expect(result.current.isMuted).toBe(false);
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe('false');
  });

  it('survives a remount by reading back the persisted value', () => {
    const { result: firstResult } = renderHook(() => useSound());
    act(() => firstResult.current.toggleMuted());
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe('true');

    const { result: remountedResult } = renderHook(() => useSound());
    expect(remountedResult.current.isMuted).toBe(true);
  });

  it('exposes cue methods that no-op safely without a real AudioContext', () => {
    const { result } = renderHook(() => useSound());
    // jsdom has no AudioContext; the engine must fail silently, not throw.
    expect(() => {
      result.current.sounds.pickup();
      result.current.sounds.correct(5);
      result.current.sounds.miss();
      result.current.sounds.gameOver(8);
      result.current.sounds.personalBest();
      result.current.sounds.unlock();
    }).not.toThrow();
  });
});
