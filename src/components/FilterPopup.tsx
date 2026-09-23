import React from 'react';
import { X } from 'lucide-react';
import { Difficulty, Category, Era } from '../types';
import FilterControls from './FilterControls';
import Modal from './ui/Modal';

interface FilterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  filteredCount: number;
  totalCount: number;
  selectedDifficulties: Difficulty[];
  setSelectedDifficulties: (difficulties: Difficulty[]) => void;
  selectedCategories: Category[];
  setSelectedCategories: (categories: Category[]) => void;
  selectedEras: Era[];
  setSelectedEras: (eras: Era[]) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
  isOpen,
  onClose,
  filteredCount,
  totalCount,
  selectedDifficulties,
  setSelectedDifficulties,
  selectedCategories,
  setSelectedCategories,
  selectedEras,
  setSelectedEras,
}) => {
  return (
    <Modal
      open={isOpen}
      onDismiss={onClose}
      backdrop="scrim"
      widthClass="w-full max-w-md"
      rounded="2xl"
      shadow="xl"
      scroll="card"
      maxHeightClass="max-h-[85vh]"
      cardClassName="p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-text font-display">Filter Timeline</h2>
        <button onClick={onClose} className="p-2 hover:bg-border rounded-full transition-colors">
          <X className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {/* Filter Controls */}
      <FilterControls
        selectedDifficulties={selectedDifficulties}
        onDifficultiesChange={setSelectedDifficulties}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        selectedEras={selectedEras}
        onErasChange={setSelectedEras}
      />

      {/* Event counter */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between text-sm text-text-muted font-body">
          <span>Showing:</span>
          <span className={filteredCount === 0 ? 'text-error font-medium' : ''}>
            {filteredCount} of {totalCount} events
          </span>
        </div>
        {filteredCount === 0 && (
          <p className="text-error text-xs mt-2 font-body">
            No events match your filters. Select more options.
          </p>
        )}
      </div>

      {/* Done button */}
      <button
        onClick={onClose}
        className="w-full mt-4 py-3 px-6 bg-accent hover:bg-accent/90 text-white font-medium rounded-xl transition-colors font-body"
      >
        Done
      </button>
    </Modal>
  );
};

export default FilterPopup;
