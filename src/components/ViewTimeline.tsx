import React, { useState, useMemo } from 'react';
import {
  HistoricalEvent,
  Difficulty,
  Category,
  Era,
  GamePopupData,
  ALL_CATEGORIES,
} from '../types';
import { filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import { ERA_DEFINITIONS } from '../utils/eras';
import TopBar from './TopBar';
import Timeline from './Timeline/Timeline';
import FilterPopup from './FilterPopup';
import GamePopup from './GamePopup';

interface ViewTimelineProps {
  allEvents: HistoricalEvent[];
  onHomeClick: () => void;
}

const ViewTimeline: React.FC<ViewTimelineProps> = ({ allEvents, onHomeClick }) => {
  // Filter state - default to all selected
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([
    'easy',
    'medium',
    'hard',
  ]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([...ALL_CATEGORIES]);
  const [selectedEras, setSelectedEras] = useState<Era[]>(ERA_DEFINITIONS.map((e) => e.id));

  // UI state
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [pendingPopup, setPendingPopup] = useState<GamePopupData | null>(null);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let events = filterByDifficulty(allEvents, selectedDifficulties);
    events = filterByCategory(events, selectedCategories);
    events = filterByEra(events, selectedEras);
    // Sort by year for chronological display
    return [...events].sort((a, b) => a.year - b.year);
  }, [allEvents, selectedDifficulties, selectedCategories, selectedEras]);

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
    <div className="h-screen-safe flex flex-col bg-bg">
      <TopBar
        showTitle={true}
        showHome={true}
        onHomeClick={onHomeClick}
        showFilter={true}
        onFilterClick={() => setShowFilterPopup(true)}
        gameMode={null}
      />

      {/* Timeline takes full screen below TopBar */}
      <div className="flex-1 pt-[60px] overflow-hidden">
        {filteredEvents.length > 0 ? (
          <Timeline
            events={filteredEvents}
            onEventTap={handleEventTap}
            isDragging={false}
            insertionIndex={null}
            draggedCard={null}
            isOverTimeline={false}
            lastPlacementResult={null}
            animationPhase={null}
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
        totalCount={allEvents.length}
        selectedDifficulties={selectedDifficulties}
        setSelectedDifficulties={setSelectedDifficulties}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedEras={selectedEras}
        setSelectedEras={setSelectedEras}
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

export default ViewTimeline;
