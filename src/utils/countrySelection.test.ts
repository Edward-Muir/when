import fs from 'fs';
import path from 'path';
import {
  RegionSelection,
  countrySummary,
  isCountryOn,
  legacyPicksToExclusions,
  pairKey,
  parsePair,
  pruneExclusions,
  regionStatus,
  selectWholeRegion,
  setRegionCountries,
  toggleCountry,
  toggleRegion,
} from './countrySelection';
import { filterByRegion } from './eventLoader';
import {
  ALL_REGIONS,
  countryMacros,
  countryOptionsByRegion,
  eventCountrySet,
  eventRegionSet,
} from './regions';
import { isCloudinaryImage } from './cloudinaryImage';
import { HistoricalEvent } from '../types';

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

const EUROPE_LISTED = ['United Kingdom', 'France', 'Germany', 'Russia'];
const everything = (): RegionSelection => ({ regions: [...ALL_REGIONS], excluded: [] });

describe('pair keys', () => {
  it('round-trips a pair and rejects a country outside its region', () => {
    expect(parsePair(pairKey('Europe', 'Germany'))).toEqual({
      region: 'Europe',
      country: 'Germany',
    });
    expect(parsePair(pairKey('East Asia', 'Germany'))).toBeUndefined();
    expect(parsePair('Germany')).toBeUndefined();
  });

  it('keys a transcontinental country separately on each side', () => {
    expect(parsePair(pairKey('North & Central Asia', 'Russia'))?.region).toBe(
      'North & Central Asia'
    );
    expect(pairKey('Europe', 'Russia')).not.toBe(pairKey('North & Central Asia', 'Russia'));
  });

  it('prunes unknown pairs, repeats and pairs in unselected regions', () => {
    const uk = pairKey('Europe', 'United Kingdom');
    const japan = pairKey('East Asia', 'Japan');
    expect(pruneExclusions([uk, uk, japan, 'Atlantis|Nowhere'], ['Europe'])).toEqual([uk]);
  });
});

describe('the picker interactions', () => {
  it('starts with every country on and every region whole', () => {
    const all = everything();
    for (const region of ALL_REGIONS) expect(regionStatus(region, all)).toBe('full');
    expect(isCountryOn('Europe', 'Germany', all)).toBe(true);
  });

  it('switches a country off and back on, the region partial in between', () => {
    const off = toggleCountry(everything(), 'Europe', 'Germany', EUROPE_LISTED);
    expect(isCountryOn('Europe', 'Germany', off)).toBe(false);
    expect(regionStatus('Europe', off)).toBe('partial');
    const on = toggleCountry(off, 'Europe', 'Germany', EUROPE_LISTED);
    expect(regionStatus('Europe', on)).toBe('full');
  });

  it("turns a region off with its last listed country, dropping the region's exclusions", () => {
    let selection = everything();
    for (const country of EUROPE_LISTED) {
      selection = toggleCountry(selection, 'Europe', country, EUROPE_LISTED);
    }
    expect(regionStatus('Europe', selection)).toBe('off');
    expect(selection.excluded).toEqual([]);
  });

  it('selects an unselected region with only the tapped country on', () => {
    const start: RegionSelection = { regions: ['East Asia'], excluded: [] };
    const next = toggleCountry(start, 'Europe', 'United Kingdom', EUROPE_LISTED);
    expect(next.regions).toEqual(['East Asia', 'Europe']);
    expect(isCountryOn('Europe', 'United Kingdom', next)).toBe(true);
    expect(isCountryOn('Europe', 'France', next)).toBe(false);
    expect(regionStatus('East Asia', next)).toBe('full');
  });

  it('taps a region chip like a tri-state checkbox', () => {
    const full = everything();
    const off = toggleRegion(full, 'Europe');
    expect(regionStatus('Europe', off)).toBe('off');
    expect(regionStatus('Europe', toggleRegion(off, 'Europe'))).toBe('full');

    const partial = toggleCountry(full, 'Europe', 'France', EUROPE_LISTED);
    const whole = toggleRegion(partial, 'Europe');
    expect(regionStatus('Europe', whole)).toBe('full');
    expect(whole).toEqual(selectWholeRegion(partial, 'Europe'));
  });

  it('switches one side of a transcontinental country without touching the other', () => {
    const next = toggleCountry(everything(), 'Europe', 'Russia', EUROPE_LISTED);
    expect(isCountryOn('Europe', 'Russia', next)).toBe(false);
    expect(isCountryOn('North & Central Asia', 'Russia', next)).toBe(true);
    expect(regionStatus('North & Central Asia', next)).toBe('full');
  });
});

