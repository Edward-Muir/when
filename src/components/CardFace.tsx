import React, { useState } from 'react';
import { HistoricalEvent } from '../types';
import CategoryIcon from './CategoryIcon';
import { getEventColorStyle, getEventTextClass } from '../utils/eventColor';
import { getImageUrl } from '../utils/cloudinaryImage';
import { YearLabel } from './Timeline/YearLabel';

interface CardFaceProps {
  event: HistoricalEvent;
  // Above-the-fold cards: load eagerly + high priority so they don't drag LCP down.
  priority?: boolean;
  /** A missed card: greyscale art, muted title, and no fill, so the row reads as hollow. */
  tombstone?: boolean;
}

/** Soft halo behind the title where it overlaps the faded edge of the art. */
function titleShadowClass(event: HistoricalEvent, tombstone: boolean): string {
  if (tombstone || !event.color) return '';
  return event.text_color === 'dark' ? 'card-title-halo-light' : 'card-title-halo-dark';
}

/**
 * The inside of a landscape card: the art bleeds across the left 70% and fades into the
 * card's own colour, and the title sits right-aligned on that colour. The one place this
 * layout is drawn; the host element owns size, border, radius and every handler.
 *
 * The art is the square `thumbnail` rung, so a wide slot shows a slice of it. The crop is
 * anchored above centre (see `.card-art-fade`) because faces and skylines sit there.
 */
const CardFace: React.FC<CardFaceProps> = ({ event, priority = false, tombstone = false }) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = event.image_url && !imageError;
  const titleClass = tombstone ? 'text-text-muted' : getEventTextClass(event);

  return (
    <div
      className="relative w-full h-full"
      style={tombstone ? undefined : getEventColorStyle(event)}
    >
      {hasImage ? (
        <img
          src={getImageUrl(event.image_url, 'thumbnail')}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setImageError(true)}
          className={`card-art-fade absolute inset-y-0 left-0 w-[70%] h-full object-cover ${
            tombstone ? 'grayscale opacity-70' : ''
          }`}
        />
      ) : (
        <div className="absolute inset-y-0 left-0 w-[40%] flex items-center justify-center">
          <CategoryIcon category={event.category} className="text-text-muted w-8 h-8" />
        </div>
      )}
      {/* 16px of right inset, kept from when the hand fanned landscape cards 16px apart. */}
      <div className="absolute inset-y-0 right-0 w-[52%] flex items-center justify-end pl-1 pr-4 py-1">
        <span
          className={`${titleClass} ${titleShadowClass(event, tombstone)} text-sm leading-tight line-clamp-3 font-body text-right`}
        >
          {event.friendly_name}
        </span>
      </div>
    </div>
  );
};

/**
 * The face of the one tall row: the card the player has just placed correctly, opened up.
 * The art runs edge to edge (the same `thumbnail` rung, cropped above centre like CardFace),
 * the year is stamped on it in the mono font, and the title sits along the bottom in the
 * display font on a dark scrim.
 *
 * The year here is decoration, so it is `aria-hidden`: the row's real year is the gutter label,
 * which also carries `data-timeline-year`. The card's accessible name stays its title alone.
 */
export const RevealFace: React.FC<{ event: HistoricalEvent }> = ({ event }) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = event.image_url && !imageError;

  return (
    <div className="absolute inset-0 text-left" style={getEventColorStyle(event)}>
      {hasImage ? (
        <img
          src={getImageUrl(event.image_url, 'thumbnail')}
          alt=""
          decoding="async"
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover object-[50%_35%]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <CategoryIcon category={event.category} className="text-text-muted w-12 h-12" />
        </div>
      )}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
      <span
        aria-hidden
        className="absolute top-2 left-3 text-white font-mono font-medium text-xl leading-tight card-title-halo-dark"
      >
        <YearLabel event={event} />
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-3 pt-10 pb-2">
        <span className="block text-white font-display text-lg leading-tight line-clamp-2 card-title-halo-dark">
          {event.friendly_name}
        </span>
      </div>
    </div>
  );
};

export default CardFace;
