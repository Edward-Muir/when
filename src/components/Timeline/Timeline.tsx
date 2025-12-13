import React, { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { HistoricalEvent } from '../../types';
import TimelineEvent from './TimelineEvent';
import Card from '../Card';

interface TimelineProps {
  events: HistoricalEvent[];
  onEventTap: (event: HistoricalEvent) => void;
  newEventName?: string; // Name of newly added event for animation
  // Drag and drop props
  isDragging: boolean;
  insertionIndex: number | null;
  draggedCard: HistoricalEvent | null;
  isOverTimeline: boolean;
}

// Ghost card that shows where the dragged card will land
const GhostCard: React.FC<{ event: HistoricalEvent }> = ({ event }) => (
  <div className="flex items-center py-1 opacity-50">
    {/* Empty date area to align with real cards */}
    <div className="flex items-center justify-end w-14 sm:w-16 shrink-0">
      <span className="text-sketch/50 font-bold text-sm sm:text-base">?</span>
      <div className="w-4 h-0.5 bg-amber-300 ml-1 -mr-1 z-10" />
    </div>
    {/* Ghost card with dashed border */}
    <div className="ml-4">
      <div className="border-2 border-dashed border-amber-400 rounded-lg">
        <Card event={event} size="normal" />
      </div>
    </div>
  </div>
);

const Timeline: React.FC<TimelineProps> = ({
  events,
  onEventTap,
  newEventName,
  isDragging,
  insertionIndex,
  draggedCard,
  isOverTimeline,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolled = useRef(false);

  // Make the entire timeline a single drop zone
  const { setNodeRef: setTimelineDropRef } = useDroppable({
    id: 'timeline-zone',
  });

  // Center the timeline content vertically on initial load
  useEffect(() => {
    if (!hasInitialScrolled.current && scrollRef.current && events.length > 0) {
      // Small delay to allow the DOM to render
      setTimeout(() => {
        const container = scrollRef.current;
        if (container) {
          // Scroll to center the content vertically
          const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
          container.scrollTop = scrollTop;
          hasInitialScrolled.current = true;
        }
      }, 50);
    }
  }, [events.length]);

  // Auto-scroll to show the new event when added
  useEffect(() => {
    if (newEventName && scrollRef.current) {
      // Small delay to allow the DOM to update
      setTimeout(() => {
        const container = scrollRef.current;
        if (container) {
          // Scroll to center
          container.scrollTo({
            top: container.scrollHeight / 2 - container.clientHeight / 2,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  }, [newEventName, events.length]);

  return (
    <div className="h-full relative">
      {/* Fixed "Earlier" indicator at top with fade */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-b from-cream via-cream/90 to-transparent" />
        <div className="absolute top-2 left-0 right-0 text-center text-sketch/50 text-xs">
          ↑ Earlier
        </div>
      </div>

      {/* Vertical timeline line - positioned to align with date ticks */}
      <div className="absolute left-[calc(3.5rem+0.5rem+2px)] sm:left-[calc(4rem+0.5rem+2px)] top-0 bottom-0 w-1 bg-amber-400 rounded-full z-0" />

      {/* Scrollable timeline content - entire area is a single drop zone */}
      {/* Scroll is disabled while dragging so year labels stay fixed as reference points */}
      <div
        ref={(node) => {
          // Combine refs: scrollRef for scroll behavior, setTimelineDropRef for drop zone
          scrollRef.current = node;
          setTimelineDropRef(node);
        }}
        className={`h-full py-12 relative z-10 ${
          isDragging ? 'overflow-hidden' : 'overflow-y-auto timeline-scroll-vertical'
        }`}
      >
        <div className="relative flex flex-col items-start min-h-full pl-2">
          {/* Ghost card at position 0 if inserting at start */}
          {isDragging && isOverTimeline && insertionIndex === 0 && draggedCard && (
            <GhostCard event={draggedCard} />
          )}

          {/* Events with inline ghost cards at insertion points */}
          {events.map((event, idx) => (
            <React.Fragment key={event.name}>
              <TimelineEvent
                event={event}
                onTap={() => onEventTap(event)}
                isNew={event.name === newEventName}
                index={idx}
              />
              {/* Show ghost card AFTER this event if inserting at idx + 1 */}
              {isDragging && isOverTimeline && insertionIndex === idx + 1 && draggedCard && (
                <GhostCard event={draggedCard} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Fixed "Later" indicator at bottom with fade */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-12 bg-gradient-to-t from-cream via-cream/90 to-transparent" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-sketch/50 text-xs">
          Later ↓
        </div>
      </div>
    </div>
  );
};

export default Timeline;
