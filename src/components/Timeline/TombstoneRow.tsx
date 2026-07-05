import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FailedPlacement, HistoricalEvent } from '../../types';
import { formatYear } from '../../utils/gameLogic';
import { getImageUrl } from '../../utils/cloudinaryImage';
import CategoryIcon from '../CategoryIcon';
import Card from '../Card';

interface TombstoneRowProps {
  failed: FailedPlacement;
  onTap: () => void;
  /** The ghost slot is hovering this tombstone's gap: slide the card right, out of the way. */
  displaced: boolean;
  /** Dragged card rendered in this row's card slot — the ghost takes the tombstone's place. */
  ghostEvent?: HistoricalEvent | null;
  /** True only while this card's failed-reveal FLIP runs; enables the shared layoutId. */
  revealing?: boolean;
}

// A failed card shown at its true position as a washed-out "dead" card: regular card
// geometry, greyscale image, muted text on a transparent background (all colors from
// theme tokens, so dark mode just works). The row has the exact same footprint as a
// real card row, so when a drag hovers this gap the ghost card takes the tombstone's
// place without displacing anything — the whole card slides right (never up/down) and
// slides back when the ghost moves on. Display only — no data-timeline-index /
// data-timeline-year, so drag insertion math, centering and ripples ignore it.
const TombstoneRow: React.FC<TombstoneRowProps> = ({
  failed,
  onTap,
  displaced,
  ghostEvent,
  revealing = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [imageError, setImageError] = useState(false);
  const { event } = failed;
  const hasImage = event.image_url && !imageError;
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 30 };

  return (
    <div data-tombstone-name={event.name} className="flex items-center w-full py-1">
      {/* Year column (fixed 96px width): faint year at rest, ghost's "?" while hosting */}
      <div className="w-24 pl-2 flex items-center justify-end shrink-0">
        {ghostEvent ? (
          <>
            <span className="text-text-muted/50 font-bold text-xs sm:text-sm font-mono pr-2">
              ?
            </span>
            <div className="w-3 h-1 bg-accent/50 shrink-0" />
          </>
        ) : (
          <>
            <span className="text-text-muted opacity-70 font-bold text-sm font-mono pr-2 text-right leading-tight">
              {formatYear(event.year)}
            </span>
            <div className="w-3 h-1 bg-accent opacity-40 shrink-0" />
          </>
        )}
      </div>

      {/* Card slot with a real card's footprint; the tombstone card slides right over it
          while the ghost drops in */}
      <div className="flex-1 pl-3">
        <div className="relative w-[240px] h-[80px] sm:w-[280px] sm:h-[96px]">
          {ghostEvent && (
            <div className="absolute inset-0 opacity-ghost">
              <Card event={ghostEvent} size="landscape" />
            </div>
          )}
          {/* key remount when the reveal ends: dropping a layoutId in place leaves a stale
              projection transform that would block the slide-right animation */}
          <motion.button
            key={revealing ? 'reveal' : 'rest'}
            onClick={onTap}
            layoutId={revealing && !shouldReduceMotion ? `placed-${event.name}` : undefined}
            initial={false}
            animate={{ x: displaced ? '105%' : 0, opacity: displaced ? 0.35 : 1 }}
            transition={transition}
            className={`absolute inset-0 rounded-lg overflow-hidden border border-border bg-transparent flex flex-row touch-manipulation ${
              displaced ? 'pointer-events-none' : ''
            }`}
          >
            {/* Image section (40% width), greyscaled */}
            <div className="w-[40%] h-full relative overflow-hidden">
              {hasImage ? (
                <img
                  src={getImageUrl(event.image_url, 'thumbnail')}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover grayscale opacity-70"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-border/30">
                  <CategoryIcon category={event.category} className="text-text-muted w-8 h-8" />
                </div>
              )}
            </div>
            {/* Title section (60% width): muted text, transparent background */}
            <div className="w-[60%] h-full flex items-center px-2 py-1">
              <span className="text-text-muted text-sm leading-tight line-clamp-3 font-body text-left">
                {event.friendly_name}
              </span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TombstoneRow;
