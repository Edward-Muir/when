import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate, useIsPresent } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Player, WhenGameState } from '../../types';
import { DailyResult } from '../../utils/playerStorage';
import { DailyLeaderboard } from '../../hooks/useDailyLeaderboard';
import { useGalleryTravel } from '../../hooks/useGalleryTravel';
import { buildTimelineRows } from '../../utils/timelineRows';
import { galleryColumns, GalleryFit } from '../../utils/galleryLayout';
import { formatTimelineSpan, getTimelineSpan } from '../../utils/timelineSpan';
import { GAME_OVER_TITLE, getGameOverEyebrow, getGameOverTitle } from '../../utils/gameOverCopy';
import { getThemeOutcome } from '../../utils/themeOutcome';
import { getCuratedThemeIdForConfig } from '../../utils/themeReplay';
import { getImageUrl } from '../../utils/cloudinaryImage';
import { formatEventYear } from '../../utils/gameLogic';
import CategoryIcon from '../CategoryIcon';
import LeaderboardSubmit from '../LeaderboardSubmit';
import { ModalDismissMode } from '../ui/Modal';
import ContinueButton from '../ui/ContinueButton';
import GalleryFlight, { GalleryTile } from './GalleryFlight';

/** The id `GamePopup` hands to `Modal` as `labelledBy`, so the dialog is named by its title. */
export const GAME_OVER_TITLE_ID = 'game-over-title';

interface GameOverGalleryProps {
  gameState: WhenGameState;
  /** The completed daily, or null when this game has no leaderboard. */
  dailyResult?: DailyResult | null;
  leaderboard?: DailyLeaderboard;
  /** How the popup may be left, decided by `GamePopup`. Continue shows unless it is locked. */
  dismiss: ModalDismissMode;
  /** Continue: leave the popup, as a tap on it (or beside it) does. */
  onDismiss?: () => void;
  /**
   * Told true once the popup's own surface should show: partway through the flight, or at
   * once when there is none. Until then `GamePopup` keeps the card bare, so the paintings
   * cross the scrim and the popup forms under them.
   */
  onSurfaceChange?: (visible: boolean) => void;
}

/**
 * The timeline as tiles, in the board's own order.
 *
 * `buildTimelineRows` is what the board renders from, so a tombstone sits here exactly where
 * it sits there: at its true place among the placed cards. Tombstones are never counted; the
 * score comes from `placementHistory`.
 */
function buildTiles(state: WhenGameState): GalleryTile[] {
  // `?? []` because a partial state is legitimately handed to game-over code by tests and by
  // a game that ended before it was dealt (the same allowance `getThemeOutcome` makes).
  return buildTimelineRows(state.timeline ?? [], state.failedPlacements ?? []).map((row) => {
    if (row.kind === 'tombstone') return { event: row.failed.event, kind: 'missed' };
    return { event: row.event, kind: row.event.name === state.seedEventName ? 'seed' : 'placed' };
  });
}

const TileArt: React.FC<{ tile: GalleryTile }> = ({ tile }) => {
  const [failed, setFailed] = useState(false);
  // The `thumbnail` rung, already in the browser's cache from the board. Never `detail`, and
  // never a new size: see docs/cloudinary-cost-controls.md.
  const src = getImageUrl(tile.event.image_url, 'thumbnail');
  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <CategoryIcon category={tile.event.category} className="text-text-muted w-6 h-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      data-testid="gallery-art"
      decoding="async"
      onError={() => setFailed(true)}
      className={`absolute inset-0 w-full h-full object-cover ${
        tile.kind === 'missed' ? 'grayscale opacity-60' : ''
      }`}
    />
  );
};

function tileLabel(tile: GalleryTile): string {
  const base = `${tile.event.friendly_name}, ${formatEventYear(tile.event)}`;
  if (tile.kind === 'missed') return `${base}, missed`;
  return tile.kind === 'seed' ? `${base}, starting card` : base;
}

/**
 * How tall the Daily's popup is under the grid, with the leaderboard preview and the submit
 * form: the caption, three rows, the portrait and name, the button. Measured at 375 and 402
 * wide; it does not change with the width. It is the estimate the grid is laid out from while
 * the cards are in flight, since a grid that changed shape under them would land them wrong.
 */
const DAILY_BODY_PX = 384;

/** The card's border and the grid's padding, outside the caption but inside the 90% cap. */
const DAILY_FRAME_PX = 8;

