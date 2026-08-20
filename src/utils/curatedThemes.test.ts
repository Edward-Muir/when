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
  getCuratedThemesRevision,
  loadCuratedThemes,
  subscribeCuratedThemes,
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

/**
 * The calendar is read synchronously but filled asynchronously, so it publishes a revision
 * when its contents change. Without that signal a component that derived a value before the
 * fetch landed keeps it forever — which is how a curated day showed the seeded fallback
 * category on the home screen all day.
 */
describe('the calendar publishes changes', () => {
  const okResponse = (calendar: unknown) =>
    ({ ok: true, json: () => Promise.resolve(calendar) }) as unknown as Response;

  afterEach(() => {
    __setCuratedThemesForTest(null);
  });

  it('notifies on a first successful load', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCuratedThemes(listener);
    const before = getCuratedThemesRevision();

    global.fetch = jest.fn().mockResolvedValue(okResponse({ version: 1, themes: [theme] }));
    await loadCuratedThemes({ force: true });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getCuratedThemesRevision()).toBeGreaterThan(before);
    unsubscribe();
  });

  /**
   * The forced refetch fires on every resume and visibility change, not just at midnight, so
   * an unchanged document has to be free — otherwise every tab focus re-renders mode select
   * and re-walks the 28-day recency chain to reach an identical answer.
   */
  it('stays silent when a forced refetch carries the same version', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ version: 7, themes: [theme] }));
    await loadCuratedThemes({ force: true });

    const listener = jest.fn();
    const unsubscribe = subscribeCuratedThemes(listener);
    const settled = getCuratedThemesRevision();

    await loadCuratedThemes({ force: true });

    expect(listener).not.toHaveBeenCalled();
    expect(getCuratedThemesRevision()).toBe(settled);
    unsubscribe();
  });

  it('notifies when a forced refetch carries a new version', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse({ version: 7, themes: [] }));
    await loadCuratedThemes({ force: true });

    const listener = jest.fn();
    const unsubscribe = subscribeCuratedThemes(listener);

    global.fetch = jest.fn().mockResolvedValue(okResponse({ version: 8, themes: [theme] }));
    await loadCuratedThemes({ force: true });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getDailyTheme(CURATED_DATE).type).toBe('curated');
    unsubscribe();
  });

  it('says nothing when the fetch fails', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeCuratedThemes(listener);
    const before = getCuratedThemesRevision();

    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await loadCuratedThemes({ force: true });

    expect(listener).not.toHaveBeenCalled();
    expect(getCuratedThemesRevision()).toBe(before);
    unsubscribe();
  });

  it('stops delivering once unsubscribed', async () => {
    const listener = jest.fn();
    subscribeCuratedThemes(listener)();

    global.fetch = jest.fn().mockResolvedValue(okResponse({ version: 3, themes: [theme] }));
    await loadCuratedThemes({ force: true });

    expect(listener).not.toHaveBeenCalled();
  });
});
