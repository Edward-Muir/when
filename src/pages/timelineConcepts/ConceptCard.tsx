import React, { useState } from 'react';
import type { HistoricalEvent } from '../../types';
import CategoryIcon from '../../components/CategoryIcon';
import { getImageUrl } from '../../utils/cloudinaryImage';
import { getEventColorStyle, getEventTextClass } from '../../utils/eventColor';
import type { ConceptId } from './shared';

/*
 * The landscape event card, restyled per concept. Same anatomy as Card.tsx's landscape
 * (image left 40%, the event's own colour block right) — the three looks differ in
 * silhouette, edge and shadow. Fills the card slot rather than a fixed 240px.
 */

/** Shell classes per concept (a function, not an index: the object-injection lint rule). */
function shell(concept: ConceptId, dead: boolean): string {
  switch (concept) {
    case 'dusk':
      return dead
        ? 'rounded-2xl bg-transparent ring-1 ring-inset ring-border opacity-80'
        : 'rounded-2xl cx-card-dusk bg-surface';
    case 'ledger':
      return dead
        ? 'rounded-md border border-dashed border-border bg-transparent'
        : 'rounded-md border border-border cx-card-ledger bg-surface';
    default:
      return dead
        ? 'rounded-xl bg-transparent ring-1 ring-inset ring-border'
        : 'rounded-xl cx-card-atlas bg-surface';
  }
}

export const ConceptCard: React.FC<{
  event: HistoricalEvent;
  concept: ConceptId;
  dead?: boolean;
  className?: string;
}> = ({ event, concept, dead = false, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = event.image_url && !imageError;
  return (
    <div
      className={`flex h-[84px] w-full flex-row overflow-hidden ${shell(concept, dead)} ${className}`}
    >
      <div className="relative h-full w-[40%] shrink-0 overflow-hidden">
        {hasImage ? (
          <img
            src={getImageUrl(event.image_url, 'thumbnail')}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover ${dead ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-border">
            <CategoryIcon category={event.category} className="h-8 w-8 text-text-muted" />
          </div>
        )}
      </div>
      <div
        className="flex h-full flex-1 items-center px-3 py-1"
        style={dead ? undefined : getEventColorStyle(event)}
      >
        <span
          className={`${
            dead ? 'text-text-muted' : getEventTextClass(event)
          } line-clamp-3 font-body text-sm font-medium leading-snug`}
        >
          {event.friendly_name}
        </span>
      </div>
    </div>
  );
};
