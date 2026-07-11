import { getVignetteColor } from './vignettePulse';

describe('getVignetteColor', () => {
  it('returns error red for an incorrect placement, regardless of streak', () => {
    expect(getVignetteColor(false, 0)).toBe('var(--color-error)');
    expect(getVignetteColor(false, 10)).toBe('var(--color-error)');
  });

  it('returns success green for correct placements below the golden tier (streak 0-3)', () => {
    // Streaks 0-1 map to glowIntensity 'normal', 2-3 to 'bright' — both green.
    expect(getVignetteColor(true, 0)).toBe('var(--color-success)');
    expect(getVignetteColor(true, 1)).toBe('var(--color-success)');
    expect(getVignetteColor(true, 2)).toBe('var(--color-success)');
    expect(getVignetteColor(true, 3)).toBe('var(--color-success)');
  });

  it('escalates to accent gold once the streak reaches the golden tier (streak >= 4)', () => {
    expect(getVignetteColor(true, 4)).toBe('var(--color-accent)');
    expect(getVignetteColor(true, 5)).toBe('var(--color-accent)');
    expect(getVignetteColor(true, 6)).toBe('var(--color-accent)');
    expect(getVignetteColor(true, 12)).toBe('var(--color-accent)');
  });
});
