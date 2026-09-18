import {
  isPlacementCorrect,
  isPointPlacementCorrect,
  findCorrectPosition,
  eventStart,
  eventEnd,
  isRangedEvent,
  formatEventYear,
  formatEventYearParts,
  seededRandom,
} from './gameLogic';
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

/** Every gap of `timeline` that accepts `event`. */
function validGaps(timeline: HistoricalEvent[], event: HistoricalEvent): number[] {
  const gaps: number[] = [];
  for (let i = 0; i <= timeline.length; i++) {
    if (isPlacementCorrect(timeline, event, i)) gaps.push(i);
  }
  return gaps;
}

/**
 * The board is readable: there is an assignment of one representative year per card that is
 * non-decreasing left to right. Equivalent to the running-max of starts never overtaking the
 * end at that position.
 */
function isReadable(timeline: HistoricalEvent[]): boolean {
  let runningStart = -Infinity;
  for (const e of timeline) {
    runningStart = Math.max(runningStart, eventStart(e));
    if (runningStart > eventEnd(e)) return false;
  }
  return true;
}

describe('eventEnd clamping', () => {
  it('treats an event with no year_end as a point', () => {
    const e = ev('a', 1500);
    expect(eventStart(e)).toBe(1500);
    expect(eventEnd(e)).toBe(1500);
    expect(isRangedEvent(e)).toBe(false);
  });

  it('uses a year_end greater than year', () => {
    const e = ev('a', 1200, 1400);
    expect(eventEnd(e)).toBe(1400);
    expect(isRangedEvent(e)).toBe(true);
  });

  it.each([
    ['equal to year', 1200],
    ['less than year', 1100],
  ])('clamps a year_end %s back to a point card', (_label, yearEnd) => {
    const e = ev('a', 1200, yearEnd as number);
    expect(eventEnd(e)).toBe(1200);
    expect(isRangedEvent(e)).toBe(false);
  });

  it('clamps a non-finite year_end', () => {
    const e = { ...ev('a', 1200), year_end: NaN };
    expect(eventEnd(e)).toBe(1200);
    expect(isRangedEvent(e)).toBe(false);
  });
});

/**
 * The licence to ship the rule change ahead of any data: on a point-only timeline the
 * running-bound predicate must reproduce the old neighbour rule exactly.
 */
describe('regression: point-only timelines behave exactly as before', () => {
  const oldRule = (timeline: HistoricalEvent[], event: HistoricalEvent, i: number) => {
    const left = i > 0 ? timeline[i - 1] : null;
    const right = i < timeline.length ? timeline[i] : null;
    if (left && event.year < left.year) return false;
    if (right && event.year > right.year) return false;
    return true;
  };

  const timelines: HistoricalEvent[][] = [
    [],
    [ev('a', 1800)],
    [ev('a', 1800), ev('b', 1900)],
    [ev('a', -3000), ev('b', -500), ev('c', 0), ev('d', 1066), ev('e', 2001)],
    [ev('a', 1800), ev('b', 1800), ev('c', 1900)],
    [ev('a', -4500000000), ev('b', -201400000), ev('c', 1969)],
  ];
  const candidates = [-4500000000, -3000, -1000, -500, 0, 500, 1066, 1800, 1850, 1900, 2001, 30000];

  it('agrees with the old neighbour rule on every timeline, gap and candidate', () => {
    for (const timeline of timelines) {
      for (const year of candidates) {
        const card = ev('candidate', year);
        for (let i = 0; i <= timeline.length; i++) {
          expect(isPlacementCorrect(timeline, card, i)).toBe(oldRule(timeline, card, i));
        }
      }
    }
  });

  it('findCorrectPosition still returns the first valid gap', () => {
    const timeline = [ev('a', 1800), ev('b', 1850), ev('c', 1900)];
    expect(findCorrectPosition(timeline, ev('x', 1850))).toBe(1);
    expect(findCorrectPosition(timeline, ev('x', 1700))).toBe(0);
    expect(findCorrectPosition(timeline, ev('x', 1999))).toBe(3);
  });
});

describe('ranged cards', () => {
  const timeline = [ev('a', 1100), ev('b', 1366), ev('c', 1500)];

  it('accepts a ranged card anywhere its window overlaps', () => {
    // 1200-1400 spans the 1366 card, so both sides of it read correctly.
    expect(validGaps(timeline, ev('x', 1200, 1400))).toEqual([1, 2]);
  });

  it('rejects it outside the window', () => {
    const gaps = validGaps(timeline, ev('x', 1200, 1400));
    expect(gaps).not.toContain(0);
    expect(gaps).not.toContain(3);
  });

  it('is unchanged for a point card when nothing around it is ranged', () => {
    expect(validGaps(timeline, ev('x', 1200))).toEqual([1]);
  });

  it('lets a ranged neighbour widen the band for an exact card', () => {
    const ranged = [ev('a', 1100), ev('b', 1200, 1400), ev('c', 1500)];
    // 1366 would only fit gap 2 against a point 1200; the neighbour's window opens gap 1 too.
    expect(validGaps(ranged, ev('x', 1366))).toEqual([1, 2]);
    expect(isPointPlacementCorrect(ranged, ev('x', 1366), 1)).toBe(false);
  });

  it('gives a contiguous band of valid gaps', () => {
    const boards: HistoricalEvent[][] = [
      [ev('a', 1100), ev('b', 1200, 1400), ev('c', 1500)],
      [ev('a', -500, -200), ev('b', 0), ev('c', 300, 900)],
      [ev('a', 1000, 1900)],
    ];
    for (const board of boards) {
      for (const year of [-600, -300, 0, 500, 1150, 1300, 1450, 1800]) {
        for (const span of [0, 120]) {
          const gaps = validGaps(board, ev('x', year, span ? year + span : undefined));
          expect(gaps.length).toBeGreaterThan(0);
          expect(gaps).toEqual(gaps.map((_, k) => gaps[0] + k));
        }
      }
    }
  });
});

