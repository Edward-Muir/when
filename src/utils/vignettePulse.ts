import { getStreakFeedback } from './streakFeedback';

// Returns the CSS variable reference for the full-screen placement vignette.
// Incorrect → error red. Correct → streak colour (green → gold by tier),
// reusing the streak-tier system so the pulse tracks the player's streak.
//
// A close-enough hit is still a hit, so it keeps a positive colour, but it takes the
// secondary accent rather than the streak colour: the player should be able to feel that
// something different happened without being told they did worse. The parameter is optional
// and defaults to the old behaviour, so every existing caller and test is unaffected.
export function getVignetteColor(success: boolean, streak: number, closeEnough = false): string {
  if (!success) return 'var(--color-error)';
  if (closeEnough) return 'var(--color-accent-secondary)';
  const { glowIntensity } = getStreakFeedback(streak);
  return glowIntensity === 'golden' ? 'var(--color-accent)' : 'var(--color-success)';
}
