import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Folder, FolderOpen, Archive } from 'lucide-react';
import type { EventsByCategory, HistoricalEvent, Difficulty } from '../../types';
import { ALL_DIFFICULTIES } from '../../types';

interface SidebarProps {
  eventsByCategory: EventsByCategory | null;
  currentCategory: string | null;
  currentIndex: number;
  onSelectEvent: (category: string, index: number) => void;
  onAddEvent: () => void;
  searchQuery: string;
  pendingChanges: Map<string, HistoricalEvent>;
  yearRange: { min: number | null; max: number | null };
  onYearRangeChange: (range: { min: number | null; max: number | null }) => void;
  difficultyFilter: Set<Difficulty>;
  onDifficultyFilterChange: (filter: Set<Difficulty>) => void;
  missingImageFilter: boolean;
  onMissingImageFilterChange: (value: boolean) => void;
}

function formatCategoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function Sidebar({
  eventsByCategory,
  currentCategory,
  currentIndex,
  onSelectEvent,
  onAddEvent,
  searchQuery,
  pendingChanges,
  yearRange,
  onYearRangeChange,
  difficultyFilter,
  onDifficultyFilterChange,
  missingImageFilter,
  onMissingImageFilterChange,
}: SidebarProps) {
  const categoryOrder = useMemo(() => {
    if (!eventsByCategory) return ['deprecated'];
    const cats = Object.keys(eventsByCategory)
      .filter((key) => key !== 'deprecated')
      .sort();
    cats.push('deprecated');
    return cats;
  }, [eventsByCategory]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['conflict']));

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const hasAnyFilter =
    searchQuery.trim().length > 0 ||
    yearRange.min !== null ||
    yearRange.max !== null ||
    difficultyFilter.size > 0 ||
    missingImageFilter;

  // Filter events by search query, year range, and difficulty
  const filteredEventsByCategory = useMemo(() => {
    if (!eventsByCategory) return eventsByCategory;

    const query = searchQuery.trim().toLowerCase();
    const hasSearchFilter = query.length > 0;
    const hasYearFilter = yearRange.min !== null || yearRange.max !== null;
    const hasDifficultyFilter = difficultyFilter.size > 0;

    if (!hasSearchFilter && !hasYearFilter && !hasDifficultyFilter && !missingImageFilter) {
      return eventsByCategory;
    }

    const filtered: Record<string, HistoricalEvent[]> = {};
    for (const category of categoryOrder) {
      filtered[category] = [];
    }

    for (const category of categoryOrder) {
      const events = eventsByCategory[category];
      if (events) {
        filtered[category] = events.filter((e) => {
          if (hasSearchFilter) {
            const matchesSearch =
              e.friendly_name.toLowerCase().includes(query) ||
              e.name.toLowerCase().includes(query) ||
              e.year.toString().includes(query);
            if (!matchesSearch) return false;
          }
          if (hasYearFilter) {
            if (yearRange.min !== null && e.year < yearRange.min) return false;
            if (yearRange.max !== null && e.year > yearRange.max) return false;
          }
          if (hasDifficultyFilter) {
            if (!difficultyFilter.has(e.difficulty)) return false;
          }
          if (missingImageFilter) {
            if (e.image_url) return false;
          }
          return true;
        });
      }
    }

    return filtered;
  }, [
    eventsByCategory,
    categoryOrder,
    searchQuery,
    yearRange,
    difficultyFilter,
    missingImageFilter,
  ]);

  if (!eventsByCategory) {
    return (
      <aside className="w-64 border-r border-border bg-white">
        <div className="p-4 text-text-secondary">Loading...</div>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-white">
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="text-sm font-medium text-text">Categories</span>
        <button
          onClick={onAddEvent}
          className="flex h-7 w-7 items-center justify-center rounded bg-accent text-white transition-colors hover:bg-accent-hover"
          title="Add new event"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 border-b border-border p-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Year Range</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Min"
              value={yearRange.min ?? ''}
              onChange={(e) =>
                onYearRangeChange({
                  ...yearRange,
                  min: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className="w-full rounded border border-border bg-white px-2 py-1 text-xs text-text placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
            <span className="flex-shrink-0 text-xs text-text-secondary">to</span>
            <input
              type="number"
              placeholder="Max"
              value={yearRange.max ?? ''}
              onChange={(e) =>
                onYearRangeChange({
                  ...yearRange,
                  max: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className="w-full rounded border border-border bg-white px-2 py-1 text-xs text-text placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
          </div>
          <p className="mt-0.5 text-[10px] text-text-secondary">Negative = BCE (e.g. -500)</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Difficulty</label>
          <div className="flex flex-wrap gap-1">
            {ALL_DIFFICULTIES.map((diff) => {
              const isActive = difficultyFilter.has(diff);
              return (
                <button
                  key={diff}
                  onClick={() => {
                    const next = new Set(difficultyFilter);
                    if (isActive) {
                      next.delete(diff);
                    } else {
                      next.add(diff);
                    }
                    onDifficultyFilterChange(next);
                  }}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-accent text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-border'
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1).replace('-', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <button
            onClick={() => onMissingImageFilterChange(!missingImageFilter)}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              missingImageFilter
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-border'
            }`}
          >
            Missing image
          </button>
        </div>

        {(yearRange.min !== null ||
          yearRange.max !== null ||
          difficultyFilter.size > 0 ||
          missingImageFilter) && (
          <button
            onClick={() => {
              onYearRangeChange({ min: null, max: null });
              onDifficultyFilterChange(new Set());
              onMissingImageFilterChange(false);
            }}
            className="text-xs text-accent hover:text-accent-hover"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {categoryOrder.map((category) => {
          const events = filteredEventsByCategory?.[category] || [];
          const originalEvents = eventsByCategory[category] || [];
          const isExpanded = expandedCategories.has(category);
          const isDeprecated = category === 'deprecated';
          const Icon = isDeprecated ? Archive : isExpanded ? FolderOpen : Folder;

          return (
            <div key={category} className="border-b border-border">
              <button
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-bg-secondary"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-secondary" />
                )}
                <Icon className={`h-4 w-4 ${isDeprecated ? 'text-error' : 'text-accent'}`} />
                <span className="flex-1 text-sm font-medium text-text">
                  {formatCategoryLabel(category)}
                </span>
                <span className="text-xs text-text-secondary">
                  {hasAnyFilter
                    ? `${events.length}/${originalEvents.length}`
                    : originalEvents.length}
                </span>
              </button>

              {isExpanded && (
                <div className="max-h-64 overflow-auto bg-bg">
                  {events.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-text-secondary">
                      {hasAnyFilter ? 'No matches' : 'No events'}
                    </div>
                  ) : (
                    events.map((event) => {
                      // Find original index for selection
                      const originalIndex = originalEvents.findIndex((e) => e.name === event.name);
                      const isSelected =
                        currentCategory === category && currentIndex === originalIndex;
                      const hasChanges = pendingChanges.has(`${category}:${event.name}`);

                      return (
                        <button
                          key={event.name}
                          onClick={() => onSelectEvent(category, originalIndex)}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                            isSelected ? 'bg-accent text-white' : 'text-text hover:bg-bg-secondary'
                          }`}
                        >
                          {hasChanges && (
                            <span
                              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-warning'
                              }`}
                            />
                          )}
                          <span className="flex-1 truncate">{event.friendly_name}</span>
                          <span
                            className={`flex-shrink-0 ${
                              isSelected ? 'text-white/80' : 'text-text-secondary'
                            }`}
                          >
                            {event.year}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
