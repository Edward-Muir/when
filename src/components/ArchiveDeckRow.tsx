import React, { useState } from 'react';
import { Lock, Check, Trophy } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { ArchiveEntry } from '../utils/themeReplay';
import { ThemeBest } from '../utils/themeBests';
import { formatShareDate } from '../utils/share';
import { getImageUrl } from '../utils/cloudinaryImage';
import CategoryIcon from './CategoryIcon';

interface ArchiveDeckRowProps {
  entry: ArchiveEntry;
  /** The deck's opening card, for the art. Null when the theme resolves to nothing. */
  seedEvent: HistoricalEvent | null;
  best: ThemeBest | undefined;
  /** False for a locked or too-thin deck; the card renders disabled. */
  playable: boolean;
  onPlay: () => void;
}

/**
 * One deck on the Archive timeline: the game's own timeline row (date column, tick, landscape
 * card) with a theme in the card instead of an event. The row and card dimensions mirror
 * `Timeline/TimelineEvent.tsx` and `Card.tsx`'s landscape size exactly, so the Archive reads
 * as the same object the player builds in a game.
 *
 * The date column shows the day the deck ran as the daily; the year sits beneath it because
 * the list will span years. No opacity modifiers on theme tokens anywhere here — those
 * compile to nothing (see CLAUDE.md); dimming is `opacity-70` and `grayscale`.
 */
const ArchiveDeckRow: React.FC<ArchiveDeckRowProps> = ({
  entry,
  seedEvent,
  best,
  playable,
  onPlay,
}) => {
  const [imageError, setImageError] = useState(false);
  const { theme, releaseDate, locked, cardCount } = entry;
  const hasImage = !!seedEvent?.image_url && !imageError;
  const year = releaseDate.slice(0, 4);

  return (
    <div className="flex items-center w-full py-1" data-archive-theme={theme.id}>
      {/* Date column (fixed 96px width) with tick */}
      <div className="w-24 pl-2 flex items-center justify-end shrink-0">
        <span className="pr-2 text-right leading-tight font-mono">
          <span className="block text-text font-bold text-sm">{formatShareDate(releaseDate)}</span>
          <span className="block text-text-muted text-xs">{year}</span>
        </span>
        <div className="w-3 h-1 bg-accent shrink-0" />
      </div>

      {/* Card area - landscape card */}
      <div className="flex-1 pl-3">
        <button
          onClick={onPlay}
          disabled={!playable}
          aria-label={locked ? `${theme.name}: replay tomorrow` : `Play ${theme.name}`}
          className={`w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg overflow-hidden border border-border bg-surface flex flex-row shadow-sm text-left touch-manipulation transition-colors duration-200 ${
            playable ? 'active:scale-95' : 'opacity-70'
          }`}
        >
          {/* Image section (40% width) */}
          <div className="w-[40%] h-full relative overflow-hidden">
            {hasImage ? (
              <img
                src={getImageUrl(seedEvent.image_url, 'thumbnail')}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setImageError(true)}
                className={`w-full h-full object-cover ${locked ? 'grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-border">
                {seedEvent && (
                  <CategoryIcon category={seedEvent.category} className="text-text-muted w-8 h-8" />
                )}
              </div>
            )}
            {locked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Lock className="w-6 h-6 text-white drop-shadow-md" />
              </div>
            )}
          </div>

          {/* Title section (60% width) */}
          <div className="w-[60%] h-full flex flex-col justify-center px-2 py-1 gap-0.5">
            <span className="font-display font-semibold text-sm leading-tight line-clamp-2 text-text">
              {theme.name}
            </span>
            <span className="text-xs leading-tight text-text-muted font-body">
              {cardCount} cards
            </span>
            <BestLine best={best} locked={locked} playable={playable} />
          </div>
        </button>
      </div>
    </div>
  );
};

/** The record line: what to beat, or why there is nothing to beat yet. */
const BestLine: React.FC<{ best: ThemeBest | undefined; locked: boolean; playable: boolean }> = ({
  best,
  locked,
  playable,
}) => {
  const lineClass = 'flex items-center gap-1 text-xs leading-tight font-body';
  if (locked) return <span className={`${lineClass} text-text-muted`}>Replay tomorrow</span>;
  if (!playable) return <span className={`${lineClass} text-text-muted`}>Unavailable</span>;
  if (!best) return <span className={`${lineClass} text-text-muted`}>Not played yet</span>;
  return (
    <span className={`${lineClass} text-accent font-semibold`}>
      {best.perfect ? (
        <Trophy className="w-3 h-3 shrink-0" aria-label="Perfect clear" />
      ) : best.cleared ? (
        <Check className="w-3 h-3 shrink-0" aria-label="Cleared" />
      ) : null}
      Best {best.correctCount} placed
    </span>
  );
};

export default ArchiveDeckRow;
