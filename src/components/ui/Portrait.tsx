import React, { useState } from 'react';
import { Avatar, getAnimal, getTheme, portraitArtUrl } from '../../utils/avatar';

export type PortraitSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Literal strings so Tailwind's JIT sees them. Box, corner and placeholder glyph per size.
const SIZE_CLASSES: Record<PortraitSize, string> = {
  xs: 'w-5 h-5 rounded-[3px] text-[11px]',
  sm: 'w-8 h-8 rounded text-lg',
  md: 'w-11 h-11 rounded-md text-2xl',
  lg: 'w-[72px] h-[72px] rounded-lg text-4xl',
  xl: 'w-24 h-24 rounded-lg text-5xl',
  '2xl': 'w-48 h-48 rounded-xl text-8xl',
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
  className?: string;
}

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
