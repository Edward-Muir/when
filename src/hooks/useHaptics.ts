import { useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

/**
 * Web fallback: safe vibration that handles unsupported browsers and visibility state
 */
function webVibrate(pattern: number | number[]) {
  try {
    if ('vibrate' in navigator && document.visibilityState === 'visible') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Silently fail - haptics are enhancement, not critical
  }
}

/**
 * Native: simulate a vibration pattern with sequential impacts.
 * Patterns are [vibrate, pause, vibrate, pause, ...] in ms.
 */
async function nativePatternVibrate(pattern: number[]) {
  for (let i = 0; i < pattern.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const ms = pattern[i];
    if (i % 2 === 0) {
      // Vibrate segment: fire an impact scaled to duration
      await Haptics.impact({
        style: ms >= 50 ? ImpactStyle.Heavy : ms >= 25 ? ImpactStyle.Medium : ImpactStyle.Light,
      });
    }
    // Wait for the duration (whether vibrate or pause)
    if (ms > 0 && i < pattern.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
}

export function useHaptics() {
  const isSupported = isNative || (typeof navigator !== 'undefined' && 'vibrate' in navigator);

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!isSupported) return;

      if (isNative) {
        if (typeof pattern === 'number') {
          Haptics.impact({
            style:
              pattern >= 50
                ? ImpactStyle.Heavy
                : pattern >= 25
                  ? ImpactStyle.Medium
                  : ImpactStyle.Light,
          });
        } else {
          nativePatternVibrate(pattern);
        }
      } else {
        webVibrate(pattern);
      }
    },
    [isSupported]
  );

  const haptics = useMemo(
    () => ({
      // UI feedback
      light: () => {
        if (isNative) Haptics.impact({ style: ImpactStyle.Light });
        else vibrate(10);
      },
      medium: () => {
        if (isNative) Haptics.impact({ style: ImpactStyle.Medium });
        else vibrate(25);
      },
      heavy: () => {
        if (isNative) Haptics.impact({ style: ImpactStyle.Heavy });
        else vibrate(50);
      },

      // Semantic feedback
      success: () => {
        if (isNative) Haptics.notification({ type: NotificationType.Success });
        else vibrate([30, 50, 30]);
      },
      error: () => {
        if (isNative) Haptics.notification({ type: NotificationType.Error });
        else vibrate([50, 30, 50, 30, 80]);
      },
      warning: () => {
        if (isNative) Haptics.notification({ type: NotificationType.Warning });
        else vibrate([40, 40, 40]);
      },

      // Game events
      impact: () => {
        if (isNative) Haptics.impact({ style: ImpactStyle.Heavy });
        else vibrate(80);
      },
      drop: () => {
        if (isNative) Haptics.impact({ style: ImpactStyle.Medium });
        else vibrate([20, 10, 40]);
      },
      select: () => {
        if (isNative) Haptics.selectionChanged();
        else vibrate(15);
      },
    }),
    [vibrate]
  );

  return { isSupported, vibrate, haptics };
}
