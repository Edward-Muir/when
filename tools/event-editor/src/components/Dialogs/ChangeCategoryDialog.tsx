import { useState } from 'react';
import { FolderInput } from 'lucide-react';

interface ChangeCategoryDialogProps {
  currentCategory: string;
  categories: string[];
  onClose: () => void;
  onConfirm: (newCategory: string) => Promise<void>;
}

export function ChangeCategoryDialog({
  currentCategory,
  categories,
  onClose,
  onConfirm,
}: ChangeCategoryDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [isMoving, setIsMoving] = useState(false);

  const handleConfirm = async () => {
    if (selectedCategory === currentCategory) {
      onClose();
      return;
    }

    setIsMoving(true);
    try {
      await onConfirm(selectedCategory);
    } catch {
      setIsMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <FolderInput className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-text">Change Category</h2>
        </div>

        <p className="mb-4 text-sm text-text-secondary">
          Select a new category for this event. The event will be moved to the selected category's
          JSON file.
        </p>

        <div className="mb-6 space-y-2">
          {categories.map((category) => (
            <label
              key={category}
              className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors ${
                selectedCategory === category
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:bg-bg-secondary'
              }`}
            >
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedCategory === category}
                onChange={() => setSelectedCategory(category)}
                className="h-4 w-4 text-accent focus:ring-accent"
              />
              <span className="text-sm font-medium text-text">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
              {category === currentCategory && (
                <span className="text-xs text-text-secondary">(current)</span>
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isMoving}
            className="rounded border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isMoving || selectedCategory === currentCategory}
            className="rounded bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMoving ? 'Moving...' : 'Move Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
