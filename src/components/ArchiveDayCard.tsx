import React, { useEffect, useState } from 'react';
import { Check, Play, Trophy } from 'lucide-react';
import { GameConfig, HistoricalEvent } from '../types';
import { HeatCell, formatWeekdayDate } from '../utils/statsDerived';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { buildDailyConfig, getDailyPreviewEvent } from '../utils/dailyConfig';
import { buildCuratedPool } from '../utils/dailyPool';
import { buildDayReplayConfig, isReplayableDay } from '../utils/dailyReplay';
import { getDailyPuzzleNumber } from '../utils/puzzleDate';
import { getGameHistory } from '../utils/gameHistory';
import { getThemeBests } from '../utils/themeBests';
import { getTodayResult } from '../utils/playerStorage';
import { getImageUrl } from '../utils/cloudinaryImage';
import type { CuratedTheme } from '../utils/curatedThemes';
import CategoryIcon from './CategoryIcon';
import Modal from './ui/Modal';

interface ArchiveDayCardProps {
  /** The tapped day, or null when the card is closed. */
  cell: HeatCell | null;
  allEvents: HistoricalEvent[];
  /** The player's local date, from `useToday`. */
  today: string;
  onPlay: (config: GameConfig) => void;
  onDismiss: () => void;
}

/**
 * One day of the Archive calendar, opened by tapping its square: the card that opened that
 * day's daily, the theme, how the player did, and the way to play it.
 *
 * - A missed past day offers **Play this day**, and counts as that day's daily once finished.
 * - A played past day offers **Replay**, which is practice (see `dailyReplay.ts`).
 * - Today offers the ordinary daily while it is unplayed, so the result, the resume and the
 *   leaderboard all work as on the Daily tab; once played it is replayable from tomorrow,
 *   like a curated deck in the Archive always was.
 *
 * The art is the real opening card, `getDailyPreviewEvent(date)`, rather than the cheaper
 * stand-in the Archive list used to show. Building a past date's deck walks the seven-day
 * recency chain (a couple of hundred ms the first time), which a list of every day could not
 * afford but one tap can: it runs a frame after the card opens, behind a placeholder, so the
 * card animates in first. One `thumbnail` per tap, and every one of those images already
 * fronted the Daily tab on its day, so the card adds no new Cloudinary conversions.
 */
const ArchiveDayCard: React.FC<ArchiveDayCardProps> = ({
  cell,
  allEvents,
  today,
  onPlay,
  onDismiss,
}) => {
  // Keep the last day on screen while the card animates out (the Modal stays mounted).
  const [shown, setShown] = useState<HeatCell | null>(cell);
  if (cell && cell !== shown) setShown(cell);

  const date = shown?.date;
  const [starter, setStarter] = useState<{ date: string; event: HistoricalEvent | null }>();
  useEffect(() => {
    if (!date || allEvents.length === 0) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(() => setStarter({ date, event: getDailyPreviewEvent(allEvents, date) }));
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [date, allEvents]);

  return (
    <Modal open={!!cell} onDismiss={onDismiss} rounded="2xl" bordered={false}>
      {shown && (
        <DayCardBody
          key={shown.date}
          cell={shown}
          starter={starter?.date === shown.date ? starter.event : undefined}
          allEvents={allEvents}
          today={today}
          onPlay={onPlay}
        />
      )}
    </Modal>
  );
};

const DayCardBody: React.FC<{
  cell: HeatCell;
  /** Undefined while it is being worked out; null when the day resolves to no card. */
  starter: HistoricalEvent | null | undefined;
  allEvents: HistoricalEvent[];
  today: string;
  onPlay: (config: GameConfig) => void;
}> = ({ cell, starter, allEvents, today, onPlay }) => {
  const { date } = cell;
  const theme = getDailyTheme(date);
  const curated = theme.type === 'curated' ? theme.curated : undefined;
  const puzzle = getDailyPuzzleNumber(date);

  return (
    <div className="flex flex-col items-center gap-3 p-5 text-center">
      <DayArt starter={starter} curated={!!curated} missed={!cell.played && date !== today} />

      <div className="flex flex-col items-center gap-1">
        {curated && (
          <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-accent">
            Curated
          </span>
        )}
        <h2 className="font-display text-xl font-semibold leading-tight text-text">
          {getThemeDisplayName(theme)}
        </h2>
        <p className="font-body text-sm text-text-muted">
          {formatWeekdayDate(date)}
          {puzzle !== null && ` · Daily #${puzzle}`}
        </p>
        <p className="font-body text-sm text-text">{statusText(cell, today)}</p>
        {curated && <ThemeBestLine theme={curated} allEvents={allEvents} />}
      </div>

      <DayAction cell={cell} allEvents={allEvents} today={today} onPlay={onPlay} />
    </div>
  );
};

/** The opening card's art: greyed for a missed day, ringed for a curated one. */
const DayArt: React.FC<{
  starter: HistoricalEvent | null | undefined;
  curated: boolean;
  missed: boolean;
}> = ({ starter, curated, missed }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = imageError ? undefined : getImageUrl(starter?.image_url, 'thumbnail');
  return (
    <div
      className={`relative aspect-square w-48 overflow-hidden rounded-xl bg-border ${
        curated ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
      }`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={starter?.friendly_name ?? ''}
          decoding="async"
          onError={() => setImageError(true)}
          className={`h-full w-full object-cover ${missed ? 'grayscale' : ''}`}
        />
      ) : (
        starter && (
          <div className="flex h-full w-full items-center justify-center">
            <CategoryIcon category={starter.category} className="h-10 w-10 text-text-muted" />
          </div>
        )
      )}
    </div>
  );
};

