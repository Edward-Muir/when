import { buildTimelineRows } from './timelineRows';
import { FailedPlacement, HistoricalEvent } from '../types';

function createTestEvent(name: string, year: number): HistoricalEvent {
  return {
    name,
    friendly_name: name,
    year,
    category: 'empires',
    description: 'Test event',
    difficulty: 'medium',
  };
}

function failed(name: string, year: number, seq: number): FailedPlacement {
  return { event: createTestEvent(name, year), attemptedPosition: 0, seq };
}

const timeline = [
  createTestEvent('a', 1800),
  createTestEvent('b', 1850),
  createTestEvent('c', 1900),
];

describe('buildTimelineRows', () => {
  it('returns only event rows with real indices when there are no tombstones', () => {
    const rows = buildTimelineRows(timeline, []);
    expect(rows).toEqual([
      { kind: 'event', event: timeline[0], realIndex: 0 },
      { kind: 'event', event: timeline[1], realIndex: 1 },
      { kind: 'event', event: timeline[2], realIndex: 2 },
    ]);
  });

  it('places a tombstone in its correct gap between real events', () => {
    const miss = failed('x', 1820, 1);
    const rows = buildTimelineRows(timeline, [miss]);
    expect(rows.map((r) => (r.kind === 'event' ? r.event.name : r.failed.event.name))).toEqual([
      'a',
      'x',
      'b',
      'c',
    ]);
    // Real events keep their original indices
    const realIndices = rows.flatMap((r) => (r.kind === 'event' ? [r.realIndex] : []));
    expect(realIndices).toEqual([0, 1, 2]);
    // Tombstone carries the insertion gap it occupies (gap 1 = between a and b)
    expect(rows[1]).toEqual({ kind: 'tombstone', failed: miss, gap: 1 });
  });

  it('places tombstones at both ends of the timeline', () => {
    const before = failed('early', 1700, 1);
    const after = failed('late', 1950, 2);
    const rows = buildTimelineRows(timeline, [before, after]);
    expect(rows.map((r) => (r.kind === 'event' ? r.event.name : r.failed.event.name))).toEqual([
      'early',
      'a',
      'b',
      'c',
      'late',
    ]);
    // End gaps: before the first event is gap 0, after the last is gap events.length
    const gaps = rows.flatMap((r) => (r.kind === 'tombstone' ? [r.gap] : []));
    expect(gaps).toEqual([0, 3]);
  });

  it('orders multiple tombstones in one gap by year then seq', () => {
    const later = failed('later', 1840, 1);
    const earlier = failed('earlier', 1810, 2);
    const tieSeq3 = failed('tie-3', 1840, 3);
    const rows = buildTimelineRows(timeline, [tieSeq3, later, earlier]);
    expect(rows.map((r) => (r.kind === 'event' ? r.event.name : r.failed.event.name))).toEqual([
      'a',
      'earlier',
      'later',
      'tie-3',
      'b',
      'c',
    ]);
    // All three share gap 1
    const gaps = rows.flatMap((r) => (r.kind === 'tombstone' ? [r.gap] : []));
    expect(gaps).toEqual([1, 1, 1]);
  });

  it('handles a tombstone with the same year as a real event', () => {
    const tie = failed('tie', 1850, 1);
    const rows = buildTimelineRows(timeline, [tie]);
    // findCorrectPosition returns the first valid gap (before the equal-year event)
    expect(rows.map((r) => (r.kind === 'event' ? r.event.name : r.failed.event.name))).toEqual([
      'a',
      'tie',
      'b',
      'c',
    ]);
  });

  it('handles an empty timeline', () => {
    const miss = failed('x', 1820, 1);
    const rows = buildTimelineRows([], [miss]);
    expect(rows).toEqual([{ kind: 'tombstone', failed: miss, gap: 0 }]);
  });

  it('handles empty inputs', () => {
    expect(buildTimelineRows([], [])).toEqual([]);
  });
});
