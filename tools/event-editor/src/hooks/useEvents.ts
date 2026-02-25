import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { HistoricalEvent, EventsByCategory, CategoryOrDeprecated } from '../types';
import * as api from '../api/client';

interface UseEventsReturn {
  // Data
  eventsByCategory: EventsByCategory | null;
  categories: string[];
  isLoading: boolean;
  error: string | null;

  // Current selection
  currentCategory: CategoryOrDeprecated | null;
  currentIndex: number;
  currentEvent: HistoricalEvent | null;

  // Navigation
  selectEvent: (category: CategoryOrDeprecated, index: number) => void;
  selectEventByName: (category: CategoryOrDeprecated, name: string) => void;
  nextEvent: () => void;
  prevEvent: () => void;
  jumpToEvent: (index: number) => void;

  // Get total count for current category
  currentCategoryCount: number;

  // Editing
  updateCurrentEvent: (updates: Partial<HistoricalEvent>) => void;
  pendingChanges: Map<string, HistoricalEvent>;
  hasUnsavedChanges: boolean;

  // CRUD
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
  addEvent: (category: string, event: HistoricalEvent) => Promise<void>;
  deleteCurrentEvent: () => Promise<void>;
  changeCurrentEventCategory: (newCategory: string) => Promise<void>;

  // Refresh
  refreshEvents: () => Promise<void>;
}

function makeChangeKey(category: string, name: string): string {
  return `${category}:${name}`;
}

