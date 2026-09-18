import { calculatePlacementResult } from './placementLogic';
import { HistoricalEvent } from '../types';

function ev(name: string, year: number, yearEnd?: number): HistoricalEvent {
  return {
    name,
    friendly_name: name,
    year,
    ...(yearEnd === undefined ? {} : { year_end: yearEnd }),
    category: 'empires',
    description: 'Test event',
    difficulty: 'medium',
  };
}

const board = [ev('a', 1100), ev('b', 1366), ev('c', 1500)];

describe('calculatePlacementResult closeEnough', () => {
  it('is false for a strict hit', () => {
    const result = calculatePlacementResult(board, ev('x', 1200), 1);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(false);
  });

  it('is true when only the card’s own range made it pass', () => {
    // 1354 belongs before 1366; the window reaching 1400 is what allows gap 2.
    const result = calculatePlacementResult(board, ev('x', 1354, 1400), 2);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(true);
  });

  it('is false when the same ranged card is placed at its point-year slot', () => {
    const result = calculatePlacementResult(board, ev('x', 1354, 1400), 1);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(false);
  });

  it('is true when a ranged neighbour widened the band for an exact card', () => {
    const ranged = [ev('a', 1100), ev('b', 1200, 1400), ev('c', 1500)];
    const result = calculatePlacementResult(ranged, ev('x', 1366), 1);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(true);
  });

  it('is false on a failure', () => {
    const result = calculatePlacementResult(board, ev('x', 1200, 1250), 3);
    expect(result.success).toBe(false);
    expect(result.closeEnough).toBe(false);
  });

  it('does not wrap to the last card when placing at gap 0', () => {
    // `.at(-1)` would pick up the 1500 card and wrongly mark this close-enough.
    const result = calculatePlacementResult(board, ev('x', 900), 0);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(false);
  });

  it('reports the attempted position alongside the canonical one', () => {
    const result = calculatePlacementResult(board, ev('x', 1354, 1400), 2);
    expect(result.attemptedPosition).toBe(2);
    expect(result.correctPosition).toBe(1);
  });
});
