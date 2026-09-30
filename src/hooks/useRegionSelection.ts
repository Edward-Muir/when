import { useState } from 'react';
import { pruneExclusions } from '../utils/countrySelection';

/**
 * The region chips and the countries switched off within them, kept consistent: deselecting a
 * region drops its exclusions, so a switch hidden with its region never goes on narrowing it.
 * Unknown pairs and orphaned exclusions in the initial values are dropped too.
 */
export function useRegionSelection(initialRegions: () => string[], initialExcluded?: string[]) {
  const [selectedRegions, setRegionsOnly] = useState<string[]>(initialRegions);
  const [excludedCountries, setExcludedCountries] = useState<string[]>(() =>
    pruneExclusions(initialExcluded ?? [], selectedRegions)
  );

  const setSelectedRegions = (regions: string[]) => {
    setRegionsOnly(regions);
    setExcludedCountries((excluded) => pruneExclusions(excluded, regions));
  };

  return { selectedRegions, setSelectedRegions, excludedCountries, setExcludedCountries };
}
