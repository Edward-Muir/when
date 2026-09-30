import taxonomy from '../data/regions.json';
import {
  countryByIso,
  countryIso,
  countryMacros,
  countryOptionsByRegion,
  eventCountrySet,
  pruneCountries,
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
