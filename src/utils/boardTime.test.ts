import { eraIndexForYear, formatSpan, markTimeGaps } from './boardTime';

describe('formatSpan', () => {
  it('words the span the way the year labels do', () => {
    expect(formatSpan(1)).toBe('1 year');
    expect(formatSpan(80)).toBe('80 years');
    expect(formatSpan(12000)).toBe('12,000 years');
    expect(formatSpan(2_000_000)).toBe('2 million years');
    expect(formatSpan(1_500_000_000)).toBe('1.5 billion years');
  });
});

describe('markTimeGaps', () => {
  it('returns one entry per gap and nothing for a board of one', () => {
    expect(markTimeGaps([1969])).toEqual([]);
    expect(markTimeGaps([1900, 1910, 1920, 1930])).toHaveLength(3);
  });

  it('judges a jump relative to the board, so a modern board still gets one', () => {
    // Gaps of ~10 years and one of 200: the 200 is 20x the median.
    const marks = markTimeGaps([1800, 1810, 1821, 1830, 2030, 2040]);
    expect(marks.map((m) => m?.label ?? null)).toEqual([null, null, null, '200 years', null]);
  });

  it('does not mark evenly spaced boards at all', () => {
    expect(markTimeGaps([-3000, -2000, -1000, 0, 1000, 2000]).every((m) => m === null)).toBe(true);
  });

  it('ignores gaps under fifty years even when the board is crowded', () => {
    // Median gap is a year; a 40-year gap is 40x that but still nothing to remark on.
    const marks = markTimeGaps([1990, 1991, 1992, 1993, 2033]);
    expect(marks[3]).toBeNull();
  });

  it('uses an absolute bar on a board too small for a median', () => {
    expect(markTimeGaps([1200, 1300])).toEqual([null]);
    expect(markTimeGaps([-500, 1500])[0]?.label).toBe('2,000 years');
  });

  it('scales strength from a third at the bar to full a hundred times over it', () => {
    const marks = markTimeGaps([1900, 1910, 1920, 1930, 3930, 4_003_930]);
    // The bar is 10x the 10-year median (100 years); 2,000 years is 20x over it, so the
    // strength sits log10(20)/2 above the third every marked gap starts from.
    expect(marks[3]?.strength).toBeCloseTo(1 / 3 + Math.log10(20) / 2, 5);
    expect(marks[4]?.strength).toBe(1);
  });

  it('never divides by a zero-year gap', () => {
    expect(() => markTimeGaps([1914, 1914, 1914, 1918, 1945])).not.toThrow();
  });
});

describe('eraIndexForYear', () => {
  it('maps years to the era table and clamps past both ends', () => {
    expect(eraIndexForYear(-4_500_000_000)).toBe(0);
    expect(eraIndexForYear(-5_000_000_000)).toBe(0);
    expect(eraIndexForYear(-3001)).toBe(0);
    expect(eraIndexForYear(-3000)).toBe(1);
    expect(eraIndexForYear(1215)).toBe(2);
    expect(eraIndexForYear(1969)).toBe(6);
    expect(eraIndexForYear(2026)).toBe(7);
    expect(eraIndexForYear(30000)).toBe(7);
  });
});
