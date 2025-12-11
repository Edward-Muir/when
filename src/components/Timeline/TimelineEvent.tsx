import React, { useState } from 'react';
import { HistoricalEvent } from '../../types';
import { formatYear, getCategoryColorClass } from '../../utils/gameLogic';
import CategoryIcon from '../CategoryIcon';

interface TimelineEventProps {
  event: HistoricalEvent;
  onTap: () => void;
  isNew?: boolean;
}

const getCategoryBorderColor = (category: string): string => {
  const colors: Record<string, string> = {
    'conflict': 'border-red-400',
    'disasters': 'border-gray-500',
    'exploration': 'border-teal-400',
    'cultural': 'border-purple-400',
    'infrastructure': 'border-amber-400',
    'diplomatic': 'border-blue-400',
  };
  return colors[category] || 'border-gray-400';
};

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, onTap, isNew = false }) => {
  const [imageError, setImageError] = useState(false);
  const bgColor = getCategoryColorClass(event.category);
  const borderColor = getCategoryBorderColor(event.category);
  const hasImage = event.image_url && !imageError;

  return (
    <div
      className={`
        flex justify-center py-1
        ${isNew ? 'animate-entrance' : ''}
      `}
    >
      <button
        onClick={onTap}
        className={`
          w-28 h-36 sm:w-32 sm:h-40
          rounded-lg overflow-hidden
          border-2 ${borderColor}
          ${bgColor}
          flex flex-col
          shadow-md
          transition-all duration-150
          touch-manipulation
          active:scale-95
          relative
          z-10
        `}
      >
        {/* Image or category icon background */}
        {hasImage ? (
          <>
            <img
              src={event.image_url}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <CategoryIcon category={event.category} className="text-white w-8 h-8" />
          </div>
        )}

        {/* Year at top */}
        <div className="relative z-10 bg-white/90 px-2 py-1 text-center">
          <span className="text-sketch font-bold text-sm sm:text-base">
            {formatYear(event.year)}
          </span>
        </div>

        {/* Event name (truncated) */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-1">
          <span
            className="text-white text-xs sm:text-sm text-center leading-tight line-clamp-2"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            {event.friendly_name}
          </span>
        </div>
      </button>
    </div>
  );
};

export default TimelineEvent;
