import taxonomy from '../data/regions.json';
import {
  countryByIso,
  countryIso,
  countryMacros,
  countryOptionsByRegion,
  eventCountrySet,
  matchCountries,
  countriesInRegion,
  eventInPlace,
  ALL_REGIONS,
  REGION_DISPLAY_ORDER,
} from './regions';

const tags = (...regions: string[]) => ({ regions });

describe('country helpers', () => {
  it('gives every country a unique two-letter ISO code, the key a challenge code stores', () => {
    const isos = Object.values(taxonomy.countries).map((c) => c.iso);
    expect(isos.every((iso) => /^[A-Z]{2}$/.test(iso))).toBe(true);
    expect(new Set(isos).size).toBe(isos.length);
    expect(countryByIso(countryIso('Germany') ?? '')).toBe('Germany');
  });

  it('puts a country in its region, and a transcontinental one in every side it spans', () => {
    expect(countryMacros('Germany')).toEqual(['Europe']);
    expect(countryMacros('Russia')).toEqual(['Europe', 'North & Central Asia']);
    expect(countryMacros('Antarctica')).toEqual([]);
    expect(countryMacros('Atlantis')).toEqual([]);
  });

  it('reads only the country tags of an event', () => {
    expect([...eventCountrySet(tags('Turkey', 'Europe'))]).toEqual(['Turkey']);
    expect(eventCountrySet({}).size).toBe(0);
  });

  it('shows regions alphabetically with Global last, leaving the share-code order alone', () => {
    expect(REGION_DISPLAY_ORDER[0]).toBe('East Asia');
    expect(REGION_DISPLAY_ORDER[REGION_DISPLAY_ORDER.length - 1]).toBe('Global');
    expect([...REGION_DISPLAY_ORDER].sort()).toEqual([...ALL_REGIONS].sort());
    expect(ALL_REGIONS[0]).toBe('Europe');
  });

  it('offers only countries present, most-tagged first, under each region they belong to', () => {
    const options = countryOptionsByRegion([
      tags('France'),
      tags('Germany', 'France'),
      tags('Austria'),
      tags('Germany'),
      tags('Russia', 'Europe'),
      tags('Global'),
    ]);
    expect(options.get('Europe')).toEqual(['France', 'Germany', 'Austria', 'Russia']);
    expect(options.get('North & Central Asia')).toEqual(['Russia']);
    expect(options.has('Global')).toBe(false);
    expect(options.has('East Asia')).toBe(false);
  });

  it('lists every taxonomy country of a region, a transcontinental one under each side', () => {
    expect(countriesInRegion('Europe')).toContain('Germany');
    expect(countriesInRegion('Europe')).toContain('Turkey');
    expect(countriesInRegion('Middle East & North Africa')).toContain('Turkey');
    expect(countriesInRegion('East Asia')).not.toContain('Germany');
    expect(countriesInRegion('Global')).toEqual([]);
  });

  it('places a daily theme by region rollup, or a country by its own tag', () => {
    expect(eventInPlace(tags('Germany'), 'Europe')).toBe(true);
    expect(eventInPlace(tags('Germany'), 'Germany')).toBe(true);
    expect(eventInPlace(tags('Germany'), 'East Asia')).toBe(false);
    expect(eventInPlace(tags('Turkey', 'Middle East & North Africa'), 'Turkey')).toBe(true);
    expect(eventInPlace(tags('Turkey', 'Middle East & North Africa'), 'Europe')).toBe(false);
  });
});

describe('matchCountries', () => {
  const options = countryOptionsByRegion([
    tags('Germany'),
    tags('Poland'),
    tags('Ireland'),
    tags('Turkey', 'Europe'),
    tags('Egypt'),
    tags('South Korea'),
    tags('North Korea'),
    tags('Japan'),
  ]);
  const view = (query: string, regions: string[]) =>
    matchCountries(options, query, regions).map((g) => [g.region, g.countries, g.selected]);

  it('lists every region with countries, selected or not, in display order', () => {
    expect(view('', ['Europe'])).toEqual([
      ['East Asia', ['Japan', 'North Korea', 'South Korea'], false],
      ['Europe', ['Germany', 'Ireland', 'Poland', 'Turkey'], true],
      ['Middle East & North Africa', ['Egypt', 'Turkey'], false],
    ]);
  });

  it('matches the start of any word, case-insensitively', () => {
    expect(view('kor', ['East Asia'])).toEqual([
      ['East Asia', ['North Korea', 'South Korea'], true],
    ]);
    expect(view('LAND', ['Europe'])).toEqual([]);
  });

  it('reaches unselected regions while searching, marked unselected', () => {
    expect(view('eg', ['Europe'])).toEqual([['Middle East & North Africa', ['Egypt'], false]]);
  });

  it('offers a transcontinental country under every side, each its own switch', () => {
    expect(view('tur', ['Europe'])).toEqual([
      ['Europe', ['Turkey'], true],
      ['Middle East & North Africa', ['Turkey'], false],
    ]);
  });
});
