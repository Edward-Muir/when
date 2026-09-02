import fs from 'fs';
import path from 'path';
import { getDailyTheme, getThemeDisplayName, getThemedCategories } from './dailyTheme';
import { buildDailyPool, clearDailyPoolCache, getDailyBuildOptions } from './dailyPool';
import { buildDailyDeck } from './dailyConfig';
import { getRecentDailyCardNames, clearRecencyCache } from './dailyRecency';
import { RAMP_WINDOW } from './deckBuilder';
import {
  __setCuratedThemesForTest,
  CuratedTheme,
  getCuratedThemeById,
  listCuratedThemes,
} from './curatedThemes';
import { isCloudinaryImage } from './cloudinaryImage';
import { ALL_CATEGORIES, HistoricalEvent } from '../types';

/** Real catalogue, for the same reason deckBuilder.test.ts uses it. */
const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');

function loadCatalogue(): HistoricalEvent[] {
  const manifest = JSON.parse(
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed path
    fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
  ) as { files: string[] };

  const all: HistoricalEvent[] = [];
  for (const file of manifest.files) {
    all.push(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- from the manifest
      ...(JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')) as HistoricalEvent[])
    );
  }
  const seen = new Set<string>();
  return all
    .filter((e) => (seen.has(e.name) ? false : (seen.add(e.name), true)))
    .filter((e) => isCloudinaryImage(e.image_url));
}

const catalogue = loadCatalogue();

const CURATED_DATE = '2030-04-10';
const theme: CuratedTheme = {
  id: 'test-theme',
  name: 'Test Theme',
  // Spread across the catalogue so the pool behaves like a real hand-authored one.
  eventNames: catalogue.filter((_, i) => i % 180 === 0).map((e) => e.name),
  dates: [CURATED_DATE],
};

function withCuratedTheme<T>(run: () => T): T {
  __setCuratedThemesForTest([theme]);
  clearDailyPoolCache();
  clearRecencyCache();
  try {
    return run();
  } finally {
    __setCuratedThemesForTest(null);
    clearDailyPoolCache();
    clearRecencyCache();
  }
}

beforeEach(() => {
  __setCuratedThemesForTest(null);
  clearDailyPoolCache();
  clearRecencyCache();
});

describe('curated themes', () => {
  it('has a pool big enough to be worth testing', () => {
    expect(theme.eventNames.length).toBeGreaterThanOrEqual(16);
  });

  it('lists every stored theme and finds one by id, for the Archive', () => {
    withCuratedTheme(() => {
      expect(listCuratedThemes()).toEqual([theme]);
      expect(getCuratedThemeById('test-theme')).toBe(theme);
      expect(getCuratedThemeById('nope')).toBeUndefined();
    });
    expect(listCuratedThemes()).toEqual([]);
  });

  it('names the curated theme on its scheduled date', () => {
    withCuratedTheme(() => {
      const resolved = getDailyTheme(CURATED_DATE);
      expect(resolved.type).toBe('curated');
      expect(getThemeDisplayName(resolved)).toBe('Test Theme');
    });
  });

  it('draws the day pool from exactly the listed events', () => {
    withCuratedTheme(() => {
      const pool = buildDailyPool(catalogue, CURATED_DATE);
      expect(pool.map((e) => e.name).sort()).toEqual([...theme.eventNames].sort());
    });
  });

  it('reports every category, since a curated pool is not a category filter', () => {
    withCuratedTheme(() => {
      expect(getThemedCategories(getDailyTheme(CURATED_DATE))).toEqual([...ALL_CATEGORIES]);
    });
  });

  it('lifts the band cap and lowers the exclusion floor only for curated days', () => {
    withCuratedTheme(() => {
      expect(getDailyBuildOptions(CURATED_DATE)).toEqual({
        bandSpread: 1,
        minAfterExclusion: expect.any(Number),
      });
      expect(getDailyBuildOptions('2030-04-11')).toEqual({});
    });
  });

  /**
   * The regression that matters most.
   *
   * The curated lookup runs before the seeded RNG is touched, so scheduling a theme must not
   * shift any other day. Every ordinary day's theme is a function of how many random numbers
   * have been drawn from its seed — the same coupling that re-rolled a year of dates when the
   * 21st category was added.
   */
  it('leaves every other date bit-identical', () => {
    const dates = Array.from({ length: 120 }, (_, i) => {
      const d = new Date(Date.parse('2030-01-01T00:00:00Z') + i * 86400000);
      return d.toISOString().slice(0, 10);
    }).filter((d) => d !== CURATED_DATE);

    const before = dates.map((d) => getThemeDisplayName(getDailyTheme(d)));
    const after = withCuratedTheme(() => dates.map((d) => getThemeDisplayName(getDailyTheme(d))));

    expect(after).toEqual(before);
  });
});

describe('the recency chain and the dealt deck agree on a curated day', () => {
  /**
   * getDailyBuildOptions exists so both `buildDailyDeck` and the chain walk in dailyRecency
   * build a curated day the same way. If they diverge, the following week excludes cards
   * nobody saw and fails to exclude cards everybody saw — worse than no recency at all.
   *
   * The chain replays history, so this asserts the replay of the curated day matches what a
   * player was actually dealt.
   */
  it('excludes the cards the curated day really dealt', () => {
    withCuratedTheme(() => {
      const dealt = buildDailyDeck(catalogue, CURATED_DATE)
        .slice(0, RAMP_WINDOW)
        .map((e) => e.name);
      expect(dealt.length).toBeGreaterThan(0);

      const recentAfterwards = getRecentDailyCardNames(catalogue, '2030-04-11');
      for (const name of dealt) {
        expect(recentAfterwards.has(name)).toBe(true);
      }
    });
  });
});
