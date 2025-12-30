import { useCallback, useMemo } from 'react';

/**
 * Safe vibration that handles unsupported browsers and visibility state
 */
function safeVibrate(pattern: number | number[]) {
  try {
    if ('vibrate' in navigator && document.visibilityState === 'visible') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Silently fail - haptics are enhancement, not critical
  }
}

export function useHaptics() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (isSupported) {
        safeVibrate(pattern);
      }
    },
    [isSupported]
  );

  const haptics = useMemo(
    () => ({
      // UI feedback
      light: () => vibrate(10),
      medium: () => vibrate(25),
      heavy: () => vibrate(50),

      // Semantic feedback
      success: () => vibrate([30, 50, 30]), // Light double-tap
      error: () => vibrate([50, 30, 50, 30, 80]), // Escalating buzz
      warning: () => vibrate([40, 40, 40]), // Triple pulse

      // Game events
      impact: () => vibrate(80),
      drop: () => vibrate([20, 10, 40]),
      select: () => vibrate(15),
    }),
    [vibrate]
  );

  return { isSupported, vibrate, haptics };
}
