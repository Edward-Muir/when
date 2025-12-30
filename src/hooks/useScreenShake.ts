import { useState, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';

type ShakeIntensity = 'light' | 'medium' | 'heavy';

const SHAKE_DURATIONS: Record<ShakeIntensity, number> = {
  light: 200,
  medium: 300,
  heavy: 400,
};

export function useScreenShake() {
  const [shake, setShake] = useState<ShakeIntensity | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const triggerShake = useCallback(
    (intensity: ShakeIntensity = 'medium') => {
      // Respect reduced motion preference
      if (shouldReduceMotion) return;

      setShake(intensity);
      const duration = SHAKE_DURATIONS[intensity];
      setTimeout(() => setShake(null), duration);
    },
    [shouldReduceMotion]
  );

  const shakeClassName = shake ? `animate-shake-${shake}` : '';

  return { shake, shakeClassName, triggerShake };
}
