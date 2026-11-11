import React, { useState } from 'react';
import { HistoricalEvent } from '../types';
import CategoryIcon from './CategoryIcon';
import CardFace from './CardFace';
import { getImageUrl } from '../utils/cloudinaryImage';

export type CardSize = 'normal' | 'large' | 'landscape' | 'square';

interface CardProps {
  event: HistoricalEvent;
  className?: string;
  rotation?: number;
  onClick?: () => void;
  size?: CardSize;
  // Above-the-fold cards: load eagerly + high priority so they don't drag LCP down.
  // Defaults to lazy so off-screen cards keep deferring their image download.
  priority?: boolean;
}

const Card: React.FC<CardProps> = ({
  event,
  className = '',
  rotation = 0,
  onClick,
  size = 'normal',
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // No detail-image warm here: warming every rendered card cost ~12 full-size fetches a
  // game for popups that mostly never opened. GamePopup instead paints this card's
  // already-cached thumbnail underneath while the detail image loads over it.

  const rotationStyle = {
    transform: `rotate(${rotation}deg)`,
  };

  const hasImage = event.image_url && !imageError;

  const getSizeClass = (s: CardSize): string => {
    switch (s) {
      case 'normal':
        return 'w-[144px] h-[176px] sm:w-[160px] sm:h-[192px]';
      case 'large':
        return 'w-[160px] h-[216px] sm:w-[180px] sm:h-[243px]';
      case 'landscape':
        return 'w-[240px] h-[80px] sm:w-[280px] sm:h-[96px]';
      // The hand card: the art is square, so this is the one size that shows all of it.
      case 'square':
        return 'w-[168px] h-[168px]';
    }
  };

  const isLandscape = size === 'landscape';

  // Landscape layout: art bleeding into the card's colour, title on the right (CardFace)
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
          ${getSizeClass(size)}
          flex flex-row
          transition-colors duration-200
        `}
        style={rotationStyle}
        onClick={onClick}
      >
        <CardFace event={event} priority={priority} />
      </div>
    );
  }

  // Portrait and square layouts (normal/large/square): image with title overlay
  return (
    <div
      className={`
        rounded-lg overflow-hidden
        border border-border
        bg-surface
        shadow-sm
        ${onClick ? 'cursor-pointer active:scale-95' : ''}
        ${className}
        ${getSizeClass(size)}
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
            src={getImageUrl(event.image_url, 'thumbnail')}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            // The hand's squares decode with their first paint: the art is already in the
            // cache (useImagePrefetch), and an async decode shows an empty card first.
            decoding={size === 'square' ? 'sync' : 'async'}
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
