import { buildDailyConfig } from './dailyConfig';

// TZ is pinned to America/Los_Angeles in package.json's `test` script, so the UTC date is
// ahead of the local one from 5pm onward — exactly the window the reported bug lived in.

describe('buildDailyConfig — the puzzle day follows the player, not Greenwich', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const seedAt = (date: Date): string => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
    return buildDailyConfig().dailySeed as string;
  };

  it('hands out ONE puzzle across a single local evening', () => {
    // The reported bug: an LA player at 4pm and again at 6pm was, in UTC, on two different
    // days — two puzzles two hours apart, and a daily streak that incremented twice.
    const fourPm = seedAt(new Date(2026, 7, 10, 16, 0));
    const sixPm = seedAt(new Date(2026, 7, 10, 18, 0));

    expect(fourPm).toBe('2026-08-10');
    expect(sixPm).toBe(fourPm);
  });

  it('rolls over at local midnight', () => {
    expect(seedAt(new Date(2026, 7, 10, 23, 59))).toBe('2026-08-10');
    expect(seedAt(new Date(2026, 7, 11, 0, 1))).toBe('2026-08-11');
  });

  it('does not roll over at UTC midnight', () => {
    // 5pm local is 00:00 UTC the next day — the old boundary.
    const beforeUtcMidnight = new Date(2026, 7, 10, 16, 59);
    const afterUtcMidnight = new Date(2026, 7, 10, 17, 1);
    expect(afterUtcMidnight.toISOString().split('T')[0]).toBe('2026-08-11');
    expect(seedAt(beforeUtcMidnight)).toBe(seedAt(afterUtcMidnight));
  });

  it('keeps the theme consistent with the seed it hands out', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 10, 18, 0));
    const config = buildDailyConfig();
    expect(config.mode).toBe('daily');
    expect(config.dailySeed).toBe('2026-08-10');
    expect(config.selectedCategories.length).toBeGreaterThan(0);
    expect(config.selectedEras.length).toBeGreaterThan(0);
  });
});