/**
 * The property that rejected the adjacency rule. Insert at a randomly chosen *valid* gap and
 * assert the board stays readable. Against a neighbour-only predicate this goes red within a
 * few hundred iterations; see the header comment in gameLogic.ts for the worked counterexample.
 */
describe('property: the board stays readable under random valid insertions', () => {
  it('holds over 500 random interval insertions', () => {
    const random = seededRandom(20260917);
    for (let trial = 0; trial < 500; trial++) {
      const seedYear = Math.floor(random() * 4000) - 2000;
      let timeline: HistoricalEvent[] = [
        ev('seed', seedYear, seedYear + Math.floor(random() * 400)),
      ];

      for (let n = 0; n < 12; n++) {
        const year = Math.floor(random() * 4000) - 2000;
        const span = random() < 0.4 ? Math.floor(random() * 600) : 0;
        const card = ev(`c${n}`, year, span ? year + span : undefined);

        const gaps = validGaps(timeline, card);
        expect(gaps.length).toBeGreaterThan(0);
        expect(gaps).toEqual(gaps.map((_, k) => gaps[0] + k));
        expect(gaps).toContain(findCorrectPosition(timeline, card));

        const chosen = gaps[Math.floor(random() * gaps.length)];
        timeline = [...timeline.slice(0, chosen), card, ...timeline.slice(chosen)];
        expect(isReadable(timeline)).toBe(true);
      }
    }
  });
});

describe('formatEventYear', () => {
  it.each([
    ['a point CE year', ev('a', 1969), '1969'],
    ['a point BCE year', ev('a', -490), '490 BCE'],
    ['a CE range', ev('a', 1914, 1918), '1914-1918'],
    // Thousands separator matches formatYear, so a ranged card reads like its neighbours.
    ['a BCE range, era suffix once', ev('a', -1200, -800), '1,200-800 BCE'],
    ['a BCE range under a thousand', ev('a', -490, -404), '490-404 BCE'],
    ['a range straddling zero', ev('a', -50, 20), '50 BCE - 20 CE'],
    ['a range ending at zero', ev('a', -100, 0), '100 BCE - 0 CE'],
    ['a year_end equal to year', ev('a', 1200, 1200), '1200'],
  ])('formats %s', (_label, event, expected) => {
    expect(formatEventYear(event as HistoricalEvent)).toBe(expected);
  });

  it('widens precision until the two deep-time ends are distinguishable', () => {
    // 3.3-2.6 Ma both round to "3" at zero decimals; a fixed precision would hide the window.
    expect(formatEventYear(ev('a', -3300000, -2600000))).toBe('3.3-2.6 million BCE');
    expect(formatEventYear(ev('a', -2040000, -1770000))).toBe('2.0-1.8 million BCE');
  });

  it('collapses a dating error bar that one decimal cannot separate', () => {
    // A 30,000-year uncertainty at 3.2 Ma genuinely is a point at this resolution, and so is
    // the 61,000-year End-Permian bracket at 252 Ma.
    expect(formatEventYearParts(ev('a', -3200000, -3170000))).toEqual({
      start: '3.2 million BCE',
      end: null,
    });
    expect(formatEventYearParts(ev('a', -251941000, -251880000))).toEqual({
      start: '251.9 million BCE',
      end: null,
    });
  });

  it('picks the unit once across a deep-time range rather than per end', () => {
    // formatYear rounds millions with toFixed(0), so formatting each end separately would
    // render this as "3-3 million BCE". At that resolution the window *is* a point, so it
    // collapses to a single label instead.
    expect(formatEventYear(ev('a', -8000000, -2000000))).toBe('8-2 million BCE');
  });

  it('falls back to plain years when the window straddles the unit', () => {
    // -2000000..-9000 in millions would be "2-0 million BCE", rounding the end away entirely.
    expect(formatEventYearParts(ev('a', -2000000, -9000))).toEqual({
      start: '2,000,000-',
      end: '9,000 BCE',
    });
    expect(formatEventYear(ev('a', -1040000, -50000))).toBe('1,040,000-50,000 BCE');
    // Still uses the shared unit while both ends reach a tenth of it.
    expect(formatEventYear(ev('a', -1790000, -400000))).toBe('1.8-0.4 million BCE');
  });

  it('separates a half-million-year window at 66 Ma rather than rounding it away', () => {
    expect(formatEventYear(ev('a', -66000000, -65500000))).toBe('66.0-65.5 million BCE');
  });

  it('splits into two lines for the timeline column', () => {
    expect(formatEventYearParts(ev('a', 1200, 1400))).toEqual({ start: '1200-', end: '1400' });
    expect(formatEventYearParts(ev('a', 1969))).toEqual({ start: '1969', end: null });
  });
});
