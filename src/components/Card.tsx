import React, { useState } from 'react';
import { HistoricalEvent } from '../types';
import CategoryIcon from './CategoryIcon';

export type CardSize = 'normal' | 'large' | 'landscape';

interface CardProps {
  event: HistoricalEvent;
  className?: string;
  rotation?: number;
  onClick?: () => void;
  size?: CardSize;
}

const Card: React.FC<CardProps> = ({
  event,
  className = '',
  rotation = 0,
  onClick,
  size = 'normal',
}) => {
  const [imageError, setImageError] = useState(false);

  const rotationStyle = {
    transform: `rotate(${rotation}deg)`,
  };

  const hasImage = event.image_url && !imageError;

  const sizeClasses: Record<CardSize, string> = {
    normal: 'w-[144px] h-[176px] sm:w-[160px] sm:h-[192px]',
    large: 'w-[160px] h-[216px] sm:w-[180px] sm:h-[243px]',
    landscape: 'w-[240px] h-[80px] sm:w-[280px] sm:h-[96px]',
  };

  const isLandscape = size === 'landscape';

  // Landscape layout: image left (40%), title right (60%)
  if (isLandscape) {
    return (
      <div
        className={`
          rounded-lg overflow-hidden
          border border-border
          bg-surface
          shadow-sm
          ${onClick ? 'cursor-pointer active:scale-95' : ''}
          ${className}
          ${sizeClasses[size]}
          flex flex-row
          transition-colors duration-200
        `}
        style={rotationStyle}
        onClick={onClick}
      >
        {/* Image section (40% width) */}
        <div className="w-[40%] h-full relative overflow-hidden">
          {hasImage ? (
            <img
              src={event.image_url}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-border/30">
              <CategoryIcon category={event.category} className="text-text-muted w-8 h-8" />
            </div>
          )}
        </div>
        {/* Title section (60% width) */}
        <div className="w-[60%] h-full flex items-center px-2 py-1">
          <span className="text-text text-sm leading-tight line-clamp-3 font-body">
            {event.friendly_name}
          </span>
        </div>
      </div>
    );
  }

  // Portrait layout (normal/large): image with title overlay
  return (
    <div
      className={`
        rounded-lg overflow-hidden
        border border-border
        bg-surface
        shadow-sm
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${className}
        ${sizeClasses[size]}
        flex flex-col
        transition-colors duration-200
      `}
      style={rotationStyle}
      onClick={onClick}
    >
      {/* Full card is image with title overlay */}
      <div className="flex-1 relative overflow-hidden">
        {hasImage ? (
          <img
            src={event.image_url}
            alt=""
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-border/30">
            <CategoryIcon category={event.category} className="text-text-muted w-12 h-12" />
          </div>
        )}

        {/* Title overlay with gradient backdrop for readability */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 pt-8 pb-2">
          <span className="text-white text-ui-card-title line-clamp-2 block font-body drop-shadow-md">
            {event.friendly_name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Card;
