import React, { useState } from 'react';
import { HistoricalEvent } from '../types';
import { formatYear, getCategoryColorClass } from '../utils/gameLogic';
import CategoryIcon from './CategoryIcon';

interface CardProps {
  event: HistoricalEvent;
  showYear: boolean;
  isRevealing?: boolean;
  className?: string;
  rotation?: number;
  onClick?: () => void;
  size?: 'normal' | 'large';
}

const getCategoryRibbonColor = (category: string): string => {
  const colors: Record<string, string> = {
    'conflict': 'bg-red-500',
    'disasters': 'bg-gray-600',
    'exploration': 'bg-teal-500',
    'cultural': 'bg-purple-500',
    'infrastructure': 'bg-amber-500',
    'diplomatic': 'bg-blue-500',
  };
  return colors[category] || 'bg-gray-500';
};

const Card: React.FC<CardProps> = ({
  event,
  showYear,
  isRevealing = false,
  className = '',
  rotation = 0,
  onClick,
  size = 'normal',
}) => {
  const [imageError, setImageError] = useState(false);
  const bgColor = getCategoryColorClass(event.category);
  const ribbonColor = getCategoryRibbonColor(event.category);

  const rotationStyle = {
    transform: `rotate(${rotation}deg)`,
  };

  const hasImage = event.image_url && !imageError;

  const sizeClasses = size === 'large'
    ? 'w-[160px] h-[216px] sm:w-[180px] sm:h-[243px]'
    : 'w-[119px] h-[161px] sm:w-[144px] sm:h-[194px]';

  return (
    <div
      className={`
        p-[3px] rounded-lg
        bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600
        shadow-card-rest
        transition-all duration-fast
        ${isRevealing ? 'reveal-year' : ''}
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${className}
      `}
      style={rotationStyle}
      onClick={onClick}
    >
      <div
        className={`
          relative rounded-md overflow-hidden
          ${sizeClasses}
          ${bgColor}
          flex flex-col justify-between
          card-worn-edge
        `}
      >
        {/* Category ribbon */}
        <div className={`absolute top-2 right-2 z-20 w-4 h-4 sm:w-5 sm:h-5 rounded-full ${ribbonColor} border-2 border-white/50 shadow-sm`} />

        {/* Background image or category icon */}
        {hasImage ? (
          <>
            <img
              src={event.image_url}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CategoryIcon category={event.category} className="text-white" />
          </div>
        )}

        {/* Card content */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-2 sm:p-3">
          <h3
            className={`text-white text-center leading-tight ${size === 'large' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)' }}
          >
            {event.friendly_name}
          </h3>
        </div>

        {/* Year section */}
        <div className={`
          relative z-10 mx-2 mb-2 sm:mx-3 sm:mb-3
          ${size === 'large' ? 'h-12 sm:h-14' : 'h-10 sm:h-12'}
          rounded-md flex items-center justify-center
          ${showYear ? 'bg-white/90' : 'bg-white/20 border-2 border-dashed border-white/40'}
          transition-all duration-fast
        `}>
          {showYear ? (
            <span className={`text-sketch font-bold ${size === 'large' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
              {formatYear(event.year)}
            </span>
          ) : (
            <span className="text-white/60 text-lg">?</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
