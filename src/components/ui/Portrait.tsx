import React, { useState } from 'react';
import { Avatar, getAnimal, portraitArtUrl } from '../../utils/avatar';

export type PortraitSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Literal strings so Tailwind's JIT sees them. Box, corner and placeholder glyph per size.
const SIZE_CLASSES: Record<PortraitSize, string> = {
  xs: 'w-5 h-5 rounded-[3px] text-[11px]',
  sm: 'w-8 h-8 rounded text-lg',
  md: 'w-11 h-11 rounded-md text-2xl',
  lg: 'w-[72px] h-[72px] rounded-lg text-4xl',
  xl: 'w-24 h-24 rounded-lg text-5xl',
};

// Art that failed once is not retried by every row on every 15s poll.
const failedArt = new Set<string>();

interface PortraitProps {
  avatar: Avatar;
  size: PortraitSize;
  /** Give the tile an accessible name. Off by default: almost everywhere the name sits beside it. */
  labelled?: boolean;
  className?: string;
}

/**
 * The player's animal on a square paper tile, after Wingspan's portrait cards.
 *
 * Until the art exists (`portraitArtUrl` returns null) the tile shows the animal's emoji, or
 * its initial where no emoji reads as that animal. See docs/avatars/index.md.
 */
const Portrait: React.FC<PortraitProps> = ({ avatar, size, labelled = false, className = '' }) => {
  const animal = getAnimal(avatar.animal);
  const art = portraitArtUrl(avatar.animal);
  const [, setFailed] = useState(0);
  const showArt = art !== null && !failedArt.has(art);
  const label = animal?.label ?? avatar.animal;

  return (
    <span
      // eslint-disable-next-line security/detect-object-injection -- union-typed key into const map
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-paper text-ink border border-border leading-none select-none ${SIZE_CLASSES[size]} ${className}`}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
      data-testid="portrait"
      data-animal={avatar.animal}
    >
      {showArt ? (
        <img
          src={art}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => {
            failedArt.add(art);
            setFailed((n) => n + 1);
          }}
        />
      ) : animal?.emoji ? (
        <span>{animal.emoji}</span>
      ) : (
        <span className="font-display font-semibold">{label.charAt(0)}</span>
      )}
    </span>
  );
};

export default Portrait;
