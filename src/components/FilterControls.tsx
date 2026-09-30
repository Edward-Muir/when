import React from 'react';
import { Difficulty, Category, Era, ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';
import { ALL_REGIONS, REGION_DISPLAY_ORDER } from '../utils/regions';
import CountryRefine from './CountryRefine';
import { RegionSelection, regionStatus, toggleRegion } from '../utils/countrySelection';
import { pillClass } from './filterPill';
import { usePillTap } from '../hooks/usePillTap';

const DIFFICULTY_LABELS = new Map<Difficulty, string>([
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
  ['very-hard', 'Expert'],
]);

export interface FilterControlsProps {
  selectedDifficulties: Difficulty[];
  onDifficultiesChange: (difficulties: Difficulty[]) => void;
  selectedCategories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  selectedEras: Era[];
  onErasChange: (eras: Era[]) => void;
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  // The Countries row shows only when all three are passed. Pairs switched off within the
  // selected regions (`src/utils/countrySelection.ts`); a region with any is drawn partial.
  excludedCountries?: string[];
  onExcludedChange?: (excluded: string[]) => void;
  countryOptions?: Map<string, string[]>;
  // Cards the selection deals, shown in the country picker, which hides the Play button.
  matchCount?: number;
  // When true, show an `n/N` (or `All`) selected-count next to each group header.
  showCounts?: boolean;
}

const GroupHeader: React.FC<{ label: string; count?: { selected: number; total: number } }> = ({
  label,
  count,
}) => (
  <div className="mb-1.5 flex items-center justify-between">
    <span className="text-xs font-medium uppercase tracking-wide text-text-muted font-body">
      {label}
    </span>
    {count && (
      <span className="text-xs font-medium text-text-muted font-body tabular-nums">
        {count.selected === count.total ? 'All' : `${count.selected}/${count.total}`}
      </span>
    )}
  </div>
);

const FilterControls: React.FC<FilterControlsProps> = ({
  selectedDifficulties,
  onDifficultiesChange,
  selectedCategories,
  onCategoriesChange,
  selectedEras,
  onErasChange,
  selectedRegions,
  onRegionsChange,
  excludedCountries,
  onExcludedChange,
  countryOptions,
  matchCount,
  showCounts = false,
}) => {
  const toggleDifficulty = (difficulty: Difficulty) => {
    onDifficultiesChange(
      selectedDifficulties.includes(difficulty)
        ? selectedDifficulties.filter((d) => d !== difficulty)
        : [...selectedDifficulties, difficulty]
    );
  };

  const toggleCategory = (category: Category) => {
    onCategoriesChange(
      selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category]
    );
  };

  const toggleEra = (era: Era) => {
    onErasChange(
      selectedEras.includes(era) ? selectedEras.filter((e) => e !== era) : [...selectedEras, era]
    );
  };

  // Regions are tri-state: off → whole, whole → off, partial → whole (its countries back on).
  const regionSelection: RegionSelection = {
    regions: selectedRegions,
    excluded: excludedCountries ?? [],
  };
  const applyRegionSelection = (next: RegionSelection) => {
    // Regions first: their prune runs on the old exclusions, so the new ones survive it.
    if (next.regions !== regionSelection.regions) onRegionsChange(next.regions);
    if (next.excluded !== regionSelection.excluded) onExcludedChange?.(next.excluded);
  };
  const tapRegion = (region: string) => applyRegionSelection(toggleRegion(regionSelection, region));
  // A double-tap isolates or restores regions; restoring every region also puts every country
  // back, so "all" means all.
  const setRegionsFromDoubleTap = (regions: string[]) => {
    onRegionsChange(regions);
    if (regions.length === ALL_REGIONS.length) onExcludedChange?.([]);
  };

  // Shared with the country picker, so every filter pill taps and double-taps alike.
  const handlePillTap = usePillTap();

  return (
    <div className="space-y-4">
      {/* Difficulty selection */}
      <div>
        <GroupHeader
          label="Card Difficulty"
          count={
            showCounts
              ? { selected: selectedDifficulties.length, total: ALL_DIFFICULTIES.length }
              : undefined
          }
        />
        <div className="flex flex-wrap gap-2">
          {ALL_DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              onClick={() =>
                handlePillTap(
                  difficulty,
                  String(difficulty),
                  selectedDifficulties,
                  ALL_DIFFICULTIES,
                  onDifficultiesChange,
                  toggleDifficulty
                )
              }
              className={pillClass(selectedDifficulties.includes(difficulty))}
            >
              {DIFFICULTY_LABELS.get(difficulty)}
            </button>
          ))}
        </div>
        {selectedDifficulties.length === 0 && (
          <p className="text-error text-xs mt-1 font-body">Select at least one difficulty</p>
        )}
      </div>

      {/* Category selection */}
      <div>
        <GroupHeader
          label="Categories"
          count={
            showCounts
              ? { selected: selectedCategories.length, total: ALL_CATEGORIES.length }
              : undefined
          }
        />
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() =>
                handlePillTap(
                  category,
                  String(category),
                  selectedCategories,
                  ALL_CATEGORIES,
                  onCategoriesChange,
                  toggleCategory
                )
              }
              className={pillClass(selectedCategories.includes(category))}
            >
              {category}
            </button>
          ))}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-error text-xs mt-1 font-body">Select at least one category</p>
        )}
      </div>

      {/* Era selection */}
      <div>
        <GroupHeader
          label="Eras"
          count={
            showCounts
              ? { selected: selectedEras.length, total: ERA_DEFINITIONS.length }
              : undefined
          }
        />
        <div className="flex flex-wrap gap-2">
          {ERA_DEFINITIONS.map((era) => (
            <button
              key={era.id}
              onClick={() =>
                handlePillTap(
                  era.id,
                  era.id,
                  selectedEras,
                  ERA_DEFINITIONS.map((e) => e.id),
                  onErasChange,
                  toggleEra
                )
              }
              className={pillClass(selectedEras.includes(era.id))}
            >
              {era.name}
            </button>
          ))}
        </div>
        {selectedEras.length === 0 && (
          <p className="text-error text-xs mt-1 font-body">Select at least one era</p>
        )}
      </div>

      {/* Region selection. Keys are prefixed: the double-tap ref is shared by every group. */}
      <div>
        <GroupHeader
          label="Regions"
          count={
            showCounts ? { selected: selectedRegions.length, total: ALL_REGIONS.length } : undefined
          }
        />
        <div className="flex flex-wrap gap-2">
          {REGION_DISPLAY_ORDER.map((region) => {
            const status = regionStatus(region, regionSelection);
            return (
              <button
                key={region}
                onClick={() =>
                  handlePillTap(
                    region,
                    `region:${region}`,
                    selectedRegions,
                    [...ALL_REGIONS],
                    setRegionsFromDoubleTap,
                    tapRegion
                  )
                }
                aria-pressed={status === 'partial' ? 'mixed' : status === 'full'}
                className={pillClass(status === 'partial' ? 'partial' : status === 'full')}
              >
                {region}
              </button>
            );
          })}
        </div>
        {selectedRegions.length === 0 && (
          <p className="text-error text-xs mt-1 font-body">Select at least one region</p>
        )}
        {excludedCountries && onExcludedChange && countryOptions && (
          <CountryRefine
            selectedRegions={selectedRegions}
            onRegionsChange={onRegionsChange}
            excludedCountries={excludedCountries}
            onExcludedChange={onExcludedChange}
            countryOptions={countryOptions}
            matchCount={matchCount}
          />
        )}
      </div>
    </div>
  );
};

export default FilterControls;
