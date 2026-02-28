import { Capacitor } from '@capacitor/core';

export type StreakTier = 0 | 1 | 2 | 3;

export type GlowIntensity = 'normal' | 'bright' | 'golden';

export interface StreakFeedbackConfig {
  tier: StreakTier;
  // Confetti
  confettiParticles: number;
  confettiForce: number;
  confettiDuration: number;
  confettiWidth: number;
  // Haptic vibration pattern (ms)
  hapticPattern: number[];
  // Timeline card glow
  glowIntensity: GlowIntensity;
  // Ripple wave amplitude multiplier
  rippleMultiplier: number;
  // Bolt icon CSS class (empty string = no animation)
  boltAnimationClass: string;
  // Bolt color class
  boltColorClass: string;
  // Whether the bolt icon is filled (vs outline)
  boltFilled: boolean;
}

// Reduce confetti on native to save memory — canvas particles are expensive on iOS
const isNative = Capacitor.isNativePlatform();
const p = (count: number) => (isNative ? Math.round(count * 0.5) : count);

export function getStreakFeedback(streak: number): StreakFeedbackConfig {
  if (streak >= 6) {
    // Tier 3: 6+ correct in a row
    return {
      tier: 3,
      confettiParticles: p(120),
      confettiForce: 0.9,
      confettiDuration: 3000,
      confettiWidth: 500,
      hapticPattern: [60, 20, 60, 20, 60, 20, 60, 20, 100],
      glowIntensity: 'golden',
      rippleMultiplier: 1.6,
      boltAnimationClass: 'animate-streak-glow',
      boltColorClass: 'text-accent',
      boltFilled: true,
    };
  }

  if (streak >= 4) {
    // Tier 2: 4-5 correct in a row
    return {
      tier: 2,
      confettiParticles: p(90),
      confettiForce: 0.7,
      confettiDuration: 2500,
      confettiWidth: 400,
      hapticPattern: [40, 30, 40, 30, 40, 30, 60],
      glowIntensity: 'golden',
      rippleMultiplier: 1.4,
      boltAnimationClass: 'animate-streak-pulse',
      boltColorClass: 'text-accent',
      boltFilled: true,
    };
  }

  if (streak >= 2) {
    // Tier 1: 2-3 correct in a row
    return {
      tier: 1,
      confettiParticles: p(70),
      confettiForce: 0.65,
      confettiDuration: 2200,
      confettiWidth: 300,
      hapticPattern: [30, 40, 30, 40, 30],
      glowIntensity: 'bright',
      rippleMultiplier: 1.2,
      boltAnimationClass: '',
      boltColorClass: 'text-text-muted',
      boltFilled: true,
    };
  }

  // Tier 0: baseline (0-1 correct)
  return {
    tier: 0,
    confettiParticles: p(50),
    confettiForce: 0.6,
    confettiDuration: 2200,
    confettiWidth: 300,
    hapticPattern: [30, 50, 30],
    glowIntensity: 'normal',
    rippleMultiplier: 1.0,
    boltAnimationClass: '',
    boltColorClass: 'text-text-muted',
    boltFilled: false,
  };
}
