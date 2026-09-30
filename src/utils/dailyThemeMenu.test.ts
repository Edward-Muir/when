import fs from 'fs';
import path from 'path';
import {
  DailyTheme,
  MENU_EPOCHS,
  PLACES_WITH_THE,
  getDailyTheme,
  getThemeDisplayName,
  getThemedCategories,
  getThemedEras,
  menuEpochFor,
} from './dailyTheme';
import {
  FOOTHOLD_FLOOR,
  buildDailyPool,
  clearDailyPoolCache,
  getDailyBuildOptions,
} from './dailyPool';
import { buildDailyDeck } from './dailyConfig';
import { clearRecencyCache, getRecentDailyCardNames } from './dailyRecency';
import { RAMP_WINDOW } from './deckBuilder';
import { buildDifficultyIndex } from './difficultyScore';
import { filterPool } from './eventLoader';
import { eventInPlace, eventRegionSet, isCountryName, isRegionName } from './regions';
import { __setCuratedThemesForTest } from './curatedThemes';
import { isCloudinaryImage } from './cloudinaryImage';
import { ALL_CATEGORIES, Category, DEFAULT_DIFFICULTIES, HistoricalEvent } from '../types';

/**
 * The seeded daily's dated menu: regions, countries and category + place pairings, drawn from
 * a frozen list per epoch (src/data/dailyThemeMenu.json, written by
 * scripts/daily-theme-menu.js). Runs against the real catalogue, because the gates are
 * properties of the real event data.
 */

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
const index = buildDifficultyIndex(catalogue);

/** Mirrors the gates in scripts/daily-theme-menu.js. */
const MIN_POOL = 30;
const MIN_BAND_ZERO_DAILY = 8;

const FIRST_EPOCH = MENU_EPOCHS[0].from;
const LATEST_EPOCH = MENU_EPOCHS[MENU_EPOCHS.length - 1];

const DAY_MS = 86400000;
function days(from: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(from) + i * DAY_MS).toISOString().slice(0, 10)
  );
}

beforeEach(() => {
  __setCuratedThemesForTest(null);
  clearDailyPoolCache();
  clearRecencyCache();
});

describe('dates before the first menu epoch', () => {
  /**
   * The regression that matters most. Every date from the first puzzle to the day before the
   * menu, captured from the original generator before the menu existed. These days have been
   * played: the recency chain replays them and stored results name them, so re-theming any
   * of them replays decks nobody was dealt. A menu change must be a new epoch from a future
   * date, never an edit that reaches back here.
   */
  const LEGACY_THEMES = (
    'Commerce Everything Media Everything Everything Everything Law ' +
    'Everything Law Revolution Everything Everything Diplomacy Everything ' +
    'Everything Everything Architecture Agriculture Warfare Migration Everything ' +
    'Everything Art Nature Everything Everything Everything Art ' +
    'Everything Everything Architecture Commerce Revolution Diplomacy Everything ' +
    'Sports Everything Revolution Science Diplomacy Warfare Agriculture ' +
    'Migration Everything Disasters Everything Everything Everything Everything ' +
    'Medicine Trade Everything Media Architecture Trade Everything ' +
    'Everything Commerce Disasters Everything Agriculture Migration Medicine ' +
    'Craft Everything Writing Everything Everything Writing Everything ' +
    'Everything Everything Art Everything Everything Diplomacy Media ' +
    'Everything Everything Empires Everything Warfare Everything Everything ' +
    'Everything Everything Everything Everything Everything Warfare Commerce ' +
    'Sports Everything Everything Agriculture Medicine Everything Invention ' +
    'Science Invention'
  ).split(' ');

  it('keeps the original generator, date for date', () => {
    const dates = days('2026-06-28', LEGACY_THEMES.length);
    expect(dates[dates.length - 1] < FIRST_EPOCH).toBe(true);
    expect(dates.map((d) => getThemeDisplayName(getDailyTheme(d)))).toEqual(LEGACY_THEMES);
  });

  it('draws only Everything and single categories', () => {
    for (const date of days('2026-06-28', LEGACY_THEMES.length)) {
      expect(['all', 'category']).toContain(getDailyTheme(date).type);
      expect(getDailyBuildOptions(date)).toEqual({});
    }
  });
});

