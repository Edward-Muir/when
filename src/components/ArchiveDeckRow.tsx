import React, { useState } from 'react';
import { Lock, Check, Trophy } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { ArchiveDay } from '../utils/dailyReplay';
import { getThemeDisplayName } from '../utils/dailyTheme';
import { ThemeBest } from '../utils/themeBests';
import { formatShareDate } from '../utils/share';
import { formatWeekday, formatWeekdayDate } from '../utils/statsDerived';
import { getImageUrl } from '../utils/cloudinaryImage';
import CategoryIcon from './CategoryIcon';

interface ArchiveDeckRowProps {
  day: ArchiveDay;
  /** The card that opened the day's deck, for the art. Null when the day resolves to nothing. */
  seedEvent: HistoricalEvent | null;
  /** Curated days: the stored best on the theme. */
  themeBest: ThemeBest | undefined;
  /** Ordinary days: the most events placed in any game of the day (`dayBest`). */
  best: number | undefined;
  /** Starts the day; absent for a locked row. */
  onPlay?: () => void;
  /** A locked row's tap: the panel says why it is locked. */
  onLockedTap?: () => void;
}

/**
 * One day on the Archive timeline: the game's own timeline row (date column, tick, landscape
 * card) with the day's deck in the card instead of an event. The row and card dimensions
 * mirror `Timeline/TimelineEvent.tsx` and `Card.tsx`'s landscape size exactly, so the Archive
 * reads as the same object the player builds in a game.
 *
 * A curated day's card has a gold border. A missed day's art is greyed, the same treatment
 * a locked row gets, without the lock: it is the one the player can still go and fill in.
 * A locked row is `aria-disabled` rather than `disabled`, so a tap still lands: the card
 * shakes and the panel shows `lockedRowText`, instead of the tap doing nothing at all.
 * No opacity modifiers on theme tokens anywhere here — those compile to nothing (see
 * CLAUDE.md); dimming is `opacity-70` and `grayscale`.
 */
const ArchiveDeckRow: React.FC<ArchiveDeckRowProps> = ({
  day,
  seedEvent,
  themeBest,
  best,
  onPlay,
  onLockedTap,
}) => {
  const [imageError, setImageError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const { date, status, played, curated } = day;
  const name = getThemeDisplayName(day.theme);
  const locked = !onPlay;
  const missed = !played && status === 'replayable';
  const hasImage = !!seedEvent?.image_url && !imageError;

  const handleClick = () => {
    if (onPlay) {
      onPlay();
      return;
    }
    onLockedTap?.();
    // Off then on across a frame, so a tap mid-shake restarts it.
    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  };

  return (
    <div className="flex items-center w-full py-1" data-testid={`archive-day-${date}`}>
      {/* Date column (fixed 96px width) with tick */}
      <div className="w-24 pl-2 flex items-center justify-end shrink-0">
        <span className="pr-2 text-right leading-tight font-mono">
          <span className="block text-text font-bold text-sm">{formatShareDate(date)}</span>
          <span className="block text-text-muted text-xs">{formatWeekday(date)}</span>
        </span>
        <div className="w-3 h-1 bg-accent shrink-0" />
      </div>

      {/* Card area - landscape card */}
      <div className="flex-1 pl-3">
        <button
          onClick={handleClick}
          onAnimationEnd={() => setShaking(false)}
          aria-disabled={locked}
          aria-label={rowLabel(day, name, locked)}
          className={`w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg overflow-hidden bg-surface flex flex-row shadow-sm text-left touch-manipulation transition-colors duration-200 ${
            curated ? 'border-2 border-accent' : 'border border-border'
          } ${locked ? 'opacity-70' : 'active:scale-95'} ${shaking ? 'animate-shake-medium' : ''}`}
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
                className={`w-full h-full object-cover ${locked || missed ? 'grayscale' : ''}`}
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
              {name}
            </span>
            <DayLine day={day} themeBest={themeBest} best={best} />
          </div>
        </button>
      </div>
    </div>
  );
};

/** What a screen reader hears for the row: what tapping it does, and which day it is. */
function rowLabel({ date, status }: ArchiveDay, name: string, locked: boolean): string {
  if (status === 'upcoming') return `${name}: coming ${formatShareDate(date)}`;
  if (status === 'today') return locked ? `${name}: replay tomorrow` : `Play ${name}, today`;
  return `Play ${name}, ${formatWeekdayDate(date)}`;
}

/**
 * Why a locked row can't be played, for the pill its tap raises. One line on a 375px phone,
 * so under ~36 characters (see `hintCopy.ts`); the longest date, "Sep 30", makes 35.
 */
export function lockedRowText({ date, status }: ArchiveDay): string {
  if (status === 'upcoming') return `Opens ${formatShareDate(date)} as the Daily Challenge`;
  return 'Done for today. Replay it tomorrow.';
}

/**
 * The record line: how the player did, or why there is nothing to show. A curated day's best
 * is over the cards a run can place — the resolved pool minus the seed card that opens the
 * timeline — so a perfect clear reads as a full fraction. An ordinary day's pool is the
 * catalogue, so its best is a bare count. The upcoming teaser carries no line at all: its
 * date column is already in the future, which says everything.
 */
const DayLine: React.FC<{
  day: ArchiveDay;
  themeBest: ThemeBest | undefined;
  best: number | undefined;
}> = ({ day, themeBest, best }) => {
  const lineClass = 'flex items-center gap-1 text-xs leading-tight font-body';
  const muted = (text: string) => <span className={`${lineClass} text-text-muted`}>{text}</span>;
  if (day.status === 'upcoming') return null;
  if (day.status === 'today') return muted(day.played ? 'Replay tomorrow' : "Today's challenge");
  if (!day.played) return muted('Missed');
  if (day.curated && themeBest) {
    const placeable = Math.max(1, (day.cardCount ?? 0) - 1);
    return (
      <span className={`${lineClass} text-accent font-semibold`}>
        {themeBest.perfect ? (
          <Trophy className="w-3 h-3 shrink-0" aria-label="Perfect clear" />
        ) : themeBest.cleared ? (
          <Check className="w-3 h-3 shrink-0" aria-label="Cleared" />
        ) : null}
        High score: {themeBest.correctCount}/{placeable}
      </span>
    );
  }
  if (!day.curated && best !== undefined) {
    return <span className={`${lineClass} text-accent font-semibold`}>High score: {best}</span>;
  }
  return muted('Played');
};

export default ArchiveDeckRow;
