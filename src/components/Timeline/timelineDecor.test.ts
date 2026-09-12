import { buildRowDecor, formatGap, gapTicks } from './timelineDecor';
import type { TimelineRow } from '../../utils/timelineRows';
import type { HistoricalEvent } from '../../types';

const ev = (name: string, year: number): HistoricalEvent =>
  ({ name, friendly_name: name, year, category: 'science', difficulty: 'easy' }) as HistoricalEvent;

describe('gapTicks', () => {
  it('is 0 for no gap and one mark per order of magnitude, capped at 6', () => {
    expect(gapTicks(0)).toBe(0);
    expect(gapTicks(-5)).toBe(0);
    expect(gapTicks(1)).toBe(1);
    expect(gapTicks(9)).toBe(1);
    expect(gapTicks(10)).toBe(2);
    expect(gapTicks(100)).toBe(3);
    expect(gapTicks(1000)).toBe(4);
    expect(gapTicks(1e5)).toBe(6);
    expect(gapTicks(1e9)).toBe(6);
  });
});

describe('formatGap', () => {
  it('uses the same tiers as formatYear', () => {
    expect(formatGap(1200)).toBe('+1,200 yrs');
    expect(formatGap(12000)).toBe('+12k yrs');
    expect(formatGap(2500000)).toBe('+2.5M yrs');
    expect(formatGap(3000000)).toBe('+3M yrs');
    expect(formatGap(1.2e9)).toBe('+1.2B yrs');
  });
});

describe('buildRowDecor', () => {
  it('derives era, previous era and the gap from display order, tombstones included', () => {
    const rows: TimelineRow[] = [
      { kind: 'event', event: ev('a', -1184), realIndex: 0 },
      { kind: 'tombstone', failed: { event: ev('t', 800), attemptedPosition: 0, seq: 1 }, gap: 1 },
      { kind: 'event', event: ev('b', 1571), realIndex: 1 },
    ];
    expect(buildRowDecor(rows)).toEqual([
      { era: 'ancient', prevEra: null, gapYears: null },
      { era: 'medieval', prevEra: 'ancient', gapYears: 1984 },
      { era: 'earlyModern', prevEra: 'medieval', gapYears: 771 },
    ]);
  });

  it('returns an empty list for no rows', () => {
    expect(buildRowDecor([])).toEqual([]);
  });
});
