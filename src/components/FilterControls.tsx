import React from 'react';
import { Difficulty, Category, Era, ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';

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
}

// Shared pill button shape. Selected = blue (accent-secondary); unselected = white outline.
const pillClass = (isSelected: boolean): string =>
  `px-3 py-1.5 rounded-full text-sm font-medium font-body transition-all active:scale-95 border capitalize ${
    isSelected
      ? 'bg-accent-secondary text-white border-transparent'
      : 'bg-surface text-text border-border hover:border-accent-secondary/50'
  }`;

const GroupHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="mb-1.5">
    <span className="text-xs font-medium uppercase tracking-wide text-text-muted font-body">
      {label}
    </span>
  </div>
);

const FilterControls: React.FC<FilterControlsProps> = ({
  selectedDifficulties,
  onDifficultiesChange,
  selectedCategories,
  onCategoriesChange,
  selectedEras,
  onErasChange,
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

  return (
    <div className="space-y-4">
      {/* Category selection */}
      <div>
        <GroupHeader label="Categories" />
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
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
        <GroupHeader label="Eras" />
        <div className="flex flex-wrap gap-2">
          {ERA_DEFINITIONS.map((era) => (
            <button
              key={era.id}
              onClick={() => toggleEra(era.id)}
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

      {/* Difficulty selection */}
      <div>
        <GroupHeader label="Card Difficulty" />
        <div className="flex flex-wrap gap-2">
          {ALL_DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => toggleDifficulty(difficulty)}
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
    </div>
  );
};

export default FilterControls;
