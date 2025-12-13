import React, { useState } from 'react';
import { HistoricalEvent } from '../types';
import CategoryIcon from './CategoryIcon';

interface CardProps {
  event: HistoricalEvent;
  className?: string;
  rotation?: number;
  onClick?: () => void;
  size?: 'normal' | 'large';
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

const Card: React.FC<CardProps> = ({
  event,
  className = '',
  rotation = 0,
  onClick,
  size = 'normal',
}) => {
  const [imageError, setImageError] = useState(false);
  const borderColor = getCategoryBorderColor(event.category);
  const titleBg = getCategoryTitleBg(event.category);

  const rotationStyle = {
    transform: `rotate(${rotation}deg)`,
  };

  const hasImage = event.image_url && !imageError;

  const sizeClasses = size === 'large'
    ? 'w-[160px] h-[216px] sm:w-[180px] sm:h-[243px]'
    : 'w-[144px] h-[176px] sm:w-[160px] sm:h-[192px]';

  return (
    <div
      className={`
        rounded-lg overflow-hidden
        border-2 ${borderColor}
        bg-white
        shadow-md
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${className}
        ${sizeClasses}
        flex flex-col
      `}
      style={rotationStyle}
      onClick={onClick}
    >
      {/* Title bar at top */}
      <div className={`${titleBg} px-2 py-1.5 border-b ${borderColor}`}>
        <span className="text-sketch text-xs font-medium leading-tight line-clamp-2 block">
          {event.friendly_name}
        </span>
      </div>

      {/* Image area */}
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
            <CategoryIcon category={event.category} className="text-gray-400 w-12 h-12" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
