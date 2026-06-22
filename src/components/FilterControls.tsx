import React, { useRef } from 'react';
import { Difficulty, Category, Era, ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';

// Max gap (ms) between two taps on the same pill to count as a double-tap.
// 400ms matches macOS/Windows double-click defaults and sits just above
// WebKit's 350ms touch threshold. Safe to be generous since a single tap
// fires instantly (no debounce), so a wider window adds no input lag.
const DOUBLE_TAP_MS = 400;

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
  // When true, show an `n/N` (or `All`) selected-count next to each group header.
  showCounts?: boolean;
}

// Shared pill button shape. Selected = blue (accent-secondary); unselected = white outline.
const pillClass = (isSelected: boolean): string =>
  `px-3 py-1.5 rounded-full text-sm font-medium font-body transition-all active:scale-95 border capitalize ${
    isSelected
      ? 'bg-accent-secondary text-white border-transparent'
      : 'bg-surface text-text border-border hover:border-accent-secondary/50'
  }`;

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

  // Plotly-style tap handling. Single-tap toggles a pill INSTANTLY (no debounce,
  // so it never feels laggy). A second tap on the same pill within the window is
  // a double-tap: the two toggles cancel out (net no-op on that pill), so we
  // isolate to just that pill — or restore all if it was already the only one.
  // We act on the state captured at the first tap (`before`), not the live prop,
  // so the result is correct regardless of re-render timing. Works on touch too.
  const lastTap = useRef<{ key: string; time: number; before: unknown[] } | null>(null);

  function handlePillTap<T>(
    item: T,
    key: string,
    selected: T[],
    all: T[],
    onChange: (next: T[]) => void,
    toggle: (item: T) => void
  ) {
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && prev.key === key && now - prev.time < DOUBLE_TAP_MS) {
      // Double-tap: undo the flicker and isolate/restore from the pre-tap state.
      lastTap.current = null;
      const before = prev.before as T[];
      const wasOnlyThis = before.length === 1 && before[0] === item;
      onChange(wasOnlyThis ? [...all] : [item]); // restore all ↔ isolate one
    } else {
      // First tap: toggle immediately and remember the state for a possible double.
      lastTap.current = { key, time: now, before: selected };
      toggle(item);
    }
  }

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
    </div>
  );
};

export default FilterControls;
