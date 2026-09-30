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

/** The country tags on an event, ignoring its macro-region tags. */
export function eventCountrySet(event: Pick<HistoricalEvent, 'regions'>): Set<string> {
  return new Set((event.regions ?? []).filter((tag) => COUNTRIES.has(tag)));
}

/**
 * The countries the picker offers under each macro-region: only those present in `events`,
 * most-tagged first (then by name), so the long tail sits behind "more". A transcontinental
 * country is listed under every region it spans.
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
  const byRegion = new Map<string, string[]>();
  for (const country of counts.keys()) {
    for (const region of countryMacros(country)) {
      const list = byRegion.get(region) ?? [];
      list.push(country);
      byRegion.set(region, list);
    }
  }
  for (const list of byRegion.values()) {
    list.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b));
  }
  return byRegion;
}

/**
 * The picked countries still reachable once `regions` is the region selection: known names in
 * at least one selected region. Deselecting Europe drops Germany; Turkey survives while either
 * of its sides is selected.
 */
export function pruneCountries(countries: readonly string[], regions: readonly string[]): string[] {
  const selected = new Set(regions);
  return countries.filter((country) => countryMacros(country).some((r) => selected.has(r)));
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
