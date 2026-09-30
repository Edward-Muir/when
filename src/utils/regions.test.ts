import taxonomy from '../data/regions.json';
import {
  countryByIso,
  countryIso,
  countryMacros,
  countryOptionsByRegion,
  eventCountrySet,
  matchCountries,
  pruneCountries,
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

  it('prunes countries whose regions are all deselected, and unknown names', () => {
    expect(pruneCountries(['Germany', 'Japan', 'Atlantis'], ['East Asia'])).toEqual(['Japan']);
    expect(pruneCountries(['Turkey'], ['Middle East & North Africa'])).toEqual(['Turkey']);
    expect(pruneCountries(['Turkey'], ['Global'])).toEqual([]);
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

  it('lists every country of the selected regions when there is no query', () => {
    expect(view('', ['Europe'])).toEqual([
      ['Europe', ['Germany', 'Ireland', 'Poland', 'Turkey'], true],
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

  it('does not offer a transcontinental country again under a side not selected', () => {
    expect(view('tur', ['Europe'])).toEqual([['Europe', ['Turkey'], true]]);
    expect(view('tur', ['East Asia'])).toEqual([
      ['Europe', ['Turkey'], false],
      ['Middle East & North Africa', ['Turkey'], false],
    ]);
  });
});
