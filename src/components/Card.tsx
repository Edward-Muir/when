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

  const sizeClasses = size === 'large'
    ? 'w-[160px] h-[216px] sm:w-[180px] sm:h-[243px]'
    : 'w-[144px] h-[176px] sm:w-[160px] sm:h-[192px]';

  return (
    <div
      className={`
        rounded-lg overflow-hidden
        border border-light-border dark:border-dark-border
        bg-light-card dark:bg-dark-card
        shadow-md dark:shadow-card-rest-dark
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${className}
        ${sizeClasses}
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
          <div className="w-full h-full flex items-center justify-center bg-light-border/30 dark:bg-dark-border/30">
            <CategoryIcon category={event.category} className="text-light-muted dark:text-dark-muted w-12 h-12" />
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