describe('the Countries row summary', () => {
  const options = new Map([
    ['Europe', EUROPE_LISTED],
    ['East Asia', ['China', 'Japan']],
  ]);

  it('reads All, the countries on, or the countries off', () => {
    expect(countrySummary(everything(), options)).toBe('All');

    const ukOnly = toggleCountry(
      { regions: ['Global'], excluded: [] },
      'Europe',
      'United Kingdom',
      EUROPE_LISTED
    );
    expect(countrySummary(ukOnly, options)).toBe('United Kingdom');

    const noFrance = toggleCountry(everything(), 'Europe', 'France', EUROPE_LISTED);
    expect(countrySummary(noFrance, options)).toBe('All but France');
  });
});

describe('against the real catalogue', () => {
  const catalogue = loadCatalogue();
  const count = (selection: RegionSelection) =>
    filterByRegion(catalogue, selection.regions, selection.excluded).length;
  const tagged = (country: string) =>
    catalogue.filter((e) => (e.regions ?? []).includes(country)).length;

  /**
   * The report that led to the select-all picker: every region on, United Kingdom picked, and
   * 4,083 cards, because a pick narrowed only Europe and left every other region whole. Only
   * the UK is now exactly the UK.
   */
  it('deals exactly the UK when only the UK is on', () => {
    const europeOff = toggleRegion({ regions: ['Europe'], excluded: [] }, 'Europe');
    const options = countryOptionsByRegion(catalogue);
    const ukOnly = toggleCountry(
      europeOff,
      'Europe',
      'United Kingdom',
      options.get('Europe') ?? []
    );
    expect(count(ukOnly)).toBe(tagged('United Kingdom'));
    expect(count(ukOnly)).toBeGreaterThan(800);
  });

  it('removes only the UK when the UK alone is switched off', () => {
    const options = countryOptionsByRegion(catalogue);
    const noUk = toggleCountry(
      everything(),
      'Europe',
      'United Kingdom',
      options.get('Europe') ?? []
    );
    // A card stays when it reaches the deck some other way: another region, or another
    // European country. Cards tagged only "Europe" drop out with the region partial.
    const staysIn = (e: HistoricalEvent) =>
      [...eventRegionSet(e)].some((r) => r !== 'Europe') ||
      [...eventCountrySet(e)].some(
        (c) => c !== 'United Kingdom' && countryMacros(c).includes('Europe')
      );
    expect(count(noUk)).toBe(catalogue.filter(staysIn).length);
    expect(catalogue.length - count(noUk)).toBeGreaterThan(500);
  });

  /**
   * Settings and share codes from before exclusions stored picks. Converted, each deals the
   * pool it always did, measured with the old filter on 2026-09-30 over this same loader.
   * The one exception is recorded in `legacyPicksToExclusions`: a transcontinental pick no
   * longer reaches a side that is not selected.
   */
  it('converts old picks to the pool they dealt', () => {
    const legacy = (regions: string[], countries: string[]) =>
      count({ regions, excluded: legacyPicksToExclusions(regions, countries) });
    expect(legacy([...ALL_REGIONS], ['United Kingdom'])).toBe(4086);
    expect(legacy(['Europe'], ['Germany'])).toBe(326);
    expect(legacy(['Europe', 'East Asia'], ['Germany', 'Japan'])).toBe(473);
    expect(legacy(['Europe', 'Middle East & North Africa'], ['Turkey'])).toBe(163);
    expect(legacy(['Europe', 'North & Central Asia'], ['Russia'])).toBe(166);
    expect(legacy(['Europe'], ['Russia'])).toBeLessThan(166);
    expect(legacy(['Europe'], [])).toBe(3071);
  });
});

describe('setRegionCountries, the double-tap', () => {
  const start: RegionSelection = {
    regions: ['Europe', 'East Asia'],
    excluded: [pairKey('East Asia', 'Japan')],
  };

  it('isolates one country, leaving other regions alone', () => {
    const next = setRegionCountries(start, 'Europe', ['Germany'], EUROPE_LISTED);
    expect(isCountryOn('Europe', 'Germany', next)).toBe(true);
    expect(isCountryOn('Europe', 'France', next)).toBe(false);
    expect(next.excluded).toContain(pairKey('East Asia', 'Japan'));
  });

  it('restores the whole region when every listed country is on', () => {
    const isolated = setRegionCountries(start, 'Europe', ['Germany'], EUROPE_LISTED);
    const whole = setRegionCountries(isolated, 'Europe', EUROPE_LISTED, EUROPE_LISTED);
    expect(regionStatus('Europe', whole)).toBe('full');
    expect(whole.excluded).toEqual([pairKey('East Asia', 'Japan')]);
  });

  it('turns the region off when nothing is on, and selects an off region to isolate', () => {
    const none = setRegionCountries(start, 'Europe', [], EUROPE_LISTED);
    expect(regionStatus('Europe', none)).toBe('off');
    const back = setRegionCountries(none, 'Europe', ['France'], EUROPE_LISTED);
    expect(back.regions).toContain('Europe');
    expect(isCountryOn('Europe', 'France', back)).toBe(true);
  });
});
