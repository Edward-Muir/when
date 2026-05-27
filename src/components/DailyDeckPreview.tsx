import React, { ReactNode, useState } from 'react';
import { HistoricalEvent } from '../types';
import CategoryIcon from './CategoryIcon';
import { getImageUrl } from '../utils/cloudinaryImage';

interface DailyDeckPreviewProps {
  event: HistoricalEvent | null;
  themeName: string;
  /** Primary call-to-action rendered at the bottom of the card (Play / Share). */
  cta: ReactNode;
  className?: string;
}

/**
 * Hero card on the Daily page: a "glimpse of today's deck" — today's starting event
 * shown as a large image with a category badge, caption overlay, a challenge/date band,
 * and the primary CTA attached beneath, all inside one rounded card.
 */
const DailyDeckPreview: React.FC<DailyDeckPreviewProps> = ({
  event,
  themeName,
  cta,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = event?.image_url && !imageError;

  return (
    <div
      className={`flex flex-col rounded-2xl overflow-hidden border border-border bg-surface shadow-sm ${className}`}
    >
      {/* Image area */}
      <div className="relative flex-1 min-h-[180px] overflow-hidden">
        {hasImage ? (
          <img
            src={getImageUrl(event.image_url, 'detail')}
            alt=""
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-border/30">
            {event && (
              <CategoryIcon category={event.category} className="text-text-muted w-16 h-16" />
            )}
          </div>
        )}

        {/* Caption overlay — today's first event */}
        {event && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-10 pb-3">
            <span className="font-display text-white text-lg leading-tight drop-shadow-md line-clamp-2">
              {event.friendly_name}
            </span>
          </div>
        )}
      </div>

      {/* Challenge / theme band */}
      <div className="bg-surface px-4 py-2.5 border-t border-border text-xs font-body font-semibold uppercase tracking-[0.15em]">
        <span className="text-text-muted">· Today&apos;s Challenge · </span>
        <span className="text-accent">{themeName}</span>
      </div>

      {/* Primary CTA */}
      <div className="p-3 pt-0">{cta}</div>
    </div>
  );
};

export default DailyDeckPreview;
