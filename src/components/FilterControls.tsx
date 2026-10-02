import React from 'react';
import { Difficulty, Category, Era, ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';
import { ALL_REGIONS, REGION_DISPLAY_ORDER } from '../utils/regions';
import CountryRefine from './CountryRefine';
import { RegionSelection, regionStatus, toggleRegion } from '../utils/countrySelection';
import FilterPill from './FilterPill';
import FilterGroupHeader, { FilterGroupActions, listGroupActions } from './FilterGroupHeader';
import { usePillTap } from '../hooks/usePillTap';

const DIFFICULTY_LABELS = new Map<Difficulty, string>([
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
  ['very-hard', 'Expert'],
]);

const ERA_IDS = ERA_DEFINITIONS.map((e) => e.id);

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

/**
 * One filter group: its header (label, count, Select all / Clear), its chips, and a quiet
 * prompt when it is empty. An empty group is a normal step on the way to a selection (Clear,
 * then pick), so the prompt is muted rather than an error; Play stays disabled meanwhile.
 */
const FilterGroup: React.FC<{
  label: string;
  /** Names one option in the empty prompt: "Pick at least one {noun}". */
  noun: string;
  selectedCount: number;
  total: number;
  showCount: boolean;
  actions: FilterGroupActions;
  children: React.ReactNode;
}> = ({ label, noun, selectedCount, total, showCount, actions, children }) => (
  <div>
    <FilterGroupHeader
      label={label}
      count={showCount ? { selected: selectedCount, total } : undefined}
      {...actions}
    />
    <div className="flex flex-wrap gap-2">{children}</div>
    {actions.noneOn && (
      <p className="text-text-muted text-xs mt-1 font-body">Pick at least one {noun}</p>
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
  // Select all likewise means every region with every country; Clear drops the exclusions too.
  // The count is of ticked chips, so a partial region keeps it off `All` while Select all is live.
  const regionStatuses = REGION_DISPLAY_ORDER.map((region) => ({
    region,
    status: regionStatus(region, regionSelection),
  }));
  const regionActions: FilterGroupActions = {
    allOn: selectedRegions.length === ALL_REGIONS.length && regionSelection.excluded.length === 0,
    noneOn: selectedRegions.length === 0,
    onSelectAll: () => applyRegionSelection({ regions: [...ALL_REGIONS], excluded: [] }),
    onClear: () => applyRegionSelection({ regions: [], excluded: [] }),
  };

  // Shared with the country picker, so every filter pill taps and double-taps alike.
  const handlePillTap = usePillTap();

  return (
    <div className="space-y-4">
      <FilterGroup
        label="Card Difficulty"
        noun="difficulty"
        selectedCount={selectedDifficulties.length}
        total={ALL_DIFFICULTIES.length}
        showCount={showCounts}
        actions={listGroupActions(selectedDifficulties, ALL_DIFFICULTIES, onDifficultiesChange)}
      >
        {ALL_DIFFICULTIES.map((difficulty) => (
          <FilterPill
            key={difficulty}
            state={selectedDifficulties.includes(difficulty)}
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
          >
            {DIFFICULTY_LABELS.get(difficulty)}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup
        label="Categories"
        noun="category"
        selectedCount={selectedCategories.length}
        total={ALL_CATEGORIES.length}
        showCount={showCounts}
        actions={listGroupActions(selectedCategories, ALL_CATEGORIES, onCategoriesChange)}
      >
        {ALL_CATEGORIES.map((category) => (
          <FilterPill
            key={category}
            state={selectedCategories.includes(category)}
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
          >
            {category}
          </FilterPill>
        ))}
      </FilterGroup>

      <FilterGroup
        label="Eras"
        noun="era"
        selectedCount={selectedEras.length}
        total={ERA_IDS.length}
        showCount={showCounts}
        actions={listGroupActions(selectedEras, ERA_IDS, onErasChange)}
      >
        {ERA_DEFINITIONS.map((era) => (
          <FilterPill
            key={era.id}
            state={selectedEras.includes(era.id)}
            onClick={() =>
              handlePillTap(era.id, era.id, selectedEras, ERA_IDS, onErasChange, toggleEra)
            }
          >
            {era.name}
          </FilterPill>
        ))}
      </FilterGroup>

      {/* Region selection. Keys are prefixed: the double-tap ref is shared by every group. */}
      <div>
        <FilterGroup
          label="Regions"
          noun="region"
          selectedCount={regionStatuses.filter((r) => r.status === 'full').length}
          total={ALL_REGIONS.length}
          showCount={showCounts}
          actions={regionActions}
        >
          {regionStatuses.map(({ region, status }) => (
            <FilterPill
              key={region}
              state={status === 'partial' ? 'partial' : status === 'full'}
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
            >
              {region}
            </FilterPill>
          ))}
        </FilterGroup>
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
