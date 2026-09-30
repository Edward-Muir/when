import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Modal from './ui/Modal';
import { matchCountries } from '../utils/regions';
import { pillClass } from './filterPill';
import {
  RegionSelection,
  RegionStatus,
  isCountryOn,
  regionStatus,
  selectWholeRegion,
  toggleCountry,
} from '../utils/countrySelection';

// Countries shown per region before its "more" toggle, while not searching. The first few
// carry most of the cards; Europe alone lists 52.
const VISIBLE_COUNTRIES = 8;

export interface CountryPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  /** Pairs switched off within the selected regions (`src/utils/countrySelection.ts`). */
  excludedCountries: string[];
  onExcludedChange: (excluded: string[]) => void;
  /** Each region's pickable countries (`countryOptionsByRegion`). */
  countryOptions: Map<string, string[]>;
  /** Cards the current selection deals, shown on Done because the popup hides the Play count. */
  matchCount?: number;
}

const RegionCountries: React.FC<{
  region: string;
  countries: string[];
  status: RegionStatus;
  /** Cap the list at the most-tagged few behind "+N more"; off while searching. */
  capped: boolean;
  isOn: (country: string) => boolean;
  onPick: (country: string) => void;
  onSelectAll: () => void;
}> = ({ region, countries, status, capped, isOn, onPick, onSelectAll }) => {
  const [showAll, setShowAll] = useState(false);
  const hidden = capped && !showAll ? countries.length - VISIBLE_COUNTRIES : 0;
  // In a partial region the countries still on stay visible even in the collapsed tail, so
  // "only Portugal" never hides the one chip that is on.
  const visible =
    hidden > 0
      ? countries.filter((c, i) => i < VISIBLE_COUNTRIES || (status === 'partial' && isOn(c)))
      : countries;
  const canCollapse = capped && showAll && countries.length > VISIBLE_COUNTRIES;
  const onCount = countries.filter(isOn).length;
  const header =
    status === 'off' ? (
      <span className="text-xs text-text-muted font-body">adds region</span>
    ) : status === 'full' ? (
      <span className="text-xs font-medium text-text-muted font-body">All</span>
    ) : (
      <button
        onClick={onSelectAll}
        className="text-xs font-medium text-text-muted font-body tabular-nums hover:text-text"
      >
        {onCount} of {countries.length} · All
      </button>
    );

  return (
    <div>
      <div className="mb-1.5 flex min-h-[28px] items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted font-body">
          {region}
        </span>
        {header}
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((country) => (
          <button
            key={country}
            onClick={() => onPick(country)}
            aria-pressed={isOn(country)}
            className={pillClass(isOn(country), 'sm')}
          >
            {country}
          </button>
        ))}
        {(hidden > 0 || canCollapse) && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="px-2.5 py-1 text-xs font-medium font-body text-text-muted hover:text-text"
          >
            {canCollapse ? 'Show fewer' : `+${hidden} more`}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * The country picker behind the Regions group's "Countries" row: a search box over the selected
 * regions' countries, grouped by region. Every country starts on, and a chip is blue exactly
 * when its cards are in the deck. A search also reaches regions not selected, and picking from
 * one selects that region with only that country. Rules: `src/utils/countrySelection.ts`.
 */
const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  open,
  onClose,
  selectedRegions,
  onRegionsChange,
  excludedCountries,
  onExcludedChange,
  countryOptions,
  matchCount,
}) => {
  const [query, setQuery] = useState('');
  const groups = matchCountries(countryOptions, query, selectedRegions);
  const selection: RegionSelection = { regions: selectedRegions, excluded: excludedCountries };

  const close = () => {
    setQuery('');
    onClose();
  };

  const apply = (next: RegionSelection) => {
    // Regions first: their prune runs on the old exclusions, so the new ones survive it.
    if (next.regions !== selection.regions) onRegionsChange(next.regions);
    if (next.excluded !== selection.excluded) onExcludedChange(next.excluded);
  };

  const pick = (region: string, country: string) =>
    apply(toggleCountry(selection, region, country, countryOptions.get(region) ?? []));

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
      // Not `vh`: iOS Safari measures vh as if its toolbars were hidden, so an expanded list
      // spilled off both ends. 100% of the backdrop is the visible screen, minus its padding.
      maxHeightClass="max-h-full"
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
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-text font-body focus:outline-none"
            />
          </label>
        </div>
      }
    >
      {/* overscroll-contain: at the list's end, a swipe must not scroll the page behind. */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3">
        {groups.map((group) => (
          <RegionCountries
            key={group.region}
            region={group.region}
            countries={group.countries}
            status={regionStatus(group.region, selection)}
            capped={query.trim() === ''}
            isOn={(country) => isCountryOn(group.region, country, selection)}
            onPick={(country) => pick(group.region, country)}
            onSelectAll={() => apply(selectWholeRegion(selection, group.region))}
          />
        ))}
        {groups.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted font-body">No matches</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-3">
        <button
          onClick={() => onExcludedChange([])}
          disabled={excludedCountries.length === 0}
          className="min-h-[44px] px-2 text-sm font-medium text-text-muted font-body hover:text-text disabled:opacity-40"
        >
          Select all
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
