import { filterByRegion, filterPool } from './eventLoader';
import { ALL_REGIONS } from './regions';
import { pairKey } from './countrySelection';
import { ALL_ERAS } from './eras';
import { HistoricalEvent } from '../types';

const card = (name: string, regions?: string[]): HistoricalEvent => ({
  name,
  friendly_name: name,
  year: 1900,
  category: 'empires',
  description: 'Test event',
  difficulty: 'medium',
  ...(regions ? { regions } : {}),
});

const pool = [
  card('tokyo', ['Japan']),
  card('paris', ['France']),
  card('istanbul', ['Turkey', 'Europe']),
  card('covid', ['China', 'Global']),
  card('oxidation', ['Global']),
  card('untagged'),
];
const names = (events: HistoricalEvent[]) => events.map((e) => e.name);

describe('filterByRegion', () => {
  it('is a no-op when every region is selected, so untagged cards still deal', () => {
    expect(filterByRegion(pool, [...ALL_REGIONS])).toBe(pool);
  });

  it('keeps cards whose countries roll up to a selected region', () => {
    expect(names(filterByRegion(pool, ['East Asia']))).toEqual(['tokyo', 'covid']);
  });

  it("uses a transcontinental country's named side", () => {
    expect(names(filterByRegion(pool, ['Europe']))).toEqual(['paris', 'istanbul']);
    expect(names(filterByRegion(pool, ['Middle East & North Africa']))).toEqual([]);
  });

  it('matches Global only against cards tagged Global', () => {
    expect(names(filterByRegion(pool, ['Global']))).toEqual(['covid', 'oxidation']);
  });

  it('never deals an untagged card into a narrowed game', () => {
    const everyRegionButOne = ALL_REGIONS.slice(1);
    expect(names(filterByRegion(pool, everyRegionButOne))).not.toContain('untagged');
  });
});

describe('filterByRegion with countries switched off', () => {
  const countryPool = [
    card('berlin', ['Germany']),
    card('bonn-paris', ['Germany', 'France']),
    card('paris', ['France']),
    card('alps', ['Europe']),
    card('cairo', ['Egypt']),
    card('moscow', ['Russia', 'Europe']),
    card('siberia', ['Russia', 'North & Central Asia']),
    card('untagged'),
  ];
  const off = (...pairs: [string, string][]) => pairs.map(([r, c]) => pairKey(r, c));

  it('changes nothing when nothing is switched off', () => {
    expect(filterByRegion(countryPool, ['Europe'], [])).toEqual(
      filterByRegion(countryPool, ['Europe'])
    );
  });

  it('drops a switched-off country, keeping cards another country still carries', () => {
    expect(names(filterByRegion(countryPool, ['Europe'], off(['Europe', 'France'])))).toEqual([
      'berlin',
      'bonn-paris',
      'moscow',
    ]);
  });

  it('drops cards tagged only with a region once any of its countries is off', () => {
    expect(names(filterByRegion(countryPool, ['Europe'], off(['Europe', 'France'])))).not.toContain(
      'alps'
    );
  });

  it('keeps a whole region whole beside a partial one', () => {
    expect(
      names(
        filterByRegion(
          countryPool,
          ['Europe', 'Middle East & North Africa'],
          off(['Europe', 'Germany'], ['Europe', 'Russia'])
        )
      )
    ).toEqual(['bonn-paris', 'paris', 'cairo']);
  });

  it('narrows even when every region is selected', () => {
    const narrowed = names(
      filterByRegion(countryPool, [...ALL_REGIONS], off(['Middle East & North Africa', 'Egypt']))
    );
    expect(narrowed).toEqual(['berlin', 'bonn-paris', 'paris', 'alps', 'moscow', 'siberia']);
    expect(narrowed).not.toContain('untagged');
  });

  it('switches a transcontinental country off one side only', () => {
    const regions = ['Europe', 'North & Central Asia'];
    expect(names(filterByRegion(countryPool, regions, off(['Europe', 'Russia'])))).toEqual([
      'berlin',
      'bonn-paris',
      'paris',
      'siberia',
    ]);
  });
});

describe('filterPool', () => {
  const filters = {
    difficulties: ['medium' as const],
    categories: ['empires' as const],
    eras: [...ALL_ERAS],
  };

  it('applies the region filter after the others, and skips it when regions are missing', () => {
    expect(filterPool(pool, filters)).toHaveLength(pool.length);
    expect(names(filterPool(pool, { ...filters, regions: ['East Asia'] }))).toEqual([
      'tokyo',
      'covid',
    ]);
    expect(filterPool(pool, { ...filters, eras: ['modern'], regions: ['East Asia'] })).toEqual([]);
  });
});
