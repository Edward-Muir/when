import React, { useRef, useEffect } from 'react';
import { HistoricalEvent } from '../../types';
import TimelineEvent from './TimelineEvent';
import PlacementButton from './PlacementButton';

interface TimelineProps {
  events: HistoricalEvent[];
  onPlacement: (index: number) => void;
  onEventTap: (event: HistoricalEvent) => void;
  disabled?: boolean;
  newEventName?: string; // Name of newly added event for animation
}

const Timeline: React.FC<TimelineProps> = ({
  events,
  onPlacement,
  onEventTap,
  disabled = false,
  newEventName,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialScrolled = useRef(false);

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

      {/* Scrollable timeline content */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto timeline-scroll-vertical py-12"
      >
        <div className="relative flex flex-col items-center min-h-full">
          {/* Vertical connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-amber-400 -translate-x-1/2 rounded-full" />

          {/* Top placement button */}
          <PlacementButton
            index={0}
            onPlace={onPlacement}
            disabled={disabled}
            isFirst={true}
          />

          {/* Events with placement buttons between */}
          {events.map((event, idx) => (
            <React.Fragment key={event.name}>
              <TimelineEvent
                event={event}
                onTap={() => onEventTap(event)}
                isNew={event.name === newEventName}
              />
              <PlacementButton
                index={idx + 1}
                onPlace={onPlacement}
                disabled={disabled}
                isLast={idx === events.length - 1}
              />
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
