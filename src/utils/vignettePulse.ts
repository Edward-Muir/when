import { getStreakFeedback } from './streakFeedback';

// Returns the CSS variable reference for the full-screen placement vignette.
// Incorrect → error red. Correct → streak colour (green → gold by tier),
// reusing the streak-tier system so the pulse tracks the player's streak.
export function getVignetteColor(success: boolean, streak: number): string {
  if (!success) return 'var(--color-error)';
  const { glowIntensity } = getStreakFeedback(streak);
  return glowIntensity === 'golden' ? 'var(--color-accent)' : 'var(--color-success)';
}
