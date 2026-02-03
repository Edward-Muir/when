import type { HistoricalEvent } from '../../types';
import { formatYear } from '../../utils/formatYear';
import { CategoryIcon } from './CategoryIcon';

interface EventPreviewProps {
  event: HistoricalEvent;
}

// Image dimension constants (matching main game's GamePopup)
const IMAGE_CONTAINER_WIDTH = 340;
const IMAGE_MIN_HEIGHT = 128;
const IMAGE_MAX_HEIGHT = 384;
const IMAGE_DEFAULT_HEIGHT = 192;

function getImageHeight(event: HistoricalEvent): number {
  if (!event.image_width || !event.image_height) return IMAGE_DEFAULT_HEIGHT;
  const aspectRatio = event.image_width / event.image_height;
  const calculatedHeight = IMAGE_CONTAINER_WIDTH / aspectRatio;
  return Math.min(Math.max(calculatedHeight, IMAGE_MIN_HEIGHT), IMAGE_MAX_HEIGHT);
}

export function EventPreview({ event }: EventPreviewProps) {
  const imageHeight = getImageHeight(event);

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
        Preview
      </p>
      <div className="mx-auto max-w-[340px] overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        {/* Header with title + year */}
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-display text-lg font-semibold leading-tight text-text">
            {event.friendly_name || 'Untitled Event'}
          </h3>
          <span className="mt-1 block font-mono text-2xl font-bold text-accent-gold">
            {formatYear(event.year)}
          </span>
        </div>

        {/* Image section */}
        <div className="relative overflow-hidden" style={{ height: `${imageHeight}px` }}>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt=""
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Hide broken images
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-secondary">
              <CategoryIcon category={event.category} className="text-text-secondary" />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-4 py-3">
          <p className="font-body text-sm leading-relaxed text-text">
            {event.description || 'No description'}
          </p>
        </div>
      </div>
    </div>
  );
}
