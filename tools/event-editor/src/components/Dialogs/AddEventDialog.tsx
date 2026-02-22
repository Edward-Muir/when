import { useState } from 'react';
import { X } from 'lucide-react';
import type { HistoricalEvent, Difficulty } from '../../types';
import { ALL_DIFFICULTIES } from '../../types';

interface AddEventDialogProps {
  onClose: () => void;
  onAdd: (category: string, event: HistoricalEvent) => Promise<void>;
  existingNames: string[];
  categories: string[];
}

export function AddEventDialog({ onClose, onAdd, existingNames, categories }: AddEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    friendly_name: '',
    year: '',
    category: categories[0] || 'cultural',
    description: '',
    difficulty: 'medium' as Difficulty,
    image_url: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Auto-generate name from friendly_name
  const handleFriendlyNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      friendly_name: value,
      name: value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50),
    }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!/^[a-z0-9-]+$/.test(formData.name)) {
      return 'Name must be lowercase letters, numbers, and hyphens only';
    }
    if (existingNames.includes(formData.name)) {
      return `An event with name "${formData.name}" already exists`;
    }
    if (!formData.friendly_name.trim()) {
      return 'Friendly name is required';
    }
    if (!formData.year || isNaN(parseInt(formData.year, 10))) {
      return 'Year is required and must be a number';
    }
    if (!formData.description.trim()) {
      return 'Description is required';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const event: HistoricalEvent = {
        name: formData.name,
        friendly_name: formData.friendly_name,
        year: parseInt(formData.year, 10),
        category: formData.category,
        description: formData.description,
        difficulty: formData.difficulty,
        ...(formData.image_url && { image_url: formData.image_url }),
      };

      await onAdd(formData.category, event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Add New Event</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Friendly Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Friendly Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.friendly_name}
              onChange={(e) => handleFriendlyNameChange(e.target.value)}
              placeholder="e.g., First Moon Landing"
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          {/* Name (auto-generated) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Name (ID) <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value.toLowerCase())}
              placeholder="e.g., first-moon-landing"
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Auto-generated from friendly name. Must be unique and lowercase.
            </p>
          </div>

          {/* Year */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Year <span className="text-error">*</span>
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => updateField('year', e.target.value)}
              placeholder="e.g., 1969"
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Use negative numbers for BCE (e.g., -500 for 500 BCE)
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Category <span className="text-error">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Difficulty <span className="text-error">*</span>
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value)}
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            >
              {ALL_DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Description <span className="text-error">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description of the event..."
              rows={3}
              className="w-full resize-y rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          {/* Image URL (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Image URL <span className="text-text-secondary">(optional)</span>
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => updateField('image_url', e.target.value)}
              placeholder="https://..."
              className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded border border-error bg-error/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-accent px-4 py-2 text-sm text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
