import { useState, useEffect } from 'react';
import { useEvents } from './hooks/useEvents';
import { useMetadata } from './hooks/useMetadata';
import { Sidebar } from './components/Sidebar/Sidebar';
import { EventEditor } from './components/Editor/EventEditor';
import { TopBar } from './components/Navigation/TopBar';
import { AddEventDialog } from './components/Dialogs/AddEventDialog';
import { DeleteDialog } from './components/Dialogs/DeleteDialog';
import { ChangeCategoryDialog } from './components/Dialogs/ChangeCategoryDialog';
import type { Category } from './types';

export default function App() {
  const events = useEvents();
  const metadata = useMetadata();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showChangeCategoryDialog, setShowChangeCategoryDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
          events.prevEvent();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          events.nextEvent();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events]);

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
        />

        <main className="flex-1 overflow-auto p-6">
          {events.currentEvent ? (
            <EventEditor
              event={events.currentEvent}
              category={events.currentCategory!}
              currentIndex={events.currentIndex}
              totalCount={events.currentCategoryCount}
              onUpdate={events.updateCurrentEvent}
              onPrev={events.prevEvent}
              onNext={events.nextEvent}
              onJump={events.jumpToEvent}
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
            currentCategory={events.currentCategory as Category}
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