describe('the menu', () => {
  it('lists epochs in date order, each a real date', () => {
    for (const epoch of MENU_EPOCHS) expect(epoch.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const froms = MENU_EPOCHS.map((e) => e.from);
    expect(froms).toEqual([...new Set(froms)].sort());
  });

  it('switches epoch exactly on its from date', () => {
    const before = new Date(Date.parse(FIRST_EPOCH) - DAY_MS).toISOString().slice(0, 10);
    expect(menuEpochFor(before)).toBeUndefined();
    expect(menuEpochFor(FIRST_EPOCH)).toBe(MENU_EPOCHS[0]);
    expect(menuEpochFor('2999-01-01')).toBe(LATEST_EPOCH);
  });

  it('names only real categories, regions and countries', () => {
    for (const epoch of MENU_EPOCHS) {
      for (const category of epoch.categories) {
        expect(ALL_CATEGORIES).toContain(category);
      }
      for (const region of epoch.regions) expect(isRegionName(region)).toBe(true);
      for (const country of epoch.countries) expect(isCountryName(country)).toBe(true);
      for (const [category, place] of epoch.mixes) {
        expect(ALL_CATEGORIES).toContain(category);
        expect(isRegionName(place) || isCountryName(place)).toBe(true);
      }
    }
  });

  it('covers every category in the latest epoch', () => {
    // A new category joins the daily through a new epoch; this is the reminder to write one.
    expect([...LATEST_EPOCH.categories].sort()).toEqual([...ALL_CATEGORIES].sort());
  });

  it('knows only taxonomy names as places that take "the"', () => {
    for (const place of PLACES_WITH_THE) {
      expect(isRegionName(place) || isCountryName(place)).toBe(true);
    }
  });

  /**
   * The drift gate. The menu was admitted on these numbers; catalogue work (a retirement, a
   * re-tag, a re-dated card changing the bands) can push an entry under them. The fix is a new
   * epoch from a future date (`npm run daily-menu -- --from YYYY-MM-DD`), never an edit to a
   * live one. Only the latest epoch is checked: an earlier one has either ended or has its
   * replacement scheduled.
   */
  it('keeps every entry of the latest epoch above both gates', () => {
    const themes: DailyTheme[] = [
      ...LATEST_EPOCH.regions.map((place): DailyTheme => ({ type: 'place', value: null, place })),
      ...LATEST_EPOCH.countries.map((place): DailyTheme => ({ type: 'place', value: null, place })),
      ...LATEST_EPOCH.mixes.map(
        ([category, place]): DailyTheme => ({ type: 'mix', value: category as Category, place })
      ),
    ];
    const failures: string[] = [];
    for (const theme of themes) {
      const place = (theme as { place: string }).place;
      const pool = filterPool(catalogue, {
        difficulties: [...DEFAULT_DIFFICULTIES],
        categories: getThemedCategories(theme),
        eras: getThemedEras(theme),
      }).filter((e) => eventInPlace(e, place));
      const easy = pool.filter((e) => index.bandOf(e) === 0).length;
      if (pool.length < MIN_POOL || easy < MIN_BAND_ZERO_DAILY) {
        failures.push(`${getThemeDisplayName(theme)}: ${pool.length} cards, ${easy} easy`);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('dates from the first menu epoch', () => {
  const YEAR = days(FIRST_EPOCH, 3 * 365);

  it('draws each kind at roughly its weighted share', () => {
    const counts = { all: 0, category: 0, region: 0, country: 0, mix: 0 };
    for (const date of YEAR) {
      const theme = getDailyTheme(date);
      if (theme.type === 'place') counts[isRegionName(theme.place) ? 'region' : 'country']++;
      else if (theme.type !== 'curated') counts[theme.type]++;
    }
    const weights = MENU_EPOCHS[0].weights;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const kind of Object.keys(counts) as (keyof typeof counts)[]) {
      // eslint-disable-next-line security/detect-object-injection -- fixed keys
      const share = counts[kind] / YEAR.length;
      // eslint-disable-next-line security/detect-object-injection -- fixed keys
      expect(Math.abs(share - weights[kind] / total)).toBeLessThan(0.04);
    }
  });

  it('names a pairing as a category in a place', () => {
    const name = (category: Category, place: string) =>
      getThemeDisplayName({ type: 'mix', value: category, place });
    expect(name('art', 'Italy')).toBe('Art in Italy');
    expect(name('warfare', 'United States')).toBe('Warfare in the United States');
    expect(name('trade', 'Middle East & North Africa')).toBe(
      'Trade in the Middle East & North Africa'
    );
    expect(getThemeDisplayName({ type: 'place', value: null, place: 'East Asia' })).toBe(
      'East Asia'
    );
  });

  it('matches a country on its own tag, whichever side of a border it sits', () => {
    const turkish = catalogue.filter((e) => (e.regions ?? []).includes('Turkey'));
    const sides = new Set(turkish.flatMap((e) => [...eventRegionSet(e)]));
    expect(sides.has('Europe') && sides.has('Middle East & North Africa')).toBe(true);
    expect(catalogue.filter((e) => eventInPlace(e, 'Turkey'))).toEqual(turkish);
    expect(catalogue.filter((e) => eventInPlace(e, 'East Asia'))).toEqual(
      catalogue.filter((e) => eventRegionSet(e).has('East Asia'))
    );
  });

  it("deals a pairing day only that category's cards from that place", () => {
    const date = YEAR.find((d) => {
      const theme = getDailyTheme(d);
      return theme.type === 'mix' && isCountryName(theme.place);
    }) as string;
    const theme = getDailyTheme(date) as Extract<DailyTheme, { type: 'mix' }>;
    const pool = buildDailyPool(catalogue, date);
    expect(pool.length).toBeGreaterThanOrEqual(MIN_POOL);
    for (const event of pool) {
      expect(event.category).toBe(theme.value);
      expect(event.regions).toContain(theme.place);
    }
  });

  it('gives place and pairing days the thin-pool options, and only them', () => {
    for (const date of YEAR.slice(0, 120)) {
      const theme = getDailyTheme(date);
      const themed = theme.type === 'place' || theme.type === 'mix';
      expect(getDailyBuildOptions(date)).toEqual(
        themed ? { bandSpread: 1, minAfterExclusion: 12, footholdFloor: FOOTHOLD_FLOOR } : {}
      );
    }
  });

  /**
   * The point of the easy-card gate and the options above, measured the way
   * docs/curated-themes measures the opening: how often the hardest quartile is dealt into
   * the opening hand (deck indices 1-5), and how many band-0 cards the first six hold.
   *
   * Measured over 240 days from 2026-10-06: ordinary days 9.8% and 2.89, place days 9.2% and
   * 3.11, pairings 9.3% and 2.74. The same pairing days on the default options were 39.5% and
   * 2.14, which is what this guards against. Bounds are headroom over those numbers.
   */
  it('opens place and pairing days as gently as ordinary ones', () => {
    let themed = 0;
    let hardestInHand = 0;
    let easyInOpening = 0;
    for (const date of YEAR.slice(0, 120)) {
      const theme = getDailyTheme(date);
      if (theme.type !== 'place' && theme.type !== 'mix') continue;
      const deck = buildDailyDeck(catalogue, date);
      themed++;
      if (deck.slice(1, 6).some((e) => index.bandOf(e) === 3)) hardestInHand++;
      easyInOpening += deck.slice(0, 6).filter((e) => index.bandOf(e) === 0).length;
    }
    expect(themed).toBeGreaterThan(30);
    expect(hardestInHand / themed).toBeLessThan(0.2);
    expect(easyInOpening / themed).toBeGreaterThan(2.3);
  });

  it('excludes the cards a place or pairing day really dealt from the next week', () => {
    const date = YEAR.find((d) => getDailyTheme(d).type === 'mix') as string;
    const dealt = buildDailyDeck(catalogue, date)
      .slice(0, RAMP_WINDOW)
      .map((e) => e.name);
    const next = new Date(Date.parse(date) + DAY_MS).toISOString().slice(0, 10);
    const recent = getRecentDailyCardNames(catalogue, next);
    for (const name of dealt) expect(recent.has(name)).toBe(true);
  });
});
