import { useState, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';

type ShakeIntensity = 'light' | 'medium' | 'heavy';

function getShakeDuration(intensity: ShakeIntensity): number {
  switch (intensity) {
    case 'light':
      return 200;
    case 'medium':
      return 300;
    case 'heavy':
      return 400;
  }
}

export function useScreenShake() {
  const [shake, setShake] = useState<ShakeIntensity | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const triggerShake = useCallback(
    (intensity: ShakeIntensity = 'medium') => {
      // Respect reduced motion preference
      if (shouldReduceMotion) return;

      setShake(intensity);
      const duration = getShakeDuration(intensity);
      setTimeout(() => setShake(null), duration);
    },
    [shouldReduceMotion]
  );

  const shakeClassName = shake ? `animate-shake-${shake}` : '';

  return { shake, shakeClassName, triggerShake };
}
