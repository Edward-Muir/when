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
  /**
   * Whether this panel is the visible pager tab. The home-screen pager pre-mounts panels
   * at idle, so the first-view intro must wait until the tab is actually shown. Defaults
   * to true for the standalone `/timeline` route.
   */
  active?: boolean;
}

/**
 * My Timeline content panel: the player's personal collection (events they've correctly
 * placed), with a filter control and a vertically-scrolling timeline. Rendered both by the
 * `/timeline` route (via ViewTimeline, wrapped in a TopBar) and as a tab inside the
 * home-screen pager. The Filter button lives in the panel header — it's a content control,
 * not navigation.
 */
const TimelinePanel: React.FC<TimelinePanelProps> = ({ allEvents, active = true }) => {
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

  // First-view explainer: show once the tab is actually visible, then remember it's been
  // seen. Gated on `active` because the pager pre-mounts this panel in the background.
  useEffect(() => {
    if (active && !hasSeenTimelineIntro()) setShowIntro(true);
  }, [active]);

  // Hold the timeline itself back until the tab has been shown at least once. Timeline
  // is not virtualised, so a returning player's whole collection becomes <img> tags; the
  // pager pre-mounts this panel only ~1-3 panel-widths off-screen, which sits inside
  // Chrome's distance-based `loading="lazy"` threshold, so those images can start
  // downloading on the home screen before the tab is ever opened. Latched, so swiping
  // away doesn't unmount and force a refetch on return.
  const [hasBeenActive, setHasBeenActive] = useState(active);
  useEffect(() => {
    if (active) setHasBeenActive(true);
  }, [active]);

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
      {/* Header — the Daily, Custom, Archive and Stats pages' heading, so every page reads
          alike. Filter sits here (a content control), not in the nav bar. */}
      <div className="mx-auto w-full max-w-sm px-3 text-left mb-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-5xl font-bold text-text font-display leading-none">My Timeline</h1>
          <button
            onClick={() => setShowFilterPopup(true)}
            className="p-2 rounded-xl bg-surface border border-border hover:bg-border transition-colors active:scale-95"
            aria-label="Filter timeline"
          >
            <SlidersHorizontal className="w-5 h-5 text-text" />
          </button>
        </div>
        <p className="text-text-muted text-sm mt-1 font-body">
          <span className="font-mono">{collected.toLocaleString()}</span> of{' '}
          <span className="font-mono">{total ? total.toLocaleString() : '…'}</span> events placed
        </p>
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
        ) : !hasBeenActive ? (
          <div className="h-full" />
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
