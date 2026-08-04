import { useCallback, useEffect, useMemo, useState } from 'react';
import { soundEngine, gameOverKind } from '../utils/soundEngine';

const SOUND_MUTED_KEY = 'when-sound-muted';

/** Read the persisted mute preference. Default: sound ON (unmuted). */
function readMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SOUND_MUTED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Thin sound layer mirroring useHaptics / useTheme. Owns the `when-sound-muted`
 * preference (localStorage, default ON) and exposes a memoized `sounds` object of
 * bound cues that no-op when muted. All synthesis lives in the framework-free
 * soundEngine singleton; this hook is just React glue + persistence.
 */
export function useSound() {
  const [isMuted, setIsMuted] = useState<boolean>(readMuted);

  // Persist + push the mute state into the engine whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_MUTED_KEY, isMuted ? 'true' : 'false');
    } catch {
      // Persistence is best-effort; sound still works this session.
    }
    soundEngine.setMuted(isMuted);
  }, [isMuted]);

  const toggleMuted = useCallback(() => {
    setIsMuted((prev) => {
      // Unmuting is a user gesture — a good moment to unlock the AudioContext.
      if (prev) soundEngine.unlock();
      return !prev;
    });
  }, []);

  const sounds = useMemo(
    () => ({
      /** Unlock the AudioContext inside a user gesture (iOS requirement). */
      unlock: () => soundEngine.unlock(),
      pickup: () => soundEngine.playPickup(),
      correct: (streak: number) => soundEngine.playCorrect(streak),
      miss: () => soundEngine.playMiss(),
      /** Score-driven cadence; kind is derived to match the on-screen title. */
      gameOver: (correctCount: number) => soundEngine.playGameOver(correctCount),
      personalBest: () => soundEngine.playPersonalBest(),
    }),
    []
  );

  return { isMuted, toggleMuted, sounds };
}

export type SoundControls = ReturnType<typeof useSound>['sounds'];

// Re-export so callers can share the score->cadence mapping if they need it.
export { gameOverKind };
