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
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto timeline-scroll-vertical px-4 py-2"
    >
      <div className="max-w-sm mx-auto flex flex-col">
        {/* Direction indicator */}
        <div className="text-center text-sketch/50 text-xs py-2 sticky top-0 bg-cream/90 backdrop-blur-sm z-10">
          ↑ Earlier
        </div>

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

        {/* Direction indicator */}
        <div className="text-center text-sketch/50 text-xs py-2 sticky bottom-0 bg-cream/90 backdrop-blur-sm z-10">
          Later ↓
        </div>
      </div>
    </div>
  );
};

export default Timeline;
