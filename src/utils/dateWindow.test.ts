import {
  isDateWithinSubmissionWindow,
  SUBMISSION_DEDUPE_TTL_SECONDS,
} from '../../lib/leaderboard/dateWindow';

// Tested from src/ because CRA's Jest only roots there — same arrangement as
// nameFilter.test.ts, which imports api/leaderboard/nameFilter.

const NOON_UTC = new Date('2026-08-12T12:00:00Z');

describe('isDateWithinSubmissionWindow', () => {
  it('accepts the server UTC date and one day either side', () => {
    expect(isDateWithinSubmissionWindow('2026-08-11', NOON_UTC)).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-08-12', NOON_UTC)).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-08-13', NOON_UTC)).toBe(true);
  });

  it('rejects two days either side', () => {
    expect(isDateWithinSubmissionWindow('2026-08-10', NOON_UTC)).toBe(false);
    expect(isDateWithinSubmissionWindow('2026-08-14', NOON_UTC)).toBe(false);
  });

  it('accepts the earliest honest submission: UTC+14 opening its day', () => {
    // Kiritimati (UTC+14) starts its Aug 13 at 2026-08-12T10:00Z. Under the old exact-match
    // check that submission was rejected outright.
    expect(isDateWithinSubmissionWindow('2026-08-13', new Date('2026-08-12T10:00:00Z'))).toBe(true);
  });

  it('accepts the latest honest submission: UTC-12 closing its day', () => {
    // Baker Island (UTC-12) is still on Aug 12 until 2026-08-13T11:59Z.
    expect(isDateWithinSubmissionWindow('2026-08-12', new Date('2026-08-13T11:59:00Z'))).toBe(true);
  });

  it('covers the full ~50-hour span a single date string stays in play', () => {
    const opens = new Date('2026-08-12T10:00:00Z'); // UTC+14 begins Aug 13
    const closes = new Date('2026-08-14T11:59:00Z'); // UTC-12 ends Aug 13
    expect(closes.getTime() - opens.getTime()).toBeGreaterThan(49 * 3_600_000);
    expect(isDateWithinSubmissionWindow('2026-08-13', opens)).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-08-13', closes)).toBe(true);
  });

  it('crosses month and year boundaries', () => {
    expect(isDateWithinSubmissionWindow('2026-09-01', new Date('2026-08-31T23:00:00Z'))).toBe(true);
    expect(isDateWithinSubmissionWindow('2026-12-31', new Date('2027-01-01T01:00:00Z'))).toBe(true);
  });

  it('rejects malformed dates', () => {
    for (const bad of ['', 'not-a-date', '2026-8-12', '20260812', '2026-08-12T00:00:00Z']) {
      expect(isDateWithinSubmissionWindow(bad, NOON_UTC)).toBe(false);
    }
  });
});

describe('SUBMISSION_DEDUPE_TTL_SECONDS', () => {
  it('outlives the window a date string stays submittable', () => {
    // If the dedupe key expired first, a device could submit to the same board twice.
    const windowSeconds = 50 * 3_600;
    expect(SUBMISSION_DEDUPE_TTL_SECONDS).toBeGreaterThan(windowSeconds);
  });
});
