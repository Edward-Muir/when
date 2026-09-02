import { HistoricalEvent, ALL_CATEGORIES } from '../types';
import { CuratedTheme, __setCuratedThemesForTest } from './curatedThemes';
import { clearDailyPoolCache } from './dailyPool';
import { ALL_ERAS } from './eras';
import { DAILY_HAND_SIZE } from './dailyConfig';
import {
  buildThemeReplayConfig,
  buildThemeReplayDeck,
  freshReplaySeed,
  getArchiveEntries,
  getCuratedThemeIdForConfig,
  getThemeSeedEvent,
  REPLAY_HAND_SIZE,
  REPLAY_MIN_POOL,
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

describe('getArchiveEntries', () => {
  it('lists past themes oldest first, today locked, future omitted', () => {
    const entries = getArchiveEntries(
      [
        theme('future', ['2030-05-01']),
        theme('today', [TODAY]),
        theme('newer', ['2030-04-01']),
        theme('older', ['2030-03-01']),
      ],
      catalogue,
      TODAY
    );
    expect(entries.map((e) => e.theme.id)).toEqual(['older', 'newer', 'today']);
    expect(entries.map((e) => e.locked)).toEqual([false, false, true]);
  });

  it('dates a multi-date theme by its earliest past date and ignores its future ones', () => {
    const [entry] = getArchiveEntries(
      [theme('repeat', ['2030-06-01', '2030-02-01', '2030-03-15'])],
      catalogue,
      TODAY
    );
    expect(entry.releaseDate).toBe('2030-02-01');
    expect(entry.locked).toBe(false);
  });

  it('counts the cards the theme resolves to, not the slugs it names', () => {
    const thin: CuratedTheme = {
      id: 'thin',
      name: 'Thin',
      eventNames: ['event-1', 'event-2', 'retired-slug', 'another-missing'],
      dates: ['2030-01-01'],
    };
    const [entry] = getArchiveEntries([thin], catalogue, TODAY);
    expect(entry.cardCount).toBe(2);
    expect(entry.cardCount).toBeLessThan(REPLAY_MIN_POOL);
  });

  it('is empty when nothing has run yet', () => {
    expect(getArchiveEntries([theme('future', ['2031-01-01'])], catalogue, TODAY)).toEqual([]);
  });
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

describe('getThemeSeedEvent', () => {
  it('is a card of the theme, stable for a given release date', () => {
    const t = theme('kings', ['2030-01-01']);
    const seed = getThemeSeedEvent(catalogue, t, '2030-01-01');
    expect(seed).not.toBeNull();
    expect(t.eventNames).toContain(seed?.name);
    expect(getThemeSeedEvent(catalogue, t, '2030-01-01')).toEqual(seed);
  });

  it('is null when the theme resolves to nothing', () => {
    const t: CuratedTheme = {
      id: 'gone',
      name: 'Gone',
      eventNames: ['nope'],
      dates: ['2030-01-01'],
    };
    expect(getThemeSeedEvent(catalogue, t, '2030-01-01')).toBeNull();
  });
});

describe('getCuratedThemeIdForConfig', () => {
  const base = {
    mode: 'suddenDeath' as const,
    totalTurns: 7,
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

  it('is undefined for a plain custom game and a missing config', () => {
    expect(getCuratedThemeIdForConfig({ ...base, challengeCode: 'a-b-c' })).toBeUndefined();
    expect(getCuratedThemeIdForConfig(null)).toBeUndefined();
  });
});
