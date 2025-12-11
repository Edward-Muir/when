import React, { useState } from 'react';
import { HistoricalEvent } from '../../types';
import { formatYear } from '../../utils/gameLogic';
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

const getCategoryTitleBg = (category: string): string => {
  const colors: Record<string, string> = {
    'conflict': 'bg-red-100',
    'disasters': 'bg-gray-200',
    'exploration': 'bg-teal-100',
    'cultural': 'bg-purple-100',
    'infrastructure': 'bg-amber-100',
    'diplomatic': 'bg-blue-100',
  };
  return colors[category] || 'bg-gray-100';
};

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, onTap, isNew = false }) => {
  const [imageError, setImageError] = useState(false);
  const borderColor = getCategoryBorderColor(event.category);
  const titleBg = getCategoryTitleBg(event.category);
  const hasImage = event.image_url && !imageError;

  return (
    <div
      className={`
        flex items-center py-1
        ${isNew ? 'animate-entrance' : ''}
      `}
    >
      {/* Date side (left) with tick that overlaps timeline */}
      <div className="flex items-center justify-end w-14 sm:w-16 shrink-0">
        <span className="text-sketch font-bold text-sm sm:text-base">
          {formatYear(event.year)}
        </span>
        <div className="w-4 h-0.5 bg-amber-500 ml-1 -mr-1 z-10" />
      </div>

      {/* Card side (right) - title above image */}
      <button
        onClick={onTap}
        className={`
          w-36 h-44 sm:w-40 sm:h-48
          rounded-lg overflow-hidden
          border-2 ${borderColor}
          bg-white
          flex flex-col
          shadow-md
          transition-all duration-150
          touch-manipulation
          active:scale-95
          z-10
          ml-4
        `}
      >
        {/* Title bar at top */}
        <div className={`${titleBg} px-2 py-1.5 border-b ${borderColor}`}>
          <span className="text-sketch text-xs font-medium leading-tight line-clamp-2 block">
            {event.friendly_name}
          </span>
        </div>

        {/* Image area - full opacity, no overlay */}
        <div className="flex-1 relative">
          {hasImage ? (
            <img
              src={event.image_url}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <CategoryIcon category={event.category} className="text-gray-400 w-10 h-10" />
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

export default TimelineEvent;
