import React, { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  HistoricalEvent,
  Difficulty,
  Category,
  Era,
  GamePopupData,
  ALL_CATEGORIES,
  ALL_DIFFICULTIES,
} from '../../types';
import { filterByDifficulty, filterByCategory, filterByEra } from '../../utils/eventLoader';
import { getCollectionState } from '../../utils/statsStorage';
import { ERA_DEFINITIONS } from '../../utils/eras';
import { hasSeenTimelineIntro, markTimelineIntroSeen } from '../../utils/playerStorage';
import Timeline from '../Timeline/Timeline';
import FilterPopup from '../FilterPopup';
import GamePopup from '../GamePopup';
import TimelineIntroModal from '../TimelineIntroModal';

interface TimelinePanelProps {
  allEvents: HistoricalEvent[];
}

/**
 * My Timeline content panel: the player's personal collection (events they've correctly
 * placed), with a filter control and a vertically-scrolling timeline. Rendered both by the
 * `/timeline` route (via ViewTimeline, wrapped in a TopBar) and as a tab inside the
 * home-screen pager. The Filter button lives in the panel header — it's a content control,
 * not navigation.
 */
const TimelinePanel: React.FC<TimelinePanelProps> = ({ allEvents }) => {
  // Filter state - default to all selected
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([
    ...ALL_DIFFICULTIES,
  ]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [selectedEras, setSelectedEras] = useState<Era[]>(ERA_DEFINITIONS.map((e) => e.id));

  // UI state
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [pendingPopup, setPendingPopup] = useState<GamePopupData | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  // First-view explainer: show once, then remember it's been seen.
  useEffect(() => {
    if (!hasSeenTimelineIntro()) setShowIntro(true);
  }, []);

  // The player's personal collection: only events they've correctly placed across all games.
  const collectedEvents = useMemo(() => {
    const owned = new Set(getCollectionState().placedEventIds);
    return allEvents.filter((e) => owned.has(e.name));
  }, [allEvents]);

  // Collection counts (collected vs full catalogue).
  const collected = collectedEvents.length;
  const total = allEvents.length;

  // Filter and sort the collection
  const filteredEvents = useMemo(() => {
    let events = filterByDifficulty(collectedEvents, selectedDifficulties);
    events = filterByCategory(events, selectedCategories);
    events = filterByEra(events, selectedEras);
    // Sort by year for chronological display
    return [...events].sort((a, b) => a.year - b.year);
  }, [collectedEvents, selectedDifficulties, selectedCategories, selectedEras]);

  // Handle event tap to show description
  const handleEventTap = (event: HistoricalEvent) => {
    setPendingPopup({
      type: 'description',
      event,
    });
  };

  const dismissPopup = () => {
    setPendingPopup(null);
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header — styled like the Achievements page heading.
          Filter sits here (a content control), not in the nav bar. */}
      <div className="px-3">
        <div className="mx-auto flex w-full max-w-sm flex-wrap items-center justify-between gap-2 py-5">
          <h1 className="font-display text-2xl font-bold text-text">My Timeline</h1>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-text-muted">
              {collected} / {total || '…'} collected
            </span>
            <button
              onClick={() => setShowFilterPopup(true)}
              className="p-2 rounded-xl bg-surface border border-border hover:bg-border transition-colors active:scale-95"
              aria-label="Filter timeline"
            >
              <SlidersHorizontal className="w-5 h-5 text-text" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline takes the remaining space below the header */}
      <div className="flex-1 overflow-hidden">
        {collected === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-text-muted text-lg font-body mb-2">Your collection is empty</p>
              <p className="text-text-muted/60 text-sm font-body">
                Place events correctly in a game to collect them — they'll appear here.
              </p>
            </div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <Timeline
            events={filteredEvents}
            onEventTap={handleEventTap}
            isDragging={false}
            insertionIndex={null}
            draggedCard={null}
            isOverTimeline={false}
            lastPlacementResult={null}
            animationPhase={null}
            preloadDetailImages={false}
            startAtMiddle
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-text-muted text-lg font-body mb-2">No events match your filters</p>
              <p className="text-text-muted/60 text-sm font-body">
                Try selecting more categories, difficulties, or eras
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Popup */}
      <FilterPopup
        isOpen={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        filteredCount={filteredEvents.length}
        totalCount={collectedEvents.length}
        selectedDifficulties={selectedDifficulties}
        setSelectedDifficulties={setSelectedDifficulties}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedEras={selectedEras}
        setSelectedEras={setSelectedEras}
      />

      {/* First-view explainer */}
      <TimelineIntroModal
        isOpen={showIntro}
        onDismiss={() => {
          markTimelineIntroSeen();
          setShowIntro(false);
        }}
      />

      {/* Event Description Popup */}
      {pendingPopup && (
        <GamePopup
          type={pendingPopup.type}
          event={pendingPopup.event}
          onDismiss={dismissPopup}
          showYear={true}
        />
      )}
    </div>
  );
};

export default TimelinePanel;