/**
 * How the player did that day. The score comes from that day's history record, or today's
 * stored result; history is re-read on open, like the Archive and Stats tabs, because a game
 * just finished writes there.
 */
function statusText({ date, played }: HeatCell, today: string): string {
  if (!played) return date === today ? "Today's challenge" : 'Missed';
  const score =
    getGameHistory().find((record) => record.mode === 'daily' && record.date === date)?.correct
      .length ?? (date === today ? getTodayResult()?.correctCount : undefined);
  return score === undefined ? 'Played' : `${score} placed`;
}

/** A curated day's personal best, over the cards a run can place (the pool minus the seed). */
const ThemeBestLine: React.FC<{ theme: CuratedTheme; allEvents: HistoricalEvent[] }> = ({
  theme,
  allEvents,
}) => {
  const best = getThemeBests()[theme.id];
  if (!best) return null;
  const placeable = Math.max(1, buildCuratedPool(allEvents, theme).length - 1);
  return (
    <p className="flex items-center gap-1 font-body text-xs font-semibold text-accent">
      {best.perfect ? (
        <Trophy className="h-3 w-3 shrink-0" aria-label="Perfect clear" />
      ) : best.cleared ? (
        <Check className="h-3 w-3 shrink-0" aria-label="Cleared" />
      ) : null}
      High score: {best.correctCount}/{placeable}
    </p>
  );
};

const PLAY_BUTTON =
  'w-full min-h-[44px] py-3 px-4 bg-accent text-white text-base font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform font-body';

/** Play a past day, play today's daily, or say when today can be replayed. */
const DayAction: React.FC<{
  cell: HeatCell;
  allEvents: HistoricalEvent[];
  today: string;
  onPlay: (config: GameConfig) => void;
}> = ({ cell: { date, played }, allEvents, today, onPlay }) => {
  if (isReplayableDay(date, today)) {
    return (
      <button
        type="button"
        className={PLAY_BUTTON}
        onClick={() => onPlay(buildDayReplayConfig(date, allEvents))}
      >
        <Play className="h-4 w-4" />
        {played ? 'Replay' : 'Play this day'}
      </button>
    );
  }
  if (date !== today) return null;
  if (played) return <p className="font-body text-xs text-text-muted">Replay from tomorrow</p>;
  return (
    <button type="button" className={PLAY_BUTTON} onClick={() => onPlay(buildDailyConfig())}>
      <Play className="h-4 w-4" />
      Play today's challenge
    </button>
  );
};

export default ArchiveDayCard;
