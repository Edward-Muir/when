import React, { useState } from 'react';
import type { HistoricalEvent } from '../../types';
import CategoryIcon from '../../components/CategoryIcon';
import { getImageUrl } from '../../utils/cloudinaryImage';
import { yearParts } from './shared';

/*
 * A plate: the event as a photograph with its year set large beside it. Replaces card,
 * year label and tick in one piece — there is no gutter and no line left to align to.
 *
 * `light`: a surface plate, the year and title in ink. `photo`: the same square image
 * sharp on the left and a blurred, dimmed copy of it (same URL, one fetch — no new
 * Cloudinary rung) filling the rest, type in white.
 */
export type PlateVariant = 'light' | 'photo';

interface PlateProps {
  event: HistoricalEvent;
  variant: PlateVariant;
  size?: 'row' | 'hand';
  dead?: boolean;
}

const Square: React.FC<{ event: HistoricalEvent; px: number; dead: boolean }> = ({
  event,
  px,
  dead,
}) => {
  const [imageError, setImageError] = useState(false);
  const hasImage = event.image_url && !imageError;
  return (
    <div className="relative h-full shrink-0 overflow-hidden" style={{ width: px }}>
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
  );
};

interface PlateLook {
  shell: string;
  ink: string;
  inkMuted: string;
  title: string;
}

/** Colour/shell classes for the three states: photographic, light, or a dead tombstone. */
function plateLook(photo: boolean, dead: boolean): PlateLook {
  if (dead) {
    return {
      shell: 'bg-transparent ring-1 ring-inset ring-border',
      ink: 'text-text-muted',
      inkMuted: 'text-text-muted',
      title: 'text-text-muted',
    };
  }
  if (photo) {
    return {
      shell: 'cx-plate-photo bg-surface',
      ink: 'text-white',
      inkMuted: 'text-white opacity-70',
      title: 'text-white opacity-90',
    };
  }
  return {
    shell: 'cx-plate bg-surface',
    ink: 'text-text',
    inkMuted: 'text-text-muted',
    title: 'text-text',
  };
}

function yearSizeClass(size: 'row' | 'hand', main: string): string {
  if (size === 'hand') return 'text-[22px]';
  return main.length <= 5 ? 'text-[30px]' : 'text-[24px]';
}

export const Plate: React.FC<PlateProps> = ({ event, variant, size = 'row', dead = false }) => {
  const { main, suffix } = yearParts(event.year);
  const px = size === 'row' ? 132 : 96;
  const photo = variant === 'photo' && !dead && Boolean(event.image_url);
  const look = plateLook(photo, dead);
  const yearSize = yearSizeClass(size, main);

  return (
    <div
      className={`relative flex w-full overflow-hidden rounded-2xl ${look.shell}`}
      style={{ height: px }}
    >
      {photo && (
        <>
          <img
            src={getImageUrl(event.image_url, 'thumbnail')}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="cx-photo-field absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/15" />
        </>
      )}
      <div className="relative flex h-full w-full">
        <Square event={event} px={px} dead={dead} />
        <div
          className={`flex min-w-0 flex-1 flex-col justify-center ${
            size === 'row' ? 'px-4' : 'px-3'
          }`}
        >
          <div className="flex items-baseline gap-1.5 leading-none">
            <span
              className={`whitespace-nowrap font-display font-semibold ${yearSize} ${look.ink}`}
            >
              {main}
            </span>
            {suffix && (
              <span className={`font-body text-[11px] uppercase tracking-[0.2em] ${look.inkMuted}`}>
                {suffix}
              </span>
            )}
          </div>
          <span
            className={`mt-1.5 line-clamp-2 font-body font-medium leading-snug ${
              size === 'row' ? 'text-[15px]' : 'text-[13px]'
            } ${look.title}`}
          >
            {event.friendly_name}
          </span>
        </div>
      </div>
    </div>
  );
};