export function useEvents(): UseEventsReturn {
  const [eventsByCategory, setEventsByCategory] = useState<EventsByCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentCategory, setCurrentCategory] = useState<CategoryOrDeprecated | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [pendingChanges, setPendingChanges] = useState<Map<string, HistoricalEvent>>(new Map());

  // Ref so the SSE effect can read current pending changes without re-subscribing
  const pendingChangesRef = useRef(pendingChanges);
  pendingChangesRef.current = pendingChanges;

  // Load all events on mount
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAllEvents();
      setEventsByCategory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // SSE subscription for external file changes
  useEffect(() => {
    const eventSource = new EventSource('/api/events/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'events-changed') {
          if (pendingChangesRef.current.size > 0) {
            console.log('[SSE] External change detected, skipping refresh (unsaved changes)');
            return;
          }
          console.log('[SSE] External change detected, refreshing events');
          refreshEvents();
        }
      } catch {
        // Ignore parse errors (e.g., keepalive comments)
      }
    };

    eventSource.onerror = () => {
      console.log('[SSE] Connection error, will auto-reconnect');
    };

    return () => {
      eventSource.close();
    };
  }, [refreshEvents]);

  // Get current event
  const currentEvent = useMemo(() => {
    if (!eventsByCategory || !currentCategory) return null;

    const events = eventsByCategory[currentCategory];
    if (!events || currentIndex >= events.length) return null;

    const event = events[currentIndex];
    const changeKey = makeChangeKey(currentCategory, event.name);
    return pendingChanges.get(changeKey) || event;
  }, [eventsByCategory, currentCategory, currentIndex, pendingChanges]);

  const categories = useMemo(() => {
    if (!eventsByCategory) return [];
    return Object.keys(eventsByCategory)
      .filter((key) => key !== 'deprecated')
      .sort();
  }, [eventsByCategory]);

  const currentCategoryCount = useMemo(() => {
    if (!eventsByCategory || !currentCategory) return 0;
    return eventsByCategory[currentCategory]?.length || 0;
  }, [eventsByCategory, currentCategory]);

  // Navigation
  const selectEvent = useCallback((category: CategoryOrDeprecated, index: number) => {
    setCurrentCategory(category);
    setCurrentIndex(index);
  }, []);

  const selectEventByName = useCallback(
    (category: CategoryOrDeprecated, name: string) => {
      if (!eventsByCategory) return;
      const events = eventsByCategory[category];
      const index = events?.findIndex((e) => e.name === name) ?? -1;
      if (index >= 0) {
        setCurrentCategory(category);
        setCurrentIndex(index);
      }
    },
    [eventsByCategory]
  );

  const nextEvent = useCallback(() => {
    if (!eventsByCategory || !currentCategory) return;
    const count = eventsByCategory[currentCategory]?.length || 0;
    if (currentIndex < count - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [eventsByCategory, currentCategory, currentIndex]);

  const prevEvent = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const jumpToEvent = useCallback(
    (index: number) => {
      if (!eventsByCategory || !currentCategory) return;
      const count = eventsByCategory[currentCategory]?.length || 0;
      if (index >= 0 && index < count) {
        setCurrentIndex(index);
      }
    },
    [eventsByCategory, currentCategory]
  );

  // Editing
  const updateCurrentEvent = useCallback(
    (updates: Partial<HistoricalEvent>) => {
      if (!currentEvent || !currentCategory) return;

      const changeKey = makeChangeKey(currentCategory, currentEvent.name);
      const updatedEvent = { ...currentEvent, ...updates };

      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.set(changeKey, updatedEvent);
        return next;
      });
    },
    [currentEvent, currentCategory]
  );

  const hasUnsavedChanges = pendingChanges.size > 0;

  // Save all pending changes
  const saveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      for (const [key, event] of pendingChanges) {
        const [category, name] = key.split(':');
        await api.updateEvent(category, name, event);
      }
      setPendingChanges(new Map());
      await refreshEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  }, [pendingChanges, refreshEvents]);

  const discardChanges = useCallback(() => {
    setPendingChanges(new Map());
  }, []);

  // Add new event
  const addEvent = useCallback(
    async (category: string, event: HistoricalEvent) => {
      setIsLoading(true);
      setError(null);

      try {
        await api.createEvent(category, event);
        await refreshEvents();
        // Select the new event
        selectEventByName(category, event.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add event');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshEvents, selectEventByName]
  );

  // Delete current event (move to deprecated)
  const deleteCurrentEvent = useCallback(async () => {
    if (!currentEvent || !currentCategory || currentCategory === 'deprecated') return;

    setIsLoading(true);
    setError(null);

    try {
      await api.deleteEvent(currentCategory, currentEvent.name);

      // Remove from pending changes
      const changeKey = makeChangeKey(currentCategory, currentEvent.name);
      setPendingChanges((prev) => {
        const next = new Map(prev);
        next.delete(changeKey);
        return next;
      });

      await refreshEvents();

      // Adjust index if needed
      if (eventsByCategory) {
        const newCount = (eventsByCategory[currentCategory]?.length || 1) - 1;
        if (currentIndex >= newCount && newCount > 0) {
          setCurrentIndex(newCount - 1);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentEvent, currentCategory, eventsByCategory, currentIndex, refreshEvents]);

  // Change category of current event
  const changeCurrentEventCategory = useCallback(
    async (newCategory: string) => {
      if (!currentEvent || !currentCategory || currentCategory === 'deprecated') return;
      if (newCategory === currentCategory) return;

      setIsLoading(true);
      setError(null);

      try {
        // If there are pending changes, save them first
        const changeKey = makeChangeKey(currentCategory, currentEvent.name);
        const eventToMove = pendingChanges.get(changeKey) || currentEvent;

        await api.moveEvent(currentEvent.name, currentCategory, newCategory);

        // Remove from pending changes
        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.delete(changeKey);
          return next;
        });

        await refreshEvents();

        // Select the moved event in its new category
        selectEventByName(newCategory, eventToMove.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move event');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentEvent, currentCategory, pendingChanges, refreshEvents, selectEventByName]
  );

  return {
    eventsByCategory,
    categories,
    isLoading,
    error,
    currentCategory,
    currentIndex,
    currentEvent,
    currentCategoryCount,
    selectEvent,
    selectEventByName,
    nextEvent,
    prevEvent,
    jumpToEvent,
    updateCurrentEvent,
    pendingChanges,
    hasUnsavedChanges,
    saveChanges,
    discardChanges,
    addEvent,
    deleteCurrentEvent,
    changeCurrentEventCategory,
    refreshEvents,
  };
}
