import React from 'react';
import { Difficulty, Category, Era, ALL_CATEGORIES } from '../types';
import { ERA_DEFINITIONS } from '../utils/eras';

export interface FilterControlsProps {
  selectedDifficulties: Difficulty[];
  onDifficultiesChange: (difficulties: Difficulty[]) => void;
  selectedCategories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  selectedEras: Era[];
  onErasChange: (eras: Era[]) => void;
}

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
      {/* Difficulty selection */}
      <div>
        <label className="block text-sm font-medium text-text mb-2 font-body">
          Card Difficulty
        </label>
        <div className="flex gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => toggleDifficulty(difficulty)}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-body
                transition-all capitalize
                ${
                  selectedDifficulties.includes(difficulty)
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-border text-text-muted hover:bg-border/80'
                }
              `}
            >
              {difficulty}
            </button>
          ))}
        </div>
        {selectedDifficulties.length === 0 && (
          <p className="text-error text-xs mt-1 font-body">Select at least one difficulty</p>
        )}
      </div>

      {/* Category selection */}
      <div>
        <label className="block text-sm font-medium text-text mb-2 font-body">Categories</label>
        <div className="grid grid-cols-3 gap-2">
          {ALL_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`
                py-2 px-2 rounded-lg text-xs font-body
                transition-all capitalize
                ${
                  selectedCategories.includes(category)
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-border text-text-muted hover:bg-border/80'
                }
              `}
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
        <label className="block text-sm font-medium text-text mb-2 font-body">Eras</label>
        <div className="grid grid-cols-2 gap-2">
          {ERA_DEFINITIONS.map((era) => (
            <button
              key={era.id}
              onClick={() => toggleEra(era.id)}
              className={`
                py-2 px-2 rounded-lg text-xs font-body
                transition-all
                ${
                  selectedEras.includes(era.id)
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-border text-text-muted hover:bg-border/80'
                }
              `}
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
