import { dayDiff, getLocalDateString, msUntilNextLocalMidnight } from './puzzleDate';

// These tests assume TZ=America/Los_Angeles, pinned in package.json's `test` script. LA is
// deliberately a zone where the local and UTC dates disagree for a large part of the day —
// on a machine running UTC, the local-vs-UTC assertions below would pass vacuously.
const HOUR_MS = 3_600_000;

describe('getLocalDateString', () => {
  it('returns the LOCAL date when UTC has already rolled over', () => {
    // 6pm Aug 11 in LA (UTC-7) is 01:00 Aug 12 in UTC. This is the reported bug: the
    // player is mid-evening on the 11th, but the old UTC seed handed them the 12th.
    const evening = new Date(2026, 7, 11, 18, 0);
    expect(evening.toISOString().split('T')[0]).toBe('2026-08-12');
    expect(getLocalDateString(evening)).toBe('2026-08-11');
  });

  it('does not roll over between 4pm and 6pm — the same puzzle, twice', () => {
    // The concrete double-increment case: two plays two hours apart on one local evening
    // used to straddle a UTC boundary and count as two separate puzzle days.
    expect(getLocalDateString(new Date(2026, 7, 10, 16, 0))).toBe('2026-08-10');
    expect(getLocalDateString(new Date(2026, 7, 10, 18, 0))).toBe('2026-08-10');
  });

  it('rolls over at local midnight, not before', () => {
    expect(getLocalDateString(new Date(2026, 7, 10, 23, 59, 59))).toBe('2026-08-10');
    expect(getLocalDateString(new Date(2026, 7, 11, 0, 0, 0))).toBe('2026-08-11');
  });

  it('zero-pads single-digit months and days', () => {
    expect(getLocalDateString(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });

  it('handles month and year boundaries', () => {
    expect(getLocalDateString(new Date(2026, 6, 31, 12, 0))).toBe('2026-07-31');
    expect(getLocalDateString(new Date(2026, 11, 31, 23, 0))).toBe('2026-12-31');
    expect(getLocalDateString(new Date(2027, 0, 1, 0, 30))).toBe('2027-01-01');
  });

  it('defaults to now', () => {
    expect(getLocalDateString()).toBe(getLocalDateString(new Date()));
  });
});

describe('msUntilNextLocalMidnight', () => {
  it('counts to the next LOCAL midnight, not the next UTC one', () => {
    const at = new Date(2026, 7, 10, 22, 0); // 22:00 local
    expect(msUntilNextLocalMidnight(at)).toBe(2 * HOUR_MS);
  });

  it('lands exactly on the next day at local midnight', () => {
    const at = new Date(2026, 7, 10, 0, 0, 0);
    const landing = new Date(at.getTime() + msUntilNextLocalMidnight(at));
    expect(getLocalDateString(landing)).toBe('2026-08-11');
    expect(landing.getHours()).toBe(0);
    expect(landing.getMinutes()).toBe(0);
  });

  it('is 23 hours across the DST spring-forward day', () => {
    // US DST begins Mar 8 2026: local Mar 8 is only 23 hours long. A modulo over a fixed
    // 86_400_000 would overshoot the boundary by an hour.
    const at = new Date(2026, 2, 8, 0, 0, 0);
    expect(msUntilNextLocalMidnight(at)).toBe(23 * HOUR_MS);
  });

  it('is 25 hours across the DST fall-back day', () => {
    // US DST ends Nov 1 2026: local Nov 1 is 25 hours long.
    const at = new Date(2026, 10, 1, 0, 0, 0);
    expect(msUntilNextLocalMidnight(at)).toBe(25 * HOUR_MS);
  });

  it('always lands on local midnight of the following day, DST or not', () => {
    for (const at of [
      new Date(2026, 2, 8, 13, 27), // spring forward
      new Date(2026, 10, 1, 13, 27), // fall back
      new Date(2026, 11, 31, 23, 59),
    ]) {
      const landing = new Date(at.getTime() + msUntilNextLocalMidnight(at));
      expect(landing.getHours()).toBe(0);
      expect(landing.getMinutes()).toBe(0);
      expect(landing.getSeconds()).toBe(0);
    }
  });

  it('is always positive and never more than 25 hours', () => {
    const ms = msUntilNextLocalMidnight(new Date());
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(25 * HOUR_MS);
  });
});

describe('dayDiff', () => {
  it('measures whole days between date strings', () => {
    expect(dayDiff('2026-06-01', '2026-06-02')).toBe(1);
    expect(dayDiff('2026-06-01', '2026-06-01')).toBe(0);
    expect(dayDiff('2026-06-01', '2026-06-03')).toBe(2);
    expect(dayDiff('2026-06-02', '2026-06-01')).toBe(-1);
  });

  it('crosses month and year boundaries', () => {
    expect(dayDiff('2026-06-30', '2026-07-01')).toBe(1);
    expect(dayDiff('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('is exactly 1 across a DST boundary', () => {
    // Both operands parse as UTC midnight, so a 23- or 25-hour local day cannot round to 0
    // or 2 and silently break a streak.
    expect(dayDiff('2026-03-07', '2026-03-08')).toBe(1);
    expect(dayDiff('2026-03-08', '2026-03-09')).toBe(1);
    expect(dayDiff('2026-10-31', '2026-11-01')).toBe(1);
    expect(dayDiff('2026-11-01', '2026-11-02')).toBe(1);
  });

  it('agrees with getLocalDateString across a DST boundary', () => {
    const before = getLocalDateString(new Date(2026, 10, 1, 20, 0));
    const after = getLocalDateString(new Date(2026, 10, 2, 20, 0));
    expect(dayDiff(before, after)).toBe(1);
  });
});
