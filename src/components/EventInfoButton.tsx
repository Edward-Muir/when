import React from 'react';
import { Info } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { getEventTextClass } from '../utils/eventColor';

/** One name for one thing, on both surfaces — and how every test reaches either of them. */
const LABEL = 'Read more about this event';

// The popup dismisses on a tap anywhere while the short description is showing, so the click has
// to stop here or the card vanishes instead of opening the read.
const stop = (onClick: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  onClick();
};

/**
 * The read-more control in the detail popup's header, right of the title.
 *
 * Flat and tinted with the card's own text colour: it is a watermark on the card, not a control
 * stuck to it. The negative vertical margin keeps its 44px touch target from inflating the
 * header's `px-4 py-3` box.
 */
export function EventInfoButton({
  event,
  tombstone,
  expanded,
  onClick,
}: {
  event: HistoricalEvent;
  tombstone?: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  const textClass = tombstone ? 'text-text-muted' : getEventTextClass(event);
  return (
    <button
      type="button"
      aria-label={LABEL}
      // The label is the same in both directions, so the state has to be announced separately.
      aria-expanded={expanded}
      onClick={stop(onClick)}
      className={`shrink-0 -my-1 w-11 h-11 flex items-center justify-center rounded-xl opacity-60 hover:opacity-100 active:scale-95 transition-all ${textClass}`}
    >
      <Info className="w-5 h-5" />
    </button>
  );
}

/**
 * The same control watermarked into the corner of an event's image, for a surface that has no
 * header to put it in. White rather than event-tinted, because over arbitrary card art a per-event
 * tint has nothing to guarantee contrast against; the drop shadow is what carries it on pale art.
 */
export function ImageInfoWatermark({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={LABEL}
      onClick={stop(onClick)}
      className={`w-11 h-11 flex items-center justify-center text-white opacity-55 hover:opacity-90 active:scale-95 transition-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] ${className}`}
    >
      <Info className="w-5 h-5" />
    </button>
  );
}
