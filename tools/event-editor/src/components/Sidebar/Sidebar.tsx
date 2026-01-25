import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Folder, FolderOpen, Archive } from 'lucide-react';
import type { EventsByCategory, CategoryOrDeprecated, HistoricalEvent } from '../../types';

interface SidebarProps {
  eventsByCategory: EventsByCategory | null;
  currentCategory: CategoryOrDeprecated | null;
  currentIndex: number;
  onSelectEvent: (category: CategoryOrDeprecated, index: number) => void;
  onAddEvent: () => void;
  searchQuery: string;
  pendingChanges: Map<string, HistoricalEvent>;
}

const CATEGORY_ORDER: CategoryOrDeprecated[] = [
  'conflict',
  'cultural',
  'diplomatic',
  'disasters',
  'exploration',
  'infrastructure',
  'deprecated',
];

const CATEGORY_LABELS: Record<CategoryOrDeprecated, string> = {
  conflict: 'Conflict',
  cultural: 'Cultural',
  diplomatic: 'Diplomatic',
  disasters: 'Disasters',
  exploration: 'Exploration',
  infrastructure: 'Infrastructure',
  deprecated: 'Deprecated',
};

export function Sidebar({
  eventsByCategory,
  currentCategory,
  currentIndex,
  onSelectEvent,
  onAddEvent,
  searchQuery,
  pendingChanges,
}: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryOrDeprecated>>(
    new Set(['conflict'])
  );

  const toggleCategory = (category: CategoryOrDeprecated) => {
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

  // Filter events by search query
  const filteredEventsByCategory = useMemo(() => {
    if (!eventsByCategory || !searchQuery.trim()) {
      return eventsByCategory;
    }

    const query = searchQuery.toLowerCase();
    const filtered: EventsByCategory = {
      conflict: [],
      cultural: [],
      diplomatic: [],
      disasters: [],
      exploration: [],
      infrastructure: [],
      deprecated: [],
    };

    for (const category of CATEGORY_ORDER) {
      const events = eventsByCategory[category];
      if (events) {
        const filteredEvents = events.filter(
          (e) =>
            e.friendly_name.toLowerCase().includes(query) ||
            e.name.toLowerCase().includes(query) ||
            e.year.toString().includes(query)
        );
        // Use type assertion to handle the union type
        (filtered as unknown as Record<string, HistoricalEvent[]>)[category] = filteredEvents;
      }
    }

    return filtered;
  }, [eventsByCategory, searchQuery]);

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

      <div className="flex-1 overflow-auto">
        {CATEGORY_ORDER.map((category) => {
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
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-xs text-text-secondary">
                  {searchQuery
                    ? `${events.length}/${originalEvents.length}`
                    : originalEvents.length}
                </span>
              </button>

              {isExpanded && (
                <div className="max-h-64 overflow-auto bg-bg">
                  {events.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-text-secondary">
                      {searchQuery ? 'No matches' : 'No events'}
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
