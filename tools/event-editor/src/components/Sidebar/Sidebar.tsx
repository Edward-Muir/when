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

const ERAS = [
  { id: 'prehistory', name: 'Prehistory', startYear: -Infinity, endYear: -3001 },
  { id: 'ancient', name: 'Ancient', startYear: -3000, endYear: 499 },
  { id: 'medieval', name: 'Medieval', startYear: 500, endYear: 1499 },
  { id: 'renaissance', name: 'Renaissance', startYear: 1500, endYear: 1759 },
  { id: 'industrial', name: 'Industrial', startYear: 1760, endYear: 1913 },
  { id: 'worldWars', name: 'World Wars', startYear: 1914, endYear: 1945 },
  { id: 'coldWar', name: 'Cold War', startYear: 1946, endYear: 1991 },
  { id: 'modern', name: 'Modern', startYear: 1992, endYear: 2100 },
] as const;

type EraId = (typeof ERAS)[number]['id'];

function eraForYear(year: number): EraId {
  const match = ERAS.find((e) => year >= e.startYear && year <= e.endYear);
  return (match ?? ERAS[ERAS.length - 1]).id;
}

const CATEGORY_ABBR: Record<string, string> = {
  conflict: 'CON',
  cultural: 'CUL',
  diplomatic: 'DIP',
  disasters: 'DIS',
  exploration: 'EXP',
  infrastructure: 'INF',
};

function abbrFor(category: string): string {
  return CATEGORY_ABBR[category] ?? category.slice(0, 3).toUpperCase();
}

type FlatEvent = HistoricalEvent & { category: string };

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
  const [expandedEras, setExpandedEras] = useState<Set<string>>(new Set(['modern']));
  const [deprecatedExpanded, setDeprecatedExpanded] = useState(false);

  const toggleEra = (era: string) => {
    setExpandedEras((prev) => {
      const next = new Set(prev);
      if (next.has(era)) {
        next.delete(era);
      } else {
        next.add(era);
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

  const { allEvents, deprecatedEvents } = useMemo(() => {
    if (!eventsByCategory) {
      return { allEvents: [] as FlatEvent[], deprecatedEvents: [] as FlatEvent[] };
    }
    const main: FlatEvent[] = [];
    const deprecated: FlatEvent[] = [];
    for (const [category, events] of Object.entries(eventsByCategory)) {
      if (!events) continue;
      const target = category === 'deprecated' ? deprecated : main;
      for (const event of events) {
        target.push({ ...event, category });
      }
    }
    main.sort((a, b) => a.year - b.year);
    deprecated.sort((a, b) => a.year - b.year);
    return { allEvents: main, deprecatedEvents: deprecated };
  }, [eventsByCategory]);

  const matchesFilters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasSearchFilter = query.length > 0;
    const hasYearFilter = yearRange.min !== null || yearRange.max !== null;
    const hasDifficultyFilter = difficultyFilter.size > 0;

    return (e: FlatEvent) => {
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
    };
  }, [searchQuery, yearRange, difficultyFilter, missingImageFilter]);

  const eventsByEra = useMemo(() => {
    const grouped: Record<string, { filtered: FlatEvent[]; total: number }> = {};
    for (const era of ERAS) {
      grouped[era.id] = { filtered: [], total: 0 };
    }
    for (const event of allEvents) {
      const era = eraForYear(event.year);
      grouped[era].total += 1;
      if (matchesFilters(event)) {
        grouped[era].filtered.push(event);
      }
    }
    return grouped;
  }, [allEvents, matchesFilters]);

  const filteredDeprecated = useMemo(
    () => deprecatedEvents.filter(matchesFilters),
    [deprecatedEvents, matchesFilters]
  );

  if (!eventsByCategory) {
    return (
      <aside className="w-64 border-r border-border bg-white">
        <div className="p-4 text-text-secondary">Loading...</div>
      </aside>
    );
  }

  const renderEventRow = (event: FlatEvent) => {
    const categoryEvents = eventsByCategory[event.category] || [];
    const originalIndex = categoryEvents.findIndex((e) => e.name === event.name);
    const isSelected = currentCategory === event.category && currentIndex === originalIndex;
    const hasChanges = pendingChanges.has(`${event.category}:${event.name}`);

    return (
      <button
        key={`${event.category}:${event.name}`}
        onClick={() => onSelectEvent(event.category, originalIndex)}
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
          className={`flex-shrink-0 font-mono text-[9px] tracking-wide ${
            isSelected ? 'text-white/70' : 'text-text-secondary/70'
          }`}
          title={event.category}
        >
          {abbrFor(event.category)}
        </span>
        <span
          className={`flex-shrink-0 tabular-nums ${
            isSelected ? 'text-white/80' : 'text-text-secondary'
          }`}
        >
          {event.year}
        </span>
      </button>
    );
  };

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-white">
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="text-sm font-medium text-text">Eras</span>
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
        {ERAS.map((era) => {
          const { filtered, total } = eventsByEra[era.id];
          const isExpanded = expandedEras.has(era.id);
          const Icon = isExpanded ? FolderOpen : Folder;

          return (
            <div key={era.id} className="border-b border-border">
              <button
                onClick={() => toggleEra(era.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-bg-secondary"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-secondary" />
                )}
                <Icon className="h-4 w-4 text-accent" />
                <span className="flex-1 text-sm font-medium text-text">{era.name}</span>
                <span className="text-xs text-text-secondary">
                  {hasAnyFilter ? `${filtered.length}/${total}` : total}
                </span>
              </button>

              {isExpanded && (
                <div className="max-h-96 overflow-auto bg-bg">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-text-secondary">
                      {hasAnyFilter ? 'No matches' : 'No events'}
                    </div>
                  ) : (
                    filtered.map(renderEventRow)
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Deprecated folder */}
        <div className="border-b border-border">
          <button
            onClick={() => setDeprecatedExpanded((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-bg-secondary"
          >
            {deprecatedExpanded ? (
              <ChevronDown className="h-4 w-4 text-text-secondary" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-secondary" />
            )}
            <Archive className="h-4 w-4 text-error" />
            <span className="flex-1 text-sm font-medium text-text">Deprecated</span>
            <span className="text-xs text-text-secondary">
              {hasAnyFilter
                ? `${filteredDeprecated.length}/${deprecatedEvents.length}`
                : deprecatedEvents.length}
            </span>
          </button>

          {deprecatedExpanded && (
            <div className="max-h-96 overflow-auto bg-bg">
              {filteredDeprecated.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-secondary">
                  {hasAnyFilter ? 'No matches' : 'No events'}
                </div>
              ) : (
                filteredDeprecated.map(renderEventRow)
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
