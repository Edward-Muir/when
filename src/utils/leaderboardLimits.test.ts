import { DEFAULT_LIMIT, MAX_LIMIT, resolveLimit } from '../../api/leaderboard/limits';

// Tested from src/ because CRA's Jest only roots there — same arrangement as
// botGeneration.test.ts, nameFilter.test.ts and dateWindow.test.ts.

describe('resolveLimit', () => {
  it('falls back to the default when no limit is supplied', () => {
    expect(resolveLimit(undefined)).toBe(DEFAULT_LIMIT);
    expect(resolveLimit('')).toBe(DEFAULT_LIMIT);
  });

  it('falls back to the default for values that are not positive numbers', () => {
    expect(resolveLimit('abc')).toBe(DEFAULT_LIMIT);
    expect(resolveLimit('0')).toBe(DEFAULT_LIMIT);
    expect(resolveLimit('-10')).toBe(DEFAULT_LIMIT);
    expect(resolveLimit(NaN)).toBe(DEFAULT_LIMIT);
  });

  it('honours a caller-supplied limit inside the range', () => {
    expect(resolveLimit('10')).toBe(10);
    expect(resolveLimit(1)).toBe(1);
    expect(resolveLimit(String(MAX_LIMIT))).toBe(MAX_LIMIT);
  });

  it('clamps anything above the ceiling', () => {
    expect(resolveLimit('9999')).toBe(MAX_LIMIT);
    expect(resolveLimit(Number.MAX_SAFE_INTEGER)).toBe(MAX_LIMIT);
  });

  it('keeps the default below the ceiling, so the default can never itself truncate', () => {
    expect(DEFAULT_LIMIT).toBeLessThanOrEqual(MAX_LIMIT);
  });

  it('covers a normal day, which is ~35 submissions plus 7-13 bots', () => {
    expect(DEFAULT_LIMIT).toBeGreaterThan(48);
  });
});
