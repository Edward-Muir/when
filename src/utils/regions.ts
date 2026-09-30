/**
 * Region tags: where on today's map an event happened.
 *
 * An event's `regions` array holds plain, readable names from `src/data/regions.json`, the
 * single source of truth shared with `scripts/events/region-spec.js`. Two kinds of name live
 * in one array, told apart by looking them up there rather than by any naming convention:
 *
 * - a **country** ("Germany", "Bahamas"), tagged by present-day borders so no tag depends on
 *   when a state existed; a Bronze Age find in Saxony is "Germany";
 * - a **macro-region** ("Europe", "Global"), written explicitly only where no country says it:
 *   a footprint too wide for a handful of countries, or the side of a transcontinental country
 *   (Russia, Turkey) the event sits on.
 *
 * A country rolls up to its macro-region, so `["Germany"]` is already in Europe and the tag
 * "Europe" beside it would be redundant (the apply script drops it). The rules for choosing
 * tags are in docs/regions/tagging-spec.md.
 */

import taxonomy from '../data/regions.json';
import type { HistoricalEvent } from '../types';

interface CountryEntry {
  iso: string;
  /** The macro-region every event in this country rolls up to. */
  region?: string;
  /** Transcontinental: no automatic rollup, so an event must name one of these explicitly. */
  spans?: string[];
}

const COUNTRIES = new Map<string, CountryEntry>(Object.entries(taxonomy.countries));

/** The macro-regions in display order. `Global` is last and is a region like the others. */
export const ALL_REGIONS: readonly string[] = taxonomy.regions;

export const GLOBAL_REGION = 'Global';

/**
 * The order the chips show regions in: alphabetical, with Global last because it is not a place.
 * Display only. `ALL_REGIONS` keeps the taxonomy order, which is the share code's bit order.
 */
export const REGION_DISPLAY_ORDER: readonly string[] = [
  ...ALL_REGIONS.filter((r) => r !== GLOBAL_REGION).sort((a, b) => a.localeCompare(b)),
  GLOBAL_REGION,
];

const REGION_SET = new Set(ALL_REGIONS);

export function isRegionName(tag: string): boolean {
  return REGION_SET.has(tag);
}

export function isCountryName(tag: string): boolean {
  return COUNTRIES.has(tag);
}

/**
 * The macro-regions an event belongs to: its explicit region tags plus the regions its
 * countries roll up to. A transcontinental country, and Antarctica, contribute nothing here;
 * the explicit tag beside them carries the region. An untagged event belongs to none.
 */
export function eventRegionSet(event: Pick<HistoricalEvent, 'regions'>): Set<string> {
  const out = new Set<string>();
  for (const tag of event.regions ?? []) {
    if (REGION_SET.has(tag)) {
      out.add(tag);
      continue;
    }
    const region = COUNTRIES.get(tag)?.region;
    if (region) out.add(region);
  }
  return out;
}

/**
 * The macro-regions a country belongs to for the country picker: its rollup region, or every
 * region a transcontinental country spans. Antarctica, and an unknown name, belong to none.
 */
export function countryMacros(name: string): string[] {
  const entry = COUNTRIES.get(name);
  if (!entry) return [];
  return entry.spans ?? (entry.region ? [entry.region] : []);
}

const COUNTRIES_BY_REGION = new Map<string, string[]>();
for (const name of COUNTRIES.keys()) {
  for (const region of countryMacros(name)) {
    COUNTRIES_BY_REGION.set(region, [...(COUNTRIES_BY_REGION.get(region) ?? []), name]);
  }
}

/** Every taxonomy country in a region, a transcontinental one under each side it spans. */
export function countriesInRegion(region: string): readonly string[] {
  return COUNTRIES_BY_REGION.get(region) ?? [];
}

/**
 * Whether an event belongs to a daily theme's place: a region through `eventRegionSet`, a country
 * by its own tag, whichever side of a transcontinental country the event sits.
 */
export function eventInPlace(event: Pick<HistoricalEvent, 'regions'>, place: string): boolean {
  return REGION_SET.has(place)
    ? eventRegionSet(event).has(place)
    : (event.regions ?? []).includes(place);
}

/** The country tags on an event, ignoring its macro-region tags. */
export function eventCountrySet(event: Pick<HistoricalEvent, 'regions'>): Set<string> {
  return new Set((event.regions ?? []).filter((tag) => COUNTRIES.has(tag)));
}

/**
 * The countries the picker offers under each macro-region: only those present in `events`,
 * most-tagged first (then by name), so the few that carry most of the cards lead and the long
 * tail sits behind "more". A transcontinental country is listed under every region it spans.
 */
export function countryOptionsByRegion(
  events: Pick<HistoricalEvent, 'regions'>[]
): Map<string, string[]> {
  const counts = new Map<string, number>();
  for (const event of events) {
    for (const country of eventCountrySet(event)) {
      counts.set(country, (counts.get(country) ?? 0) + 1);
    }
  }
  const byCount = (a: string, b: string) =>
    (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b);
  const byRegion = new Map<string, string[]>();
  for (const country of [...counts.keys()].sort(byCount)) {
    for (const region of countryMacros(country)) {
      const list = byRegion.get(region) ?? [];
      list.push(country);
      byRegion.set(region, list);
    }
  }
  return byRegion;
}

export interface CountryGroup {
  region: string;
  countries: string[];
  /** False for a region the player has not selected: picking from it adds the region. */
  selected: boolean;
}

/** Whether `query` (already lower-cased) starts any word of `name`: "kor" finds South Korea. */
function matchesWordStart(name: string, query: string): boolean {
  const lower = name.toLowerCase();
  return lower.startsWith(query) || lower.includes(` ${query}`) || lower.includes(`-${query}`);
}

/**
 * The picker's groups, in display order: every region with countries, selected or not, so a
 * region never vanishes from under the player when its last country is switched off. A query
 * keeps only the matching countries. A transcontinental country is listed under each side, and
 * each side is its own switch.
 */
export function matchCountries(
  options: Map<string, string[]>,
  query: string,
  selectedRegions: readonly string[]
): CountryGroup[] {
  const q = query.trim().toLowerCase();
  const groups: CountryGroup[] = [];
  for (const region of REGION_DISPLAY_ORDER) {
    const selected = selectedRegions.includes(region);
    const countries = (options.get(region) ?? []).filter((c) => !q || matchesWordStart(c, q));
    if (countries.length > 0) groups.push({ region, countries, selected });
  }
  return groups;
}

/** A country's ISO 3166-1 alpha-2 code, the stable key a challenge code stores it by. */
export function countryIso(name: string): string | undefined {
  return COUNTRIES.get(name)?.iso;
}

const COUNTRY_BY_ISO = new Map<string, string>(
  Array.from(COUNTRIES, ([name, entry]) => [entry.iso, name])
);

export function countryByIso(iso: string): string | undefined {
  return COUNTRY_BY_ISO.get(iso);
}
