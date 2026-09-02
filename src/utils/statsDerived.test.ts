import {
  addDays,
  buildHeatmapWeeks,
  dailyAverage,
  formatShortDate,
  formatWeekdayDate,
  lifetimeFrom,
  recordsFrom,
  scoreBuckets,
} from './statsDerived';
import { getDailyCadence, getLifetimeStats } from './statsStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('date helpers', () => {
  it('steps whole days across month ends, leap days and DST changes', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09'); // US spring forward
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02'); // US fall back
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('formats dates without touching the local zone', () => {
    expect(formatShortDate('2026-06-28')).toBe('28 Jun');
    expect(formatWeekdayDate('2026-08-14')).toBe('Fri 14 Aug');
    expect(formatWeekdayDate('2026-03-08')).toBe('Sun 8 Mar');
    expect(formatShortDate('junk')).toBe('junk');
  });
});

describe('buildHeatmapWeeks', () => {
  const today = '2026-09-02'; // a Wednesday

  it('ends on the week holding today and starts on a Monday', () => {
    const { weeks, todayCol } = buildHeatmapWeeks({
      playedDates: [],
      unlocked: {},
      today,
      minWeeks: 3,
    });
    expect(weeks).toHaveLength(3);
    expect(weeks[0][0].date).toBe('2026-08-17');
    expect(weeks.at(-1)?.map((c) => c.date)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    expect(todayCol).toBe(2);
    const last = weeks[2];
    expect(last[2]).toMatchObject({ isToday: true, isFuture: false });
    expect(last[3]).toMatchObject({ isToday: false, isFuture: true });
  });

  it('reaches back to the earliest trace, within the cap', () => {
    const wide = buildHeatmapWeeks({
      playedDates: ['2026-06-28'],
      unlocked: { '01': '2026-06-20' },
      firstPlayedDate: '2026-06-28',
      today,
      minWeeks: 2,
    });
    expect(wide.weeks[0][0].date).toBe('2026-06-15'); // Monday on/before the first badge
    const capped = buildHeatmapWeeks({
      playedDates: ['2024-01-01'],
      unlocked: {},
      today,
      maxWeeks: 4,
      minWeeks: 2,
    });
    expect(capped.weeks).toHaveLength(4);
    expect(capped.weeks[0][0].date).toBe('2026-08-10');
  });

  it('marks played days and badge days', () => {
    const { weeks } = buildHeatmapWeeks({
      playedDates: ['2026-09-01', '2026-08-31'],
      unlocked: { '01': '2026-09-01', '02': '2026-09-01', cat: '2026-08-31' },
      today,
      minWeeks: 1,
    });
    const [mon, tue, wed] = weeks[0];
    expect(mon).toMatchObject({ played: true, badgeIds: ['cat'] });
    expect(tue).toMatchObject({ played: true, badgeIds: ['01', '02'] });
    expect(wed).toMatchObject({ played: false, badgeIds: [] });
  });

  it('labels each month at the first column that touches it', () => {
    const { monthLabels } = buildHeatmapWeeks({
      playedDates: [],
      unlocked: {},
      today,
      minWeeks: 8,
    });
    expect(monthLabels).toEqual([
      { col: 0, label: 'Jul' },
      { col: 2, label: 'Aug' },
      { col: 7, label: 'Sep' },
    ]);
  });

  it('ignores traces from the future or of the wrong shape', () => {
    const { weeks } = buildHeatmapWeeks({
      playedDates: ['2030-01-01', 'not-a-date'],
      unlocked: {},
      today,
      minWeeks: 1,
    });
    expect(weeks).toHaveLength(1);
  });
});

describe('scoreBuckets', () => {
  it('sums the histogram into the game-over tiers and flags today', () => {
    const histogram: number[] = [];
    histogram[0] = 1;
    histogram[2] = 2;
    histogram[3] = 4;
    histogram[7] = 5;
    histogram[8] = 6;
    histogram[11] = 1;
    histogram[12] = 3;
    histogram[20] = 1;
    expect(scoreBuckets(histogram, 9)).toEqual([
      { label: '0–2', count: 3, isToday: false },
      { label: '3–4', count: 4, isToday: false },
      { label: '5–7', count: 5, isToday: false },
      { label: '8–11', count: 7, isToday: true },
      { label: '12+', count: 4, isToday: false },
    ]);
  });

  it('is all zeros with nothing flagged before the first daily', () => {
    const buckets = scoreBuckets([]);
    expect(buckets.map((b) => b.count)).toEqual([0, 0, 0, 0, 0]);
    expect(buckets.some((b) => b.isToday)).toBe(false);
  });
});

describe('records and lifetime', () => {
  it('are zero for a fresh player', () => {
    const lifetime = getLifetimeStats();
    const cadence = getDailyCadence();
    expect(recordsFrom(lifetime, cadence)).toEqual({
      longestTimeline: 0,
      bestStreak: 0,
      longestDailyRun: 0,
      bestDailyScore: 0,
    });
    expect(lifetimeFrom(lifetime, cadence)).toEqual({
      gamesPlayed: 0,
      dailyGames: 0,
      eventsPlaced: 0,
      averageTimeline: null,
    });
    expect(dailyAverage(cadence)).toBeNull();
  });

  it('take the best of daily and custom play', () => {
    const lifetime = {
      ...getLifetimeStats(),
      gamesPlayed: { daily: 3, suddenDeath: 1 },
      timelineLengthSum: { daily: 30, suddenDeath: 5 },
      longestTimeline: { daily: 12, suddenDeath: 19 },
      bestInGameStreakEver: 11,
      bestCustomStreakEver: 7,
      eventsPlacedCorrect: 31,
    };
    const cadence = {
      ...getDailyCadence(),
      playedDates: ['2026-08-01', '2026-08-02', '2026-08-03'],
      maxDailyStreak: 23,
      bestDailyCorrect: 14,
      dailyCorrectSum: 27,
    };
    expect(recordsFrom(lifetime, cadence)).toEqual({
      longestTimeline: 19,
      bestStreak: 11,
      longestDailyRun: 23,
      bestDailyScore: 14,
    });
    expect(lifetimeFrom(lifetime, cadence)).toEqual({
      gamesPlayed: 4,
      dailyGames: 3,
      eventsPlaced: 31,
      averageTimeline: 8.8,
    });
    expect(dailyAverage(cadence)).toBe(9);
  });
});
