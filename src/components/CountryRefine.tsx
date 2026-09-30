import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ALL_REGIONS } from '../utils/regions';
import { pillClass } from './filterPill';

// Countries shown per region before its "more" toggle. The top few carry most of the cards;
// Europe alone lists 52.
const VISIBLE_COUNTRIES = 8;

export interface CountryRefineProps {
  selectedRegions: string[];
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  /** Each region's pickable countries, most-tagged first (`countryOptionsByRegion`). */
  countryOptions: Map<string, string[]>;
}

const RegionCountries: React.FC<{
  region: string;
  countries: string[];
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
}> = ({ region, countries, selectedCountries, onCountriesChange }) => {
  const [showAll, setShowAll] = useState(false);
  const picked = countries.filter((c) => selectedCountries.includes(c));
  const hidden = countries.length - VISIBLE_COUNTRIES;
  // A picked country stays visible even when it sits in the collapsed tail.
  const visible = showAll
    ? countries
    : countries.filter((c, i) => i < VISIBLE_COUNTRIES || selectedCountries.includes(c));

  const toggle = (country: string) =>
    onCountriesChange(
      selectedCountries.includes(country)
        ? selectedCountries.filter((c) => c !== country)
        : [...selectedCountries, country]
    );
  const clear = () => onCountriesChange(selectedCountries.filter((c) => !countries.includes(c)));

  return (
    <div>
      <div className="mb-1.5 flex min-h-[28px] items-center justify-between gap-2">
        <span className="text-xs font-medium text-text font-body">{region}</span>
        {picked.length === 0 ? (
          <span className="text-xs font-medium text-text-muted font-body">All</span>
        ) : (
          <button
            onClick={clear}
            className="text-xs font-medium text-text-muted font-body tabular-nums hover:text-text"
          >
            {picked.length} picked · Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((country) => (
          <button
            key={country}
            onClick={() => toggle(country)}
            aria-pressed={selectedCountries.includes(country)}
            className={pillClass(selectedCountries.includes(country), 'sm')}
          >
            {country}
          </button>
        ))}
        {hidden > 0 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="px-2.5 py-1 text-xs font-medium font-body text-text-muted hover:text-text"
          >
            {showAll ? 'Show fewer' : `+${hidden} more`}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * "Refine by country": a collapsed panel under the region chips listing, for each selected
 * region, the countries that narrow it. No pick in a region means the whole region; the rules
 * are in `filterByRegion` and docs/regions/index.md.
 */
const CountryRefine: React.FC<CountryRefineProps> = ({
  selectedRegions,
  selectedCountries,
  onCountriesChange,
  countryOptions,
}) => {
  const [expanded, setExpanded] = useState(false);
  const groups = ALL_REGIONS.filter((r) => selectedRegions.includes(r)).flatMap((region) => {
    const countries = countryOptions.get(region);
    return countries && countries.length > 0 ? [{ region, countries }] : [];
  });
  if (groups.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-border">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex min-h-[44px] w-full items-center justify-between px-3 text-sm font-medium text-text font-body"
      >
        <span>
          Refine by country
          {selectedCountries.length > 0 && (
            <span className="text-text-muted tabular-nums"> · {selectedCountries.length}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-border px-3 pb-3 pt-2">
          {groups.map(({ region, countries }) => (
            <RegionCountries
              key={region}
              region={region}
              countries={countries}
              selectedCountries={selectedCountries}
              onCountriesChange={onCountriesChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CountryRefine;
