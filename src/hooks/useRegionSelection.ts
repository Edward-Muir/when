import { useState } from 'react';
import { pruneCountries } from '../utils/regions';

/**
 * The region chips and the countries picked within them, kept consistent: deselecting a region
 * drops its countries, so a pick hidden with its region never goes on narrowing the pool.
 * Unknown names and orphaned countries in the initial values are dropped too.
 */
export function useRegionSelection(initialRegions: () => string[], initialCountries?: string[]) {
  const [selectedRegions, setRegionsOnly] = useState<string[]>(initialRegions);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(() =>
    pruneCountries(initialCountries ?? [], selectedRegions)
  );

  const setSelectedRegions = (regions: string[]) => {
    setRegionsOnly(regions);
    setSelectedCountries((countries) => pruneCountries(countries, regions));
  };

  return { selectedRegions, setSelectedRegions, selectedCountries, setSelectedCountries };
}
