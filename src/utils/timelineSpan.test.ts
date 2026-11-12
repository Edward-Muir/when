import { HistoricalEvent } from '../types';
import { formatTimelineSpan, getTimelineSpan } from './timelineSpan';

const at = (year: number): HistoricalEvent =>
  ({ name: `e${year}`, friendly_name: `E ${year}`, year }) as HistoricalEvent;

describe('getTimelineSpan', () => {
  it('is zero for an empty or single-card timeline', () => {
    expect(getTimelineSpan([])).toBe(0);
    expect(getTimelineSpan([at(1969)])).toBe(0);
  });

  it('runs from the earliest card to the latest, whatever the order', () => {
    expect(getTimelineSpan([at(1969), at(1066), at(1492)])).toBe(903);
  });

  it('skips the year zero that does not exist', () => {
    expect(getTimelineSpan([at(-1), at(1)])).toBe(1);
    expect(getTimelineSpan([at(-1200), at(2009)])).toBe(3208);
  });

  it('subtracts plainly when both ends are on one side', () => {
    expect(getTimelineSpan([at(-243_000_000), at(-66_000_000)])).toBe(177_000_000);
  });
});

describe('formatTimelineSpan', () => {
  it('says nothing for no span', () => {
    expect(formatTimelineSpan(0)).toBeNull();
    expect(formatTimelineSpan(-5)).toBeNull();
    expect(formatTimelineSpan(NaN)).toBeNull();
  });

  it('groups thousands', () => {
    expect(formatTimelineSpan(1)).toBe('1 year');
    expect(formatTimelineSpan(903)).toBe('903 years');
    expect(formatTimelineSpan(3208)).toBe('3,208 years');
  });

  it('rounds deep time to millions, keeping one decimal below ten', () => {
    expect(formatTimelineSpan(120_002_013)).toBe('120 million years');
    expect(formatTimelineSpan(3_300_000)).toBe('3.3 million years');
    expect(formatTimelineSpan(2_000_000)).toBe('2 million years');
    expect(formatTimelineSpan(4_500_000_000)).toBe('4.5 billion years');
  });
});
