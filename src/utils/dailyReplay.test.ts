import { HistoricalEvent, WhenGameState, ALL_CATEGORIES } from '../types';
import { CuratedTheme, __setCuratedThemesForTest } from './curatedThemes';
import { clearDailyPoolCache } from './dailyPool';
import { DAILY_HAND_SIZE } from './dailyConfig';
import {
  asRecordedDaily,
  buildDayReplayConfig,
  DAILY_REPLAY_FROM,
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
  it('runs from the floor up to yesterday', () => {
    const today = '2026-10-07';
    expect(isReplayableDay(DAILY_REPLAY_FROM, today)).toBe(true);
    expect(isReplayableDay('2026-06-30', today)).toBe(false);
    expect(isReplayableDay('2026-10-06', today)).toBe(true);
    expect(isReplayableDay(today, today)).toBe(false);
    expect(isReplayableDay('2026-10-08', today)).toBe(false);
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
