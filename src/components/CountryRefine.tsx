import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import CountryPickerModal from './CountryPickerModal';

export interface CountryRefineProps {
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  /** Each region's pickable countries (`countryOptionsByRegion`). */
  countryOptions: Map<string, string[]>;
  matchCount?: number;
}

/**
 * The Regions group's "Countries" row: one line summarising the picks, opening the picker popup.
 * It replaced an inline panel that made the Custom card scroll too far. No pick in a region means
 * the whole region; the rules are in `filterByRegion` and docs/regions/index.md.
 */
const CountryRefine: React.FC<CountryRefineProps> = (props) => {
  const { selectedRegions, selectedCountries, countryOptions } = props;
  const [open, setOpen] = useState(false);
  const hasCountries = selectedRegions.some((r) => (countryOptions.get(r)?.length ?? 0) > 0);

  return (
    <>
      {hasCountries && (
        <button
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="mt-3 flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-border px-3 text-sm font-body"
        >
          <span className="flex-shrink-0 font-medium text-text">Countries</span>
          <span className="min-w-0 flex-1 truncate text-right text-text-muted">
            {selectedCountries.length === 0 ? 'All' : selectedCountries.join(', ')}
          </span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden />
        </button>
      )}
      <CountryPickerModal {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default CountryRefine;
