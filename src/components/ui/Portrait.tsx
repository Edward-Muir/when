import React, { useState } from 'react';
import { getAnimal, portraitArtUrl } from '../../utils/avatar';

/** Tile edge in CSS pixels. Only the sizes in use exist. */
export type PortraitSize = 20 | 44 | 48 | 52 | 60 | 96;

// Literal strings so Tailwind's JIT sees them. Box, corner and fallback glyph per size.
// Exported for LeaderboardSkeleton, whose loading tiles match the loaded ones.
export const SIZE_CLASSES: Record<PortraitSize, string> = {
  20: 'w-5 h-5 rounded-[3px] text-[11px]',
  44: 'w-11 h-11 rounded-md text-2xl',
  48: 'w-12 h-12 rounded-md text-[26px]',
  52: 'w-[52px] h-[52px] rounded-md text-[28px]',
  60: 'w-[60px] h-[60px] rounded-lg text-[32px]',
  96: 'w-24 h-24 rounded-lg text-5xl',
};

// Art that failed once is not retried by every row on every 15s poll.
const failedArt = new Set<string>();

export interface PortraitProps {
  /** Animal id. */
  animal: string;
  size: PortraitSize;
  /** A heavier frame in this colour: the leaderboard's podium (`getMedalColor`). */
  frame?: string | null;
  /**
   * Paint the art at this larger size and crop it to the tile, so a tile drawn smaller than its
   * neighbours shows less of the painting rather than a shrunken whole figure. The leaderboard
   * paints every portrait at first place's size this way (`podiumStyle`).
   */
  paintedAt?: PortraitSize;
  className?: string;
}

// Where the zoom is anchored: centred across, a little above centre down, because every
// portrait is a bust whose head sits in the upper half. A crop keeps the face, not the chest.
const CROP_ORIGIN = '50% 30%';

/**
 * The player's animal on a square paper tile. Decorative: wherever it appears, the name sits
 * beside it.
 *
 * If the art fails to load the tile shows the animal's emoji, or its initial where no emoji
 * reads as that animal. See docs/avatars/index.md.
 */
const Portrait: React.FC<PortraitProps> = ({
  animal,
  size,
  frame = null,
  paintedAt = size,
  className = '',
}) => {
  const info = getAnimal(animal);
  const art = portraitArtUrl(animal);
  const [, setFailed] = useState(0);
  const showArt = art !== null && !failedArt.has(art);
  const crop = paintedAt / size;

  return (
    <span
      // eslint-disable-next-line security/detect-object-injection -- union-typed key into const map
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-paper text-ink leading-none select-none ${frame ? 'border-2' : 'border border-border'} ${SIZE_CLASSES[size]} ${className}`}
      style={frame ? { borderColor: frame } : undefined}
      aria-hidden
      data-testid="portrait"
      data-animal={animal}
      data-size={size}
      data-frame={frame ?? undefined}
    >
      {showArt ? (
        <img
          src={art}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={
            crop > 1 ? { transform: `scale(${crop})`, transformOrigin: CROP_ORIGIN } : undefined
          }
          onError={() => {
            failedArt.add(art);
            setFailed((n) => n + 1);
          }}
        />
      ) : info?.emoji ? (
        <span>{info.emoji}</span>
      ) : (
        <span className="font-display font-semibold">{(info?.label ?? animal).charAt(0)}</span>
      )}
    </span>
  );
};

export default Portrait;