/**
 * The room the grid has on the Daily, where the way on has to stay on screen: Submit to
 * Leaderboard first, then Continue. The popup is `Modal`'s `wide` size, capped at 90% of the
 * height. `bodyPx` is what sits under the grid.
 */
function dailyFit(bodyPx: number): GalleryFit | undefined {
  if (typeof window === 'undefined') return undefined;
  return {
    cardWidth: Math.min(400, window.innerWidth * 0.9),
    maxGridHeight: window.innerHeight * 0.9 - bodyPx,
  };
}

/**
 * How tall the caption under the grid really is, once the cards have landed; `DAILY_BODY_PX`
 * until then. After Submit the form becomes the player's row, the percentile and the player
 * count, and Continue appears: about 70px more. Read once at open, the grid kept its size, the
 * card hit its 90% cap and Continue scrolled out of sight on a 375x667 phone. Never smaller than
 * the estimate, so the grid does not grow back and forth while the board loads.
 */
function useDailyBodyHeight(
  captionRef: React.RefObject<HTMLDivElement | null>,
  active: boolean
): number {
  const [measured, setMeasured] = useState(0);
  useLayoutEffect(() => {
    const node = captionRef.current;
    if (!active || !node || typeof ResizeObserver === 'undefined') return;
    const read = () => setMeasured(node.offsetHeight);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [captionRef, active]);
  return Math.max(DAILY_BODY_PX, measured + DAILY_FRAME_PX);
}

/**
 * The grid's column count: square, or on the Daily as square as fits above the caption. A hook
 * of its own because the gallery sits on ESLint's complexity ceiling.
 */
function useGalleryColumns(
  count: number,
  hasBoard: boolean,
  captionRef: React.RefObject<HTMLDivElement | null>,
  landed: boolean
): number {
  const bodyPx = useDailyBodyHeight(captionRef, hasBoard && landed);
  return useMemo(
    () => galleryColumns(count, hasBoard ? dailyFit(bodyPx) : undefined),
    [count, hasBoard, bodyPx]
  );
}

/** Counts up to `target` once `run` turns true; shows `target` until then. */
function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!run) return;
    const controls = animate(0, target, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [run, target]);
  return value;
}

const playerStats = (player: Player) => ({
  correct: player.placementHistory.filter(Boolean).length,
  total: player.placementHistory.length,
});

/** Multiplayer: one row per player, the winners marked. */
const PlayerResults: React.FC<{ players: Player[]; winners: Player[] }> = ({
  players,
  winners,
}) => (
  <div className="space-y-2 mt-3">
    {players.map((player) => {
      const stats = playerStats(player);
      const isWinner = winners.some((winner) => winner.id === player.id);
      return (
        <div
          key={player.id}
          className={`flex items-center justify-between px-3 py-2 rounded-lg ${
            isWinner ? 'bg-player-row' : 'bg-bg'
          }`}
        >
          <span className="font-body text-text">
            {player.name}
            {isWinner && <Trophy className="inline-block w-4 h-4 ml-1 text-accent" />}
          </span>
          <span className="font-mono text-text">
            {stats.correct}/{stats.total}
          </span>
        </div>
      );
    })}
  </div>
);

/** The single-player score: the count in the display serif, with the deck size on a theme. */
const Score: React.FC<{ gameState: WhenGameState; countUp: boolean }> = ({
  gameState,
  countUp,
}) => {
  const placed = playerStats(gameState.players[0]).correct;
  const shown = useCountUp(placed, countUp);
  // Every card of a curated deck is either placed, missed or still undealt, and the hand is
  // empty at game over, so this is how many there were to place. The Archive shows the same
  // figure as "High score: N/M".
  const deckSize = getCuratedThemeIdForConfig(gameState.lastConfig)
    ? (gameState.placementHistory?.length ?? 0) + (gameState.deck?.length ?? 0)
    : 0;
  const unit = `${placed === 1 ? 'event' : 'events'} placed`;
  return (
    <p className="mt-1 flex items-baseline gap-2.5 font-body">
      <span
        data-testid="gallery-score"
        className="font-display font-bold text-[46px] leading-none text-text lining-nums"
      >
        {shown}
      </span>
      <span className="text-[17px] text-text-muted">
        {deckSize > 0 ? `of ${deckSize} ${unit}` : unit}
      </span>
    </p>
  );
};

