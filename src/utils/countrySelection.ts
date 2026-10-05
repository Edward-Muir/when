/**
 * The Custom and Timeline region filter's state: the selected macro-regions, plus the
 * (region, country) pairs switched off inside them. Nothing excluded means every country of
 * every selected region, so the default, stored and shared form of "everything" is empty.
 *
 * A pair rather than a country name, because Russia, Turkey and the three Caucasus states sit
 * in two regions each. Keyed by name, switching Russia off to narrow Europe would also cut it
 * (and every event tagged only "North & Central Asia") out of a whole North & Central Asia;
 * keyed by pair, each side is its own chip and its own switch. For every other country the pair
 * is simply its one region.
 *
 * The rules are docs/regions/index.md, "The country picker"; the filter is `filterByRegion`.
 */

import { countriesInRegion, countryMacros } from './regions';

export interface RegionSelection {
  regions: string[];
  /** `pairKey(region, country)` for each country switched off within a selected region. */
  excluded: string[];
}

export type RegionStatus = 'off' | 'full' | 'partial';

const SEPARATOR = '|';

export function pairKey(region: string, country: string): string {
  return `${region}${SEPARATOR}${country}`;
}

/** The region and country of a pair key, or undefined for anything else. */
export function parsePair(key: string): { region: string; country: string } | undefined {
  const at = key.indexOf(SEPARATOR);
  if (at <= 0) return undefined;
  const region = key.slice(0, at);
  const country = key.slice(at + 1);
  return countryMacros(country).includes(region) ? { region, country } : undefined;
}

/** Off when unselected, partial when any of its countries is switched off, else full. */
export function regionStatus(region: string, selection: RegionSelection): RegionStatus {
  if (!selection.regions.includes(region)) return 'off';
  const prefix = `${region}${SEPARATOR}`;
  return selection.excluded.some((key) => key.startsWith(prefix)) ? 'partial' : 'full';
}

export function isCountryOn(region: string, country: string, selection: RegionSelection): boolean {
  return (
    selection.regions.includes(region) && !selection.excluded.includes(pairKey(region, country))
  );
}

/**
 * The exclusions that still mean something: well-formed pairs inside a selected region, once
 * each. Deselecting a region drops its pairs, so a hidden switch never goes on narrowing it.
 */
export function pruneExclusions(excluded: readonly string[], regions: readonly string[]): string[] {
  const selected = new Set(regions);
  return [...new Set(excluded)].filter((key) => {
    const pair = parsePair(key);
    return pair !== undefined && selected.has(pair.region);
  });
}

/**
 * Tap a country chip. In a selected region it toggles; switching off the region's last listed
 * country turns the region off. In an unselected region (reached by search) it selects the
 * region with only that country on.
 *
 * `listed` is the region's countries as the picker offers them. "Only this one" excludes every
 * country of the region in the taxonomy, so the state says exactly that whatever the pool holds.
 */
export function toggleCountry(
  selection: RegionSelection,
  region: string,
  country: string,
  listed: readonly string[]
): RegionSelection {
  const key = pairKey(region, country);
  if (!selection.regions.includes(region)) {
    const others = countriesInRegion(region)
      .filter((c) => c !== country)
      .map((c) => pairKey(region, c));
    return {
      regions: [...selection.regions, region],
      excluded: [...selection.excluded, ...others],
    };
  }
  if (selection.excluded.includes(key)) {
    return { ...selection, excluded: selection.excluded.filter((k) => k !== key) };
  }
  const excluded = [...selection.excluded, key];
  const anyLeft = listed.some((c) => !excluded.includes(pairKey(region, c)));
  if (anyLeft) return { ...selection, excluded };
  const regions = selection.regions.filter((r) => r !== region);
  return { regions, excluded: pruneExclusions(excluded, regions) };
}

/** Every country of a selected region back on. */
export function selectWholeRegion(selection: RegionSelection, region: string): RegionSelection {
  const prefix = `${region}${SEPARATOR}`;
  const regions = selection.regions.includes(region)
    ? selection.regions
    : [...selection.regions, region];
  return { regions, excluded: selection.excluded.filter((key) => !key.startsWith(prefix)) };
}

/**
 * Set exactly which of a region's countries are on: a double-tap's isolate or restore. Every
 * listed country on is the whole region; none turns the region off; otherwise the region is
 * selected with every other country of it in the taxonomy switched off, like `toggleCountry`'s
 * "only this one".
 */
export function setRegionCountries(
  selection: RegionSelection,
  region: string,
  on: readonly string[],
  listed: readonly string[]
): RegionSelection {
  if (listed.every((c) => on.includes(c))) return selectWholeRegion(selection, region);
  const prefix = `${region}${SEPARATOR}`;
  const others = selection.excluded.filter((key) => !key.startsWith(prefix));
  if (on.length === 0) {
    return { regions: selection.regions.filter((r) => r !== region), excluded: others };
  }
  const regions = selection.regions.includes(region)
    ? selection.regions
    : [...selection.regions, region];
  const off = countriesInRegion(region)
    .filter((c) => !on.includes(c))
    .map((c) => pairKey(region, c));
  return { regions, excluded: [...others, ...off] };
}

/** Tap a region chip, like a tri-state checkbox: off → full, full → off, partial → full. */
export function toggleRegion(selection: RegionSelection, region: string): RegionSelection {
  if (regionStatus(region, selection) === 'full') {
    const regions = selection.regions.filter((r) => r !== region);
    return { regions, excluded: pruneExclusions(selection.excluded, regions) };
  }
  return selectWholeRegion(selection, region);
}

/**
 * Picks in the older pick model (share codes and settings in that format): a picked country
 * narrows every region it belongs to, so each such region keeps only its picked countries. A
 * selected region with no pick stays whole.
 *
 * Exact for every pool but one corner: under picks, a transcontinental pick deals its other
 * side's events even when that region is not selected (Russia picked under Europe deals
 * Siberian Russia). The converted selection deals only selected regions.
 */
export function legacyPicksToExclusions(
  regions: readonly string[],
  countries: readonly string[]
): string[] {
  const picked = new Set(countries);
  const refined = new Set(countries.flatMap(countryMacros));
  const excluded: string[] = [];
  for (const region of regions) {
    if (!refined.has(region)) continue;
    for (const country of countriesInRegion(region)) {
      if (!picked.has(country)) excluded.push(pairKey(region, country));
    }
  }
  return excluded;
}

/**
 * The Countries row's one-line summary. `All` with nothing off. When every selected region
 * that has countries is partial, the countries still on (named up to three); otherwise the
 * countries switched off (named up to two). Only countries the picker lists are counted.
 */
export function countrySummary(selection: RegionSelection, options: Map<string, string[]>): string {
  if (selection.excluded.length === 0) return 'All';
  const withCountries = selection.regions.filter((r) => (options.get(r)?.length ?? 0) > 0);
  const listed = (region: string) => options.get(region) ?? [];
  const unique = (names: string[]) => [...new Set(names)];

  if (withCountries.every((r) => regionStatus(r, selection) === 'partial')) {
    const on = unique(
      withCountries.flatMap((r) => listed(r).filter((c) => isCountryOn(r, c, selection)))
    );
    return on.length <= 3 ? on.join(', ') : `${on.length} countries`;
  }
  const off = unique(
    withCountries.flatMap((r) => listed(r).filter((c) => !isCountryOn(r, c, selection)))
  );
  return off.length <= 2 ? `All but ${off.join(', ')}` : `${off.length} countries off`;
}
