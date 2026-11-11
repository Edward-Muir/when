import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Difficulty, Category, Era, ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';
import { ALL_REGIONS, REGION_DISPLAY_ORDER } from '../utils/regions';
import CountryRefine from './CountryRefine';
import { RegionSelection, regionStatus, toggleRegion } from '../utils/countrySelection';
import FilterPill from './FilterPill';
import FilterGroupHeader, { FilterGroupActions, listGroupActions } from './FilterGroupHeader';
import { usePillTap } from '../hooks/usePillTap';
import {
  DIFFICULTY_NAMES,
  GroupSummary,
  categorySummary,
  difficultySummary,
  eraSummary,
  regionSummary,
} from '../utils/filterSummary';

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
  /**
   * Fold each group to one 44px row stating its setting (the Custom tab). A tap opens the group
   * in place, one at a time. Off by default: My Timeline's filter popup shows every group open.
   */
  collapsible?: boolean;
}

type GroupKey = 'difficulty' | 'categories' | 'eras' | 'regions';

/** A folded group's row: its title, its summary, and whether it is the one open. */
interface Fold {
  title: string;
  summary: GroupSummary;
  open: boolean;
  onToggle: () => void;
}

/** One group open at a time; tapping the open one folds it. `undefined` when not folding. */
function useFolds(collapsible: boolean) {
  const [openGroup, setOpenGroup] = useState<GroupKey | null>(null);
  return (key: GroupKey, title: string, summary: GroupSummary): Fold | undefined =>
    collapsible
      ? {
          title,
          summary,
          open: openGroup === key,
          onToggle: () => setOpenGroup((current) => (current === key ? null : key)),
        }
      : undefined;
}

/**
 * Scroll the nearest vertical scroller just enough to show a group that has opened below its
 * fold, but never past the group's own row. Done on the scroller rather than with
 * `scrollIntoView`, which would also nudge the horizontal pager the panel sits in.
 */
function revealOpenedGroup(group: HTMLElement) {
  const scroller = group.parentElement?.closest<HTMLElement>('.overflow-y-auto');
  if (!scroller) return;
  const box = scroller.getBoundingClientRect();
  const rect = group.getBoundingClientRect();
  const overflow = rect.bottom - box.bottom;
  if (overflow <= 0) return;
  const toRowTop = rect.top - box.top;
  scroller.scrollBy({ top: Math.min(overflow + 8, toRowTop), behavior: 'smooth' });
}

/** The 44px row a folded group shows: "Categories ... Science  v", teal when not the default. */
const FoldRow: React.FC<{ fold: Fold; controls: string }> = ({ fold, controls }) => (
  <button
    type="button"
    onClick={fold.onToggle}
    aria-expanded={fold.open}
    aria-controls={controls}
    className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-sm font-body"
  >
    <span className="flex-shrink-0 font-medium text-text">{fold.title}</span>
    <span
      className={`min-w-0 flex-1 truncate text-right ${
        fold.summary.changed ? 'font-semibold text-accent-secondary' : 'text-text-muted'
      }`}
    >
      {fold.summary.text}
    </span>
    <ChevronDown
      className={`h-4 w-4 flex-shrink-0 text-text-muted transition-transform ${
        fold.open ? 'rotate-180' : ''
      }`}
      aria-hidden
    />
  </button>
);

/**
 * One filter group: its header (label, count, Select all / Clear), its chips, and a quiet
 * prompt when it is empty. An empty group is a normal step on the way to a selection (Clear,
 * then pick), so the prompt is muted rather than an error; Play stays disabled meanwhile.
 * The prompt's line is always there, blank while the group has a pick, so the prompt
 * appearing never pushes the groups below it down.
 */
const FilterGroup: React.FC<{
  label: string;
  /** Names one option in the empty prompt: "Pick at least one {noun}". */
  noun: string;
  selectedCount: number;
  total: number;
  showCount: boolean;
  actions: FilterGroupActions;
  /** Folded into a row (Custom). The open group shows the same header, chips and prompt. */
  fold?: Fold;
  children: React.ReactNode;
}> = ({ label, noun, selectedCount, total, showCount, actions, fold, children }) => {
  const bodyId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const opened = fold?.open ?? false;
  useEffect(() => {
    if (opened && groupRef.current) revealOpenedGroup(groupRef.current);
  }, [opened]);

  const body = (
    <>
      <FilterGroupHeader
        label={label}
        count={showCount && !fold ? { selected: selectedCount, total } : undefined}
        labelHidden={!!fold}
        {...actions}
      />
      <div className="flex flex-wrap gap-2">{children}</div>
      <p className="mt-1 h-4 text-xs leading-4 text-text-muted font-body" aria-live="polite">
        {actions.noneOn ? `Pick at least one ${noun}` : ''}
      </p>
    </>
  );
  if (!fold) return <div>{body}</div>;
  return (
    <div ref={groupRef}>
      <FoldRow fold={fold} controls={bodyId} />
      {fold.open && (
        <div id={bodyId} className="px-3 pb-2 pt-1">
          {body}
        </div>
      )}
    </div>
  );
};

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
  collapsible = false,
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
  const fold = useFolds(collapsible);

  const countries = excludedCountries && onExcludedChange && countryOptions && (
    <CountryRefine
      selectedRegions={selectedRegions}
      onRegionsChange={onRegionsChange}
      excludedCountries={excludedCountries}
      onExcludedChange={onExcludedChange}
      countryOptions={countryOptions}
      matchCount={matchCount}
      asRow={collapsible}
    />
  );

  return (
    <div className={collapsible ? 'fold-list overflow-hidden rounded-2xl bg-surface' : 'space-y-1'}>
      <FilterGroup
        label="Card Difficulty"
        noun="difficulty"
        selectedCount={selectedDifficulties.length}
        total={ALL_DIFFICULTIES.length}
        showCount={showCounts}
        actions={listGroupActions(selectedDifficulties, ALL_DIFFICULTIES, onDifficultiesChange)}
        fold={fold('difficulty', 'Difficulty', difficultySummary(selectedDifficulties))}
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
            {DIFFICULTY_NAMES.get(difficulty)}
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
        fold={fold('categories', 'Categories', categorySummary(selectedCategories))}
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
        fold={fold('eras', 'Eras', eraSummary(selectedEras))}
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

      {/* Region selection. Keys are prefixed: the double-tap ref is shared by every group.
          Folded, the Countries row is a row of its own; open, it sits under the region chips. */}
      <div>
        <FilterGroup
          label="Regions"
          noun="region"
          selectedCount={regionStatuses.filter((r) => r.status === 'full').length}
          total={ALL_REGIONS.length}
          showCount={showCounts}
          actions={regionActions}
          fold={fold('regions', 'Regions', regionSummary(selectedRegions))}
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
        {!collapsible && countries}
      </div>
      {collapsible && <div>{countries}</div>}
    </div>
  );
};

export default FilterControls;
