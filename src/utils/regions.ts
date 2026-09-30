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
