import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Modal from './ui/Modal';
import { matchCountries } from '../utils/regions';
import { pillClass } from './filterPill';

export interface CountryPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  /** Each region's pickable countries (`countryOptionsByRegion`). */
  countryOptions: Map<string, string[]>;
  /** Cards the current selection deals, shown on Done because the popup hides the Play count. */
  matchCount?: number;
}

const RegionCountries: React.FC<{
  region: string;
  countries: string[];
  selected: boolean;
  selectedCountries: string[];
  onPick: (country: string) => void;
  onClear: () => void;
}> = ({ region, countries, selected, selectedCountries, onPick, onClear }) => {
  const picked = countries.filter((c) => selectedCountries.includes(c)).length;
  const status = !selected ? (
    <span className="text-xs text-text-muted font-body">adds region</span>
  ) : picked === 0 ? (
    <span className="text-xs font-medium text-text-muted font-body">All</span>
  ) : (
    <button
      onClick={onClear}
      className="text-xs font-medium text-text-muted font-body tabular-nums hover:text-text"
    >
      {picked} picked · Clear
    </button>
  );

  return (
    <div>
      <div className="mb-1.5 flex min-h-[28px] items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted font-body">
          {region}
        </span>
        {status}
      </div>
      <div className="flex flex-wrap gap-2">
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => onPick(country)}
            aria-pressed={selectedCountries.includes(country)}
            className={pillClass(selectedCountries.includes(country), 'sm')}
          >
            {country}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * The country picker behind the Regions group's "Countries" row: a search box over the selected
 * regions' countries, grouped by region. A search also reaches regions not selected, and picking
 * from one selects that region too. Rules: `filterByRegion` and docs/regions/index.md.
 */
const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  open,
  onClose,
  selectedRegions,
  onRegionsChange,
  selectedCountries,
  onCountriesChange,
  countryOptions,
  matchCount,
}) => {
  const [query, setQuery] = useState('');
  const groups = matchCountries(countryOptions, query, selectedRegions);

  const close = () => {
    setQuery('');
    onClose();
  };

  const pick = (country: string, region: string, regionSelected: boolean) => {
    // Regions first: its prune runs on the old picks, so the new one survives it.
    if (!regionSelected) onRegionsChange([...selectedRegions, region]);
    onCountriesChange(
      selectedCountries.includes(country)
        ? selectedCountries.filter((c) => c !== country)
        : [...selectedCountries, country]
    );
  };

  const clearGroup = (countries: string[]) =>
    onCountriesChange(selectedCountries.filter((c) => !countries.includes(c)));

  return (
    <Modal
      open={open}
      onDismiss={close}
      layer="reveal"
      backdrop="scrim"
      widthClass="w-full max-w-md"
      rounded="2xl"
      shadow="xl"
      scroll="body"
      maxHeightClass="max-h-[85vh]"
      labelledBy="country-picker-title"
      header={
        <div className="space-y-3">
          <h2 id="country-picker-title" className="text-xl font-bold text-text font-display">
            Countries
          </h2>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 focus-within:border-accent">
            <Search className="h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries"
              aria-label="Search countries"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text font-body focus:outline-none"
            />
          </label>
        </div>
      }
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {groups.map((group) => (
          <RegionCountries
            key={group.region}
            region={group.region}
            countries={group.countries}
            selected={group.selected}
            selectedCountries={selectedCountries}
            onPick={(country) => pick(country, group.region, group.selected)}
            onClear={() => clearGroup(group.countries)}
          />
        ))}
        {groups.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted font-body">No matches</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-3">
        <button
          onClick={() => onCountriesChange([])}
          disabled={selectedCountries.length === 0}
          className="min-h-[44px] px-2 text-sm font-medium text-text-muted font-body hover:text-text disabled:opacity-40"
        >
          Clear all
        </button>
        <button
          onClick={close}
          className="min-h-[44px] flex-1 rounded-xl bg-accent-secondary px-4 text-sm font-semibold text-white font-body active:scale-95"
        >
          Done{matchCount !== undefined && ` · ${matchCount} events`}
        </button>
      </div>
    </Modal>
  );
};

export default CountryPickerModal;