/** "Best streak 9 · 120 million years in one timeline", either half dropping out. */
function resultLine(gameState: WhenGameState, isSinglePlayer: boolean): string {
  const span = formatTimelineSpan(getTimelineSpan(gameState.timeline ?? []));
  const parts = [
    isSinglePlayer && gameState.bestStreak >= 2 ? `Best streak ${gameState.bestStreak}` : null,
    span ? `${span} in one timeline` : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

const GameOverGallery: React.FC<GameOverGalleryProps> = ({
  gameState,
  dailyResult,
  leaderboard,
  dismiss,
  onDismiss,
  onSurfaceChange,
}) => {
  const gridRef = useRef<HTMLUListElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const tiles = useMemo(() => buildTiles(gameState), [gameState]);
  const names = useMemo(() => tiles.map((tile) => tile.event.name), [tiles]);
  const hasBoard = !!dailyResult && !!leaderboard;
  const travel = useGalleryTravel(gridRef, names);
  const columns = useGalleryColumns(tiles.length, hasBoard, captionRef, travel.phase === 'landed');
  // False once the popup has begun to close: the clones are outside it and would outlive it.
  const isPresent = useIsPresent();

  const { surface } = travel;
  useLayoutEffect(() => {
    onSurfaceChange?.(surface);
  }, [surface, onSurfaceChange]);
  // Back to the state every game-over popup opens in: no surface until its gallery says so.
  useEffect(() => () => onSurfaceChange?.(false), [onSurfaceChange]);

  const isSinglePlayer = gameState.players.length === 1;
  const title = getGameOverTitle(gameState);
  const line = resultLine(gameState, isSinglePlayer);
  const landed = travel.phase === 'landed';
  const { perfect } = getThemeOutcome(gameState);

  return (
    <div className="font-body">
      <ul
        ref={gridRef}
        data-testid="gallery-grid"
        data-gilt={perfect || undefined}
        aria-label="Your timeline, earliest first"
        className={`grid gap-[2px] p-[3px] m-0 list-none ${perfect ? 'gallery-gilt' : ''}`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile) => (
          <li
            key={tile.event.name}
            data-gallery-tile={tile.kind}
            aria-label={tileLabel(tile)}
            className={`relative aspect-square overflow-hidden rounded-[3px] bg-bg ${
              landed ? '' : 'invisible'
            }`}
          >
            <TileArt tile={tile} />
            {tile.kind === 'seed' && <span aria-hidden className="gallery-pip" />}
          </li>
        ))}
      </ul>

      {travel.phase === 'flying' && isPresent && (
        <GalleryFlight
          tiles={tiles}
          paths={travel.paths}
          progress={travel.progress}
          shiftY={travel.shiftY}
        />
      )}

      <div ref={captionRef} className={`gallery-caption px-4 pt-3 pb-4 ${landed ? 'is-in' : ''}`}>
        <p className="font-mono text-[11px] leading-snug tracking-[0.17em] uppercase text-accent">
          {getGameOverEyebrow(gameState)}
        </p>
        {/* Plain "Game Over" names the dialog for a screen reader and is not shown: the
            gallery is the result, and the word reads as failure over a timeline of 28 cards.
            A cleared deck and a multiplayer win are outcomes worth a heading. */}
        <h2
          id={GAME_OVER_TITLE_ID}
          className={
            title === GAME_OVER_TITLE
              ? 'sr-only'
              : 'mt-1.5 font-display font-bold text-[25px] leading-tight text-text'
          }
        >
          {title}
        </h2>

        {isSinglePlayer && <Score gameState={gameState} countUp={landed && travel.flew} />}
        {line && <p className="mt-0.5 text-[13px] text-text-muted">{line}</p>}
        {!isSinglePlayer && (
          <PlayerResults players={gameState.players} winners={gameState.winners} />
        )}

        {/* Today's board and the form to claim a place on it, exactly as before. */}
        {hasBoard && <LeaderboardSubmit leaderboard={leaderboard} />}

        {/* No share here: this is the first screen of the end-of-game sequence, and the share
            is its last (`useEndOfGameSequence`, `ShareStepPopup`). */}
        {/* Hidden while Submit is pending: that is the way on. With the board unreachable
            (`backdrop`) it is the way past the form, which still takes a retry. */}
        {dismiss !== 'locked' && onDismiss && (
          <ContinueButton onClick={onDismiss} className="mt-4" />
        )}
      </div>
    </div>
  );
};

export default GameOverGallery;
