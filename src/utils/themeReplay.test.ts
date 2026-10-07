import { HistoricalEvent, ALL_CATEGORIES } from '../types';
import { CuratedTheme, __setCuratedThemesForTest } from './curatedThemes';
import { clearDailyPoolCache } from './dailyPool';
import { ALL_ERAS } from './eras';
import { DAILY_HAND_SIZE } from './dailyConfig';
import {
  buildThemeReplayConfig,
  buildThemeReplayDeck,
  freshReplaySeed,
  getCuratedThemeIdForConfig,
  REPLAY_HAND_SIZE,
  withFreshReplaySeed,
} from './themeReplay';

const difficulties = ['easy', 'medium', 'hard', 'very-hard'] as const;

/** A synthetic catalogue: 200 illustrated events spread over 2000 years and four labels. */
const catalogue: HistoricalEvent[] = Array.from({ length: 200 }, (_, i) => ({
  name: `event-${i}`,
  friendly_name: `Event ${i}`,
  year: 100 + i * 10,
  category: ALL_CATEGORIES.at(i % ALL_CATEGORIES.length) ?? 'empires',
  description: 'A thing happened',
  difficulty: difficulties.at(i % 4) ?? 'medium',
  image_url: `https://res.cloudinary.com/demo/image/upload/v1/events/event-${i}.jpg`,
}));

const theme = (id: string, dates: string[], size = 30, offset = 0): CuratedTheme => ({
  id,
  name: `Theme ${id}`,
  eventNames: catalogue.slice(offset, offset + size).map((e) => e.name),
  dates,
});

const TODAY = '2030-04-10';

beforeEach(() => {
  __setCuratedThemesForTest(null);
  clearDailyPoolCache();
});

describe('buildThemeReplayConfig', () => {
  it('is a single-player sudden-death game of the daily hand size, keyed to the theme', () => {
    const config = buildThemeReplayConfig(theme('kings', ['2030-01-01']));
    expect(config).toMatchObject({
      mode: 'suddenDeath',
      curatedThemeId: 'kings',
      playerCount: 1,
      suddenDeathHandSize: DAILY_HAND_SIZE,
      selectedCategories: [...ALL_CATEGORIES],
      selectedEras: [...ALL_ERAS],
    });
    expect(REPLAY_HAND_SIZE).toBe(DAILY_HAND_SIZE);
    // No challenge code: one cannot encode a curated pool, and none is shared.
    expect(config.challengeCode).toBeUndefined();
    expect(config.dailySeed).toBeUndefined();
  });

  it('always carries a non-empty seed, so the deck keeps its difficulty ramp', () => {
    const config = buildThemeReplayConfig(theme('kings', ['2030-01-01']));
    expect(config.challengeSeed).toMatch(/^archive:kings:\d+$/);
    expect(freshReplaySeed('kings')).not.toBe('');
  });

  it('reseeds on restart without touching anything else', () => {
    const config = buildThemeReplayConfig(theme('kings', ['2030-01-01']));
    // Seeds are random ints; draw until one differs so the test cannot flake on a repeat.
    let restarted = withFreshReplaySeed(config);
    for (let i = 0; i < 10 && restarted.challengeSeed === config.challengeSeed; i++) {
      restarted = withFreshReplaySeed(config);
    }
    expect(restarted.challengeSeed).not.toBe(config.challengeSeed);
    expect({ ...restarted, challengeSeed: undefined }).toEqual({
      ...config,
      challengeSeed: undefined,
    });
  });
});

describe('buildThemeReplayDeck', () => {
  it('deals only the theme, every card of it, in a seed-determined order', () => {
    const t = theme('kings', ['2030-01-01'], 30, 40);
    const deck = buildThemeReplayDeck(catalogue, t, 'archive:kings:1');
    expect(deck.map((e) => e.name).sort()).toEqual([...t.eventNames].sort());
    expect(buildThemeReplayDeck(catalogue, t, 'archive:kings:1')).toEqual(deck);
    expect(buildThemeReplayDeck(catalogue, t, 'archive:kings:2')).not.toEqual(deck);
  });
});

describe('getCuratedThemeIdForConfig', () => {
  const base = {
    mode: 'suddenDeath' as const,
    selectedDifficulties: [...difficulties],
    selectedCategories: [...ALL_CATEGORIES],
    selectedEras: [...ALL_ERAS],
  };

  it('names the replay theme from the config', () => {
    expect(getCuratedThemeIdForConfig({ ...base, curatedThemeId: 'kings' })).toBe('kings');
  });

  it('resolves a curated daily from its date, and nothing for an ordinary daily', () => {
    __setCuratedThemesForTest([theme('kings', [TODAY])]);
    expect(getCuratedThemeIdForConfig({ ...base, mode: 'daily', dailySeed: TODAY })).toBe('kings');
    expect(
      getCuratedThemeIdForConfig({ ...base, mode: 'daily', dailySeed: '2030-04-11' })
    ).toBeUndefined();
  });

  it('resolves a past day played from the Archive calendar from its replay date', () => {
    __setCuratedThemesForTest([theme('kings', ['2030-04-01'])]);
    expect(getCuratedThemeIdForConfig({ ...base, dailyReplayDate: '2030-04-01' })).toBe('kings');
    expect(getCuratedThemeIdForConfig({ ...base, dailyReplayDate: '2030-04-02' })).toBeUndefined();
  });

  it('is undefined for a plain custom game and a missing config', () => {
    expect(getCuratedThemeIdForConfig({ ...base, challengeCode: 'a-b-c' })).toBeUndefined();
    expect(getCuratedThemeIdForConfig(null)).toBeUndefined();
  });
});
