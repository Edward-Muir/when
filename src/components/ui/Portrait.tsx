import React, { useState } from 'react';
import { Avatar, getAnimal, getTheme, portraitArtUrl } from '../../utils/avatar';

export type PortraitSize = 'xs' | 'sm' | 'md' | 'md1' | 'md2' | 'md3' | 'lg' | 'xl';

// Literal strings so Tailwind's JIT sees them. Box, corner and placeholder glyph per size.
// Exported for LeaderboardSkeleton, whose loading tiles match the loaded ones.
export const SIZE_CLASSES: Record<PortraitSize, string> = {
  xs: 'w-5 h-5 rounded-[3px] text-[11px]',
  sm: 'w-8 h-8 rounded text-lg',
  md: 'w-11 h-11 rounded-md text-2xl',
  md1: 'w-12 h-12 rounded-md text-[26px]',
  md2: 'w-[52px] h-[52px] rounded-md text-[28px]',
  md3: 'w-[60px] h-[60px] rounded-lg text-[32px]',
  lg: 'w-[72px] h-[72px] rounded-lg text-4xl',
  xl: 'w-24 h-24 rounded-lg text-5xl',
};

/**
 * The tile fill for a theme colour: a faint mix into the paper. A standard colour mixed into
 * the token, because `bg-paper/NN`-style modifiers on theme tokens compile to nothing
 * (CLAUDE.md, Styling). Shared with the picker's tint swatches.
 */
export function tintStyle(color: string): React.CSSProperties {
  return { background: `color-mix(in srgb, ${color} 22%, var(--color-paper))` };
}

// Art that failed once is not retried by every row on every 15s poll.
const failedArt = new Set<string>();

interface PortraitProps {
  avatar: Avatar;
  size: PortraitSize;
  /** Give the tile an accessible name. Off by default: almost everywhere the name sits beside it. */
  labelled?: boolean;
  /** A heavier frame in this colour: the leaderboard's podium (`getMedalColor`). */
  frame?: string | null;
  /**
   * Zoom the art by this factor, so a tile drawn smaller than its neighbours shows less of the
   * painting rather than a shrunken whole figure. The leaderboard draws every portrait at first
   * place's scale this way (`podiumStyle`).
   */
  crop?: number;
  className?: string;
}

// Where the zoom is anchored: centred across, a little above centre down, because every
// portrait is a bust whose head sits in the upper half. A crop keeps the face, not the chest.
const CROP_ORIGIN = '50% 30%';

/**
 * The player's animal on a square paper tile, after Wingspan's portrait cards, faintly tinted
 * by their theme so players read apart at a glance without the tile shouting.
 *
 * Until the art exists (`portraitArtUrl` returns null) the tile shows the animal's emoji, or
 * its initial where no emoji reads as that animal. See docs/avatars/index.md.
 */
const Portrait: React.FC<PortraitProps> = ({
  avatar,
  size,
  labelled = false,
  frame = null,
  crop = 1,
  className = '',
}) => {
  const animal = getAnimal(avatar.animal);
  const art = portraitArtUrl(avatar.animal);
  const [, setFailed] = useState(0);
  const showArt = art !== null && !failedArt.has(art);
  const label = animal?.label ?? avatar.animal;
  const tint = getTheme(avatar.theme)?.color;

  return (
    <span
      // eslint-disable-next-line security/detect-object-injection -- union-typed key into const map
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-paper text-ink leading-none select-none ${frame ? 'border-2' : 'border border-border'} ${SIZE_CLASSES[size]} ${className}`}
      style={{ ...(tint ? tintStyle(tint) : {}), ...(frame ? { borderColor: frame } : {}) }}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? label : undefined}
      aria-hidden={labelled ? undefined : true}
      data-testid="portrait"
      data-animal={avatar.animal}
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
      ) : animal?.emoji ? (
        <span>{animal.emoji}</span>
      ) : (
        <span className="font-display font-semibold">{label.charAt(0)}</span>
      )}
    </span>
  );
};

export default Portrait;
