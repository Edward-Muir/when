import type { HistoricalEvent, Difficulty } from '../../types';
import { ALL_DIFFICULTIES } from '../../types';

interface EventFormProps {
  event: HistoricalEvent;
  onUpdate: (updates: Partial<HistoricalEvent>) => void;
  isDeprecated: boolean;
  categories: string[];
}

export function EventForm({ event, onUpdate, isDeprecated, categories }: EventFormProps) {
  return (
    <div className="space-y-4">
      {/* Name (readonly) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Name (ID)</label>
        <input
          type="text"
          value={event.name}
          readOnly
          className="w-full cursor-not-allowed rounded border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary"
        />
      </div>

      {/* Friendly Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text">
          Friendly Name <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={event.friendly_name}
          onChange={(e) => onUpdate({ friendly_name: e.target.value })}
          disabled={isDeprecated}
          className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-secondary"
        />
      </div>

      {/* Year */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text">
          Year <span className="text-error">*</span>
        </label>
        <input
          type="number"
          value={event.year}
          onChange={(e) => onUpdate({ year: parseInt(e.target.value, 10) || 0 })}
          disabled={isDeprecated}
          className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-secondary"
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
          value={event.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          disabled={isDeprecated}
          className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-secondary"
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
          value={event.difficulty}
          onChange={(e) => onUpdate({ difficulty: e.target.value as Difficulty })}
          disabled={isDeprecated}
          className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-secondary"
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
          value={event.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          disabled={isDeprecated}
          rows={3}
          className="w-full resize-y rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-secondary"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Image URL</label>
        <input
          type="url"
          value={event.image_url || ''}
          onChange={(e) => onUpdate({ image_url: e.target.value || undefined })}
          disabled={isDeprecated}
          placeholder="https://..."
          className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-bg-secondary"
        />
      </div>

      {/* Image Dimensions (readonly display) */}
      {(event.image_width || event.image_height) && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Width</label>
            <input
              type="number"
              value={event.image_width || ''}
              readOnly
              className="w-full cursor-not-allowed rounded border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-text-secondary">Height</label>
            <input
              type="number"
              value={event.image_height || ''}
              readOnly
              className="w-full cursor-not-allowed rounded border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary"
            />
          </div>
        </div>
      )}

      {/* Wikipedia Views */}
      {event.wikipedia_views !== undefined && (
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Wikipedia Views (yearly)
          </label>
          <input
            type="text"
            value={event.wikipedia_views.toLocaleString()}
            readOnly
            className="w-full cursor-not-allowed rounded border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary"
          />
        </div>
      )}

      {/* Wikipedia URL */}
      {event.wikipedia_url && (
        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">
            Wikipedia URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={event.wikipedia_url}
              readOnly
              className="flex-1 cursor-not-allowed rounded border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary"
            />
            <a
              href={event.wikipedia_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded border border-border px-3 py-2 text-sm text-accent transition-colors hover:bg-bg-secondary"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
