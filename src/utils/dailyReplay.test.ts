import { HistoricalEvent, WhenGameState, ALL_CATEGORIES } from '../types';
import { CuratedTheme, __setCuratedThemesForTest } from './curatedThemes';
import { clearDailyPoolCache } from './dailyPool';
import { DAILY_HAND_SIZE } from './dailyConfig';
import { buildDailyDeck, getDailyPreviewEvent } from './dailyConfig';
import type { GameRecord } from './gameHistory';
import {
  ARCHIVE_DAYS,
  asRecordedDaily,
  buildDayReplayConfig,
  dayBest,
  getArchiveDays,
  isReplayableDay,
} from './dailyReplay';

const catalogue: HistoricalEvent[] = Array.from({ length: 60 }, (_, i) => ({
  name: `event-${i}`,
  friendly_name: `Event ${i}`,
  year: 1000 + i * 10,
  category: ALL_CATEGORIES.at(i % ALL_CATEGORIES.length) ?? 'empires',
  description: 'A thing happened',
  difficulty: 'medium',
  image_url: `https://res.cloudinary.com/demo/image/upload/v1/events/event-${i}.jpg`,
}));

const theme = (id: string, dates: string[], size: number): CuratedTheme => ({
  id,
  name: `Theme ${id}`,
  eventNames: catalogue.slice(0, size).map((e) => e.name),
  dates,
});

beforeEach(() => {
  clearDailyPoolCache();
  __setCuratedThemesForTest([theme('kings', ['2026-09-04'], 20), theme('thin', ['2026-09-07'], 3)]);
});

afterEach(() => {
  __setCuratedThemesForTest(null);
});

describe('isReplayableDay', () => {
  it('covers the listed days before today', () => {
    const today = '2026-10-07';
    expect(isReplayableDay('2026-10-06', today)).toBe(true);
    expect(isReplayableDay('2026-09-08', today)).toBe(true); // 29 days back: the oldest row
    expect(isReplayableDay('2026-09-07', today)).toBe(false);
    expect(isReplayableDay(today, today)).toBe(false);
    expect(isReplayableDay('2026-10-08', today)).toBe(false);
  });
});

describe('getArchiveDays', () => {
  const today = '2026-10-07';

  it('lists the last thirty days oldest first, then the next curated deck', () => {
    __setCuratedThemesForTest([
      theme('kings', ['2026-09-20'], 20),
      theme('old', ['2026-08-01'], 20),
      theme('next', ['2026-10-09'], 20),
      theme('later', ['2026-11-01'], 20),
    ]);
    const days = getArchiveDays(catalogue, today, ['2026-10-06']);
    expect(days).toHaveLength(ARCHIVE_DAYS + 1);
    expect(days[0].date).toBe('2026-09-08');
    expect(days.at(-2)).toMatchObject({ date: today, status: 'today', played: false });
    expect(days.at(-3)).toMatchObject({ date: '2026-10-06', status: 'replayable', played: true });
    expect(days.at(-1)).toMatchObject({ date: '2026-10-09', status: 'upcoming' });
    expect(days.find((d) => d.date === '2026-09-20')).toMatchObject({
      curated: { id: 'kings' },
      cardCount: 20,
    });
    // Strictly thirty days: an older curated deck is gone.
    expect(days.some((d) => d.curated?.id === 'old')).toBe(false);
    expect(days.filter((d) => d.curated).map((d) => d.curated?.id)).toEqual(['kings', 'next']);
  });

  it('never reaches back before the first puzzle', () => {
    expect(getArchiveDays(catalogue, '2026-07-05', [])[0].date).toBe('2026-06-28');
  });
});

describe('dayBest', () => {
  const rec = (overrides: Partial<GameRecord>): GameRecord => ({
    date: '2026-10-07',
    mode: 'suddenDeath',
    placements: '',
    correct: [],
    misses: [],
    bestStreak: 0,
    timelineLength: 1,
    ...overrides,
  });

  it("takes the best of the day's daily and its practice replays", () => {
    const history = [
      rec({ mode: 'daily', date: '2026-10-02', correct: ['a', 'b'] }),
      rec({ replayOf: '2026-10-02', correct: ['a', 'b', 'c'] }),
      rec({ replayOf: '2026-10-01', correct: ['a', 'b', 'c', 'd'] }),
      // A custom game played on that date is not a game of that day's deck.
      rec({ date: '2026-10-02', correct: ['a', 'b', 'c', 'd', 'e'] }),
    ];
    expect(dayBest(history, '2026-10-02')).toBe(3);
    expect(dayBest(history, '2026-10-03')).toBeUndefined();
    expect(dayBest([rec({ mode: 'daily', date: '2026-10-03' })], '2026-10-03')).toBe(0);
  });
});

describe('getDailyPreviewEvent', () => {
  it("is the opening card of the day's full deck", () => {
    for (const date of ['2026-09-04', '2026-09-05', '2026-09-14', '2026-10-01']) {
      expect(getDailyPreviewEvent(catalogue, date)?.name).toBe(
        buildDailyDeck(catalogue, date)[0]?.name
      );
    }
    expect(getDailyPreviewEvent(catalogue, '2026-09-04')).not.toBeNull();
  });
});

describe('buildDayReplayConfig', () => {
  it('plays an ordinary day as a one-player sudden-death game on that date', () => {
    const config = buildDayReplayConfig('2026-09-05', catalogue);
    expect(config).toMatchObject({
      mode: 'suddenDeath',
      dailyReplayDate: '2026-09-05',
      playerCount: 1,
      suddenDeathHandSize: DAILY_HAND_SIZE,
    });
    // Never the daily's own fields: those reach today's result and the leaderboard.
    expect(config.dailySeed).toBeUndefined();
    expect(config.curatedThemeId).toBeUndefined();
  });

  it('plays a curated day as the reshuffled theme, still naming the date', () => {
    const config = buildDayReplayConfig('2026-09-04', catalogue);
    expect(config).toMatchObject({
      mode: 'suddenDeath',
      curatedThemeId: 'kings',
      dailyReplayDate: '2026-09-04',
    });
    expect(config.challengeSeed).toMatch(/^archive:kings:/);
  });

  it("deals the date's own deck when the theme is too thin to replay", () => {
    const config = buildDayReplayConfig('2026-09-07', catalogue);
    expect(config.curatedThemeId).toBeUndefined();
    expect(config.dailyReplayDate).toBe('2026-09-07');
  });
});

describe('asRecordedDaily', () => {
  const finished = (lastConfig: Partial<WhenGameState['lastConfig']>) =>
    ({ gameMode: 'suddenDeath', lastConfig }) as unknown as WhenGameState;

  it("records a missed day as that day's daily", () => {
    const state = finished({ mode: 'suddenDeath', dailyReplayDate: '2026-09-05' });
    const recorded = asRecordedDaily(state, ['2026-09-04']);
    expect(recorded.gameMode).toBe('daily');
    expect(recorded.lastConfig?.dailySeed).toBe('2026-09-05');
    // The live state is never touched.
    expect(state.gameMode).toBe('suddenDeath');
    expect(state.lastConfig?.dailySeed).toBeUndefined();
  });

  it('leaves a day already played, and any other game, as it is', () => {
    const replay = finished({ mode: 'suddenDeath', dailyReplayDate: '2026-09-05' });
    expect(asRecordedDaily(replay, ['2026-09-05'])).toBe(replay);
    const custom = finished({ mode: 'suddenDeath', challengeCode: 'a-b-c' });
    expect(asRecordedDaily(custom, [])).toBe(custom);
  });
});
