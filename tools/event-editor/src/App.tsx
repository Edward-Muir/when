import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEvents } from './hooks/useEvents';
import { useMetadata } from './hooks/useMetadata';
import { Sidebar } from './components/Sidebar/Sidebar';
import { EventEditor } from './components/Editor/EventEditor';
import { TopBar } from './components/Navigation/TopBar';
import { AddEventDialog } from './components/Dialogs/AddEventDialog';
import { DeleteDialog } from './components/Dialogs/DeleteDialog';
import { ChangeCategoryDialog } from './components/Dialogs/ChangeCategoryDialog';
import type { Difficulty } from './types';

export default function App() {
  const events = useEvents();
  const metadata = useMetadata();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showChangeCategoryDialog, setShowChangeCategoryDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearRange, setYearRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const [difficultyFilter, setDifficultyFilter] = useState<Set<Difficulty>>(new Set());
  const [missingImageFilter, setMissingImageFilter] = useState(false);

  // Compute filtered indices for the current category
  const filteredIndices = useMemo(() => {
    if (!events.eventsByCategory || !events.currentCategory) return [];

    const categoryEvents = events.eventsByCategory[events.currentCategory] || [];
    const query = searchQuery.trim().toLowerCase();
    const hasSearchFilter = query.length > 0;
    const hasYearFilter = yearRange.min !== null || yearRange.max !== null;
    const hasDifficultyFilter = difficultyFilter.size > 0;

    if (!hasSearchFilter && !hasYearFilter && !hasDifficultyFilter && !missingImageFilter) {
      return categoryEvents.map((_, i) => i);
    }

    const indices: number[] = [];
    categoryEvents.forEach((e, i) => {
      if (hasSearchFilter) {
        const matchesSearch =
          e.friendly_name.toLowerCase().includes(query) ||
          e.name.toLowerCase().includes(query) ||
          e.year.toString().includes(query);
        if (!matchesSearch) return;
      }
      if (hasYearFilter) {
        if (yearRange.min !== null && e.year < yearRange.min) return;
        if (yearRange.max !== null && e.year > yearRange.max) return;
      }
      if (hasDifficultyFilter) {
        if (!difficultyFilter.has(e.difficulty)) return;
      }
      if (missingImageFilter) {
        if (e.image_url) return;
      }
      indices.push(i);
    });
    return indices;
  }, [
    events.eventsByCategory,
    events.currentCategory,
    searchQuery,
    yearRange,
    difficultyFilter,
    missingImageFilter,
  ]);

  const filteredPosition = useMemo(() => {
    const pos = filteredIndices.indexOf(events.currentIndex);
    return pos >= 0 ? pos : -1;
  }, [filteredIndices, events.currentIndex]);

  const filteredNext = useCallback(() => {
    const pos = filteredIndices.indexOf(events.currentIndex);
    const nextPos = pos >= 0 ? pos + 1 : filteredIndices.findIndex((i) => i > events.currentIndex);
    if (nextPos >= 0 && nextPos < filteredIndices.length) {
      events.jumpToEvent(filteredIndices[nextPos]);
    }
  }, [filteredIndices, events]);

  const filteredPrev = useCallback(() => {
    const pos = filteredIndices.indexOf(events.currentIndex);
    if (pos > 0) {
      events.jumpToEvent(filteredIndices[pos - 1]);
    } else if (pos < 0) {
      // Current event isn't in filtered list, find the closest previous filtered event
      for (let i = filteredIndices.length - 1; i >= 0; i--) {
        if (filteredIndices[i] < events.currentIndex) {
          events.jumpToEvent(filteredIndices[i]);
          return;
        }
      }
    }
  }, [filteredIndices, events]);

  const filteredJump = useCallback(
    (position: number) => {
      if (position >= 0 && position < filteredIndices.length) {
        events.jumpToEvent(filteredIndices[position]);
      }
    },
    [filteredIndices, events]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (events.hasUnsavedChanges) {
          events.saveChanges();
        }
      }

      // Arrow keys for navigation (when not in an input)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (!isInput) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          filteredPrev();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          filteredNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events, filteredPrev, filteredNext]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (events.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [events.hasUnsavedChanges]);

  if (events.isLoading && !events.eventsByCategory) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-text-secondary">Loading events...</div>
      </div>
    );
  }

  if (events.error && !events.eventsByCategory) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mb-2 text-error">Error: {events.error}</div>
          <button
            onClick={events.refreshEvents}
            className="rounded bg-accent px-4 py-2 text-white hover:bg-accent-hover"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <TopBar
        hasUnsavedChanges={events.hasUnsavedChanges}
        pendingChangesCount={events.pendingChanges.size}
        onSave={events.saveChanges}
        onDiscard={events.discardChanges}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={events.isLoading}
        error={events.error}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          eventsByCategory={events.eventsByCategory}
          currentCategory={events.currentCategory}
          currentIndex={events.currentIndex}
          onSelectEvent={events.selectEvent}
          onAddEvent={() => setShowAddDialog(true)}
          searchQuery={searchQuery}
          pendingChanges={events.pendingChanges}
          yearRange={yearRange}
          onYearRangeChange={setYearRange}
          difficultyFilter={difficultyFilter}
          onDifficultyFilterChange={setDifficultyFilter}
          missingImageFilter={missingImageFilter}
          onMissingImageFilterChange={setMissingImageFilter}
        />

        <main className="flex-1 overflow-auto p-6">
          {events.currentEvent ? (
            <EventEditor
              event={events.currentEvent}
              category={events.currentCategory!}
              categories={events.categories}
              currentIndex={filteredPosition >= 0 ? filteredPosition : 0}
              totalCount={filteredIndices.length}
              onUpdate={events.updateCurrentEvent}
              onPrev={filteredPrev}
              onNext={filteredNext}
              onJump={filteredJump}
              onDelete={() => setShowDeleteDialog(true)}
              onChangeCategory={() => setShowChangeCategoryDialog(true)}
              metadata={metadata}
              isDeprecated={events.currentCategory === 'deprecated'}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-secondary">
              Select an event from the sidebar to edit
            </div>
          )}
        </main>
      </div>

      {showAddDialog && (
        <AddEventDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={async (category, event) => {
            await events.addEvent(category, event);
            setShowAddDialog(false);
          }}
          existingNames={
            events.eventsByCategory
              ? Object.values(events.eventsByCategory)
                  .flat()
                  .map((e) => e.name)
              : []
          }
          categories={events.categories}
        />
      )}

      {showDeleteDialog && events.currentEvent && (
        <DeleteDialog
          eventName={events.currentEvent.friendly_name}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={async () => {
            await events.deleteCurrentEvent();
            setShowDeleteDialog(false);
          }}
        />
      )}

      {showChangeCategoryDialog &&
        events.currentEvent &&
        events.currentCategory !== 'deprecated' && (
          <ChangeCategoryDialog
            currentCategory={events.currentCategory!}
            categories={events.categories}
            onClose={() => setShowChangeCategoryDialog(false)}
            onConfirm={async (newCategory) => {
              await events.changeCurrentEventCategory(newCategory);
              setShowChangeCategoryDialog(false);
            }}
          />
        )}
    </div>
  );
}
