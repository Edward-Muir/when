import { paperTone } from './paperTone';

describe('paperTone', () => {
  it('runs cool (1) at the present and warm (0) in deep time', () => {
    expect(paperTone(2025)).toBeCloseTo(1, 5);
    expect(paperTone(-8000)).toBeCloseTo(0, 2);
    expect(paperTone(-4_500_000_000)).toBe(0);
  });

  it('is monotonic — a later year is never warmer than an earlier one', () => {
    const years = [-4_500_000_000, -100_000, -3000, -1000, 0, 500, 1000, 1500, 1800, 1950, 2020];
    for (let i = 1; i < years.length; i++) {
      expect(paperTone(years.at(i) ?? 0)).toBeGreaterThanOrEqual(paperTone(years.at(i - 1) ?? 0));
    }
  });

  it('separates every year inside the ramp, so no two eras share a tone', () => {
    const years = [-3000, -1000, 0, 500, 1000, 1500, 1800, 1950, 2020];
    for (let i = 1; i < years.length; i++) {
      expect(paperTone(years.at(i) ?? 0)).toBeGreaterThan(paperTone(years.at(i - 1) ?? 0));
    }
  });

  it('clamps at both ends rather than running off the ramp', () => {
    expect(paperTone(30000)).toBe(1); // the catalogue has an event past the present
    expect(paperTone(-1e9)).toBe(0);
  });

  it('gives the crowded post-1500 half most of the ramp', () => {
    // Half the catalogue is post-1500; a linear scale would leave it all in one sliver.
    expect(paperTone(1500)).toBeGreaterThan(0.3);
    expect(paperTone(1500)).toBeLessThan(0.5);
  });
});
