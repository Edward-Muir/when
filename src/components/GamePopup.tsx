import React from 'react';
import { Check, Trophy, X } from 'lucide-react';
import { HistoricalEvent, Player, GamePopupType, WhenGameState } from '../types';
import { formatEventYear } from '../utils/gameLogic';
import { DailyResult } from '../utils/playerStorage';
import { DailyLeaderboard } from '../hooks/useDailyLeaderboard';
import CategoryIcon from './CategoryIcon';
import LeaderboardSubmit from './LeaderboardSubmit';
import Modal, { ModalDismissMode } from './ui/Modal';
import { getEventColorStyle, getEventTextClass } from '../utils/eventColor';
import { getThemeOutcome } from '../utils/themeOutcome';
import { getImageUrl } from '../utils/cloudinaryImage';
import ReportIssueButton from './ReportIssueButton';
import { useEventDetail } from '../hooks/useEventDetail';
import EventDetailText from './EventDetailText';

interface GamePopupProps {
  type: GamePopupType;
  event: HistoricalEvent | null;
  onDismiss: () => void;
  nextPlayer?: Player;
  showYear?: boolean;
  gameState?: WhenGameState;
  /** A `correct` popup that was carried by an event's date range, so the banner softens. */
  closeEnough?: boolean;
  // Tombstoned (failed) event: greyscale image, muted text, surface background —
  // matches the tombstone card treatment on the timeline
  tombstone?: boolean;
  /** The completed daily, or null when this game has no leaderboard. Built by `Game`. */
  dailyResult?: DailyResult | null;
  /** Owned by `Game` so the rank it resolves is read directly by the share step. */
  leaderboard?: DailyLeaderboard;
}

/**
 * Whether this popup shows the long-form prose instead of the card's short description. All three
 * conditions matter, and the middle one is the spoiler gate:
 *
 * - `description`: correct/incorrect reveals are a beat in the game loop, not a reading surface.
 * - `showYear`: false exactly when the card is still in the player's hand. The prose is written
 *   post-placement and names dates freely, so showing it there would hand over the answer.
 *   See docs/event-detail/index.md.
 * - `has_detail`: set only where prose actually exists. Where it is not, the description is what
 *   renders — which is what lets the feature ship against a partly written corpus.
 */
function showsProseFor(type: GamePopupType, showYear: boolean, event: HistoricalEvent | null) {
  return type === 'description' && showYear && !!event?.has_detail;
}

// Sub-component for result banner (full-width colored banner at top).
//
// Three states, not two: a placement carried by an event's date range is still a hit, so it
// keeps the tick, but takes the secondary accent and its own word. Multiplayer only — single
// player gets the tombstone reveal and the hint strip instead of a blocking popup.
function bannerTone(isCorrect: boolean, closeEnough: boolean): { bg: string; label: string } {
  if (!isCorrect) return { bg: 'bg-error', label: 'Wrong!' };
  if (closeEnough) return { bg: 'bg-accent-secondary', label: 'Close enough!' };
  return { bg: 'bg-success', label: 'Correct!' };
}

function ResultBanner({ isCorrect, closeEnough }: { isCorrect: boolean; closeEnough?: boolean }) {
  const { bg, label } = bannerTone(isCorrect, closeEnough === true);
  return (
    <div className={`px-4 py-2 flex items-center gap-2 ${bg}`}>
      <div className="w-5 h-5 flex items-center justify-center">
        {isCorrect ? (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        )}
      </div>
      <span className="font-semibold text-lg text-white leading-none">{label}</span>
    </div>
  );
}

/** Header ✕. Flat and tinted like the card's own text, so it reads as part of the card. */
function CloseButton({
  event,
  tombstone,
  onClick,
}: {
  event: HistoricalEvent;
  tombstone?: boolean;
  onClick: () => void;
}) {
  const textClass = tombstone ? 'text-text-muted' : getEventTextClass(event);
  return (
    <button
      type="button"
      aria-label="Close"
      // Card taps advance past a description popup, so this has to stop there or the dismissal
      // happens twice over.
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`shrink-0 -my-1 w-11 h-11 flex items-center justify-center rounded-xl opacity-60 hover:opacity-100 active:scale-95 transition-all ${textClass}`}
    >
      <X className="w-5 h-5" />
    </button>
  );
}

// Sub-component for event header (title + year)
function EventHeader({
  event,
  showYear,
  isIncorrect,
  tombstone,
  trailing,
}: {
  event: HistoricalEvent;
  showYear: boolean;
  isIncorrect?: boolean;
  tombstone?: boolean;
  /** The read-more control, rendered right of the title. */
  trailing?: React.ReactNode;
}) {
  const textClass = tombstone ? 'text-text-muted' : getEventTextClass(event);
  return (
    <div className="px-4 py-3 flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <h2 className={`text-lg font-display font-semibold leading-tight ${textClass}`}>
          {event.friendly_name}
        </h2>
        {showYear && (
          <span
            className={`text-2xl font-bold font-mono mt-1 block ${isIncorrect ? 'text-error' : `${textClass} opacity-100`}`}
          >
            {formatEventYear(event)}
          </span>
        )}
      </div>
      {trailing}
    </div>
  );
}

// Image box, in CSS px. Fixed rather than derived from `image_width`/`image_height`:
// those fields are stale Wikipedia thumbnail dimensions (330x440 on every playable event)
// while the real Cloudinary sources are square, so the old aspect-ratio maths always
// clamped to this maximum anyway — keeping it a constant is pixel-identical to what
// shipped before. The square `detail` image is cropped to fit by `object-cover`.
const IMAGE_CONTAINER_HEIGHT = 384;

// How much of the prose sits below the image before the reader scrolls, in CSS px. A constant
// rather than a measurement: the region only ever holds the long-form read, which always overflows
// it, so there is no text for a measured height to fit. Three lines plus the box's padding.
const DETAIL_TEXT_HEIGHT = 92;

// Sub-component for image section (clean, no overlay)
function EventImage({ event, tombstone }: { event: HistoricalEvent; tombstone?: boolean }) {
  // The card the user just tapped already has its thumbnail cached, so painting it as the
  // backdrop makes the popup feel instant while the larger detail image decodes over it.
  // Replaces a per-card eager detail preload that fetched full-size art for every card
  // rendered, opened or not. Same placeholder trick as AchievementCard.
  const placeholderSrc = getImageUrl(event.image_url, 'thumbnail');

  return (
    <div className="relative overflow-hidden" style={{ height: `${IMAGE_CONTAINER_HEIGHT}px` }}>
      {event.image_url ? (
        <img
          src={getImageUrl(event.image_url, 'detail')}
          alt=""
          decoding="async"
          className={`w-full h-full object-cover ${tombstone ? 'grayscale opacity-70' : ''}`}
          style={
            placeholderSrc
              ? {
                  backgroundImage: `url(${placeholderSrc})`,
                  backgroundSize: 'cover',
                  // Must match the <img>'s object-position, which defaults to 50% 50%.
                  // background-position defaults to 0% 0% instead, so without this the
                  // placeholder sits left/top-anchored and the picture visibly jumps
                  // when the detail image loads over it.
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-border/30">
          <CategoryIcon category={event.category} className="text-text-muted w-16 h-16" />
        </div>
      )}
    </div>
  );
}

// Sub-component for game over header
function GameOverHeader({ gameState }: { gameState: WhenGameState }) {
  const { winners, players } = gameState;
  const hasWinner = winners.length > 0;
  const isSinglePlayer = players.length === 1;
  const { survived, perfect } = getThemeOutcome(gameState);

  const getWinnerText = () => {
    if (isSinglePlayer) {
      // Reaching the end of the deck is its own outcome, and on a curated theme it is the
      // good one — "Game Over" reads as failure for a player who just got through the lot.
      if (perfect) return 'Perfect Clear!';
      if (survived) return 'Theme Cleared!';
      return hasWinner ? 'You Won!' : 'Game Over';
    }
    if (!hasWinner) {
      return 'Game Over';
    }
    if (winners.length === 1) {
      return `${winners[0].name} Wins!`;
    }
    const names = winners.map((w) => w.name);
    const lastWinner = names.pop();
    return `${names.join(', ')} & ${lastWinner} Win!`;
  };

  return (
    <div className="px-4 py-3 border-b border-border">
      <h2 className="text-lg font-display font-semibold text-text">{getWinnerText()}</h2>
    </div>
  );
}

// Sub-component for game over content (stats only, header moved out)
function GameOverContent({
  gameState,
  dailyResult,
  leaderboard,
}: {
  gameState: WhenGameState;
  dailyResult?: DailyResult | null;
  leaderboard?: DailyLeaderboard;
}) {
  const { winners, players, bestStreak } = gameState;
  const hasWinner = winners.length > 0;
  const isSinglePlayer = players.length === 1;

  const getPlayerStats = (player: Player) => {
    const correct = player.placementHistory.filter((p) => p).length;
    const total = player.placementHistory.length;
    return { correct, total };
  };

  const getEncouragingMessage = (eventsPlaced: number): string | null => {
    if (eventsPlaced >= 12) return 'Legendary!';
    if (eventsPlaced >= 8) return 'History buff!';
    if (eventsPlaced >= 5) return 'Impressive!';
    if (eventsPlaced >= 3) return 'Good start!';
    return null;
  };

  return (
    <div className="px-4 py-4">
      {/* Trophy icon */}
      <div className="flex justify-center mb-4">
        <Trophy className={`w-10 h-10 ${hasWinner ? 'text-accent' : 'text-text-muted'}`} />
      </div>

      {/* Stats section */}
      <div className="space-y-3">
        {isSinglePlayer ? (
          <div className="text-center">
            <p className="text-text font-body">
              <span className="text-2xl font-bold font-mono">
                {getPlayerStats(players[0]).correct}
              </span>
              <span className="text-text-muted">
                {' '}
                {getPlayerStats(players[0]).correct === 1 ? 'event' : 'events'} placed
              </span>
            </p>
            {bestStreak >= 2 && (
              <p className="text-text-muted text-sm mt-1 font-body">Best streak: {bestStreak}x</p>
            )}
            {getEncouragingMessage(getPlayerStats(players[0]).correct) && (
              <p className="text-accent font-medium mt-2">
                {getEncouragingMessage(getPlayerStats(players[0]).correct)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => {
              const stats = getPlayerStats(player);
              const isWinner = winners.some((w) => w.id === player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    isWinner ? 'bg-accent/20' : 'bg-bg'
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
        )}
      </div>

      {/* Leaderboard submit section for daily mode */}
      {dailyResult && leaderboard && <LeaderboardSubmit leaderboard={leaderboard} />}

      {/* No share here, and no "come back tomorrow" either. This popup is the *first* screen
          of the end-of-game sequence (see `useEndOfGameSequence`); both belong on the last
          one, `ShareStepPopup`, which is where the player has seen their milestones and
          badges and is actually finished. */}
    </div>
  );
}

/**
 * How the game-over popup may be left. Derived, never tracked — the flag this replaces was kept
 * in sync by a callback, and when it disagreed with the leaderboard the popup became impossible
 * to dismiss.
 *
 * Extracted rather than inlined because `GamePopup` sits on ESLint's complexity ceiling of 15.
 */
function gameOverDismiss(showsSubmitForm: boolean, canSubmit: boolean): ModalDismissMode {
  // Submit is still pending and still possible: hold the player here.
  if (showsSubmitForm && canSubmit) return 'locked';
  // The form is up but the board is unreachable. Card taps stay inert so Submit can be retried,
  // while the backdrop and ESC let the player leave rather than losing the rest of the sequence.
  if (showsSubmitForm) return 'backdrop';
  // Nothing to submit, so tap anywhere — like the reveal popups that follow.
  return 'tap-advance';
}

// Sub-component for event popup content (description, correct, incorrect)
function EventPopupContent({
  type,
  event,
  showYear,
  nextPlayer,
  tombstone,
  showsProse,
  detail,
  onDismiss,
  closeEnough,
}: {
  type: GamePopupType;
  event: HistoricalEvent;
  showYear: boolean;
  nextPlayer?: Player;
  closeEnough?: boolean;
  tombstone?: boolean;
  showsProse: boolean;
  detail: ReturnType<typeof useEventDetail>;
  onDismiss: () => void;
}) {
  const isCorrect = type === 'correct';
  const isIncorrect = type === 'incorrect';
  const isDescription = type === 'description';

  return (
    <>
      {(isCorrect || isIncorrect) && (
        <ResultBanner isCorrect={isCorrect} closeEnough={closeEnough} />
      )}
      <EventHeader
        event={event}
        showYear={showYear}
        isIncorrect={isIncorrect}
        tombstone={tombstone}
        trailing={
          isDescription ? (
            <CloseButton event={event} tombstone={tombstone} onClick={onDismiss} />
          ) : undefined
        }
      />

      {/* Showing the prose, this is a fixed box the image sits at the top of: scroll and the image
          leaves, and the rest of the region is the read. Showing the description it is the plain
          run of content it has always been, tall enough for its own text and not scrollable.

          The scroller carries `overflow` and nothing else — no mask, no filter, nothing that
          promotes it to its own compositing layer. A `mask-image` here left the image painting at
          its unscrolled position on iOS Safari, on neither Chromium nor Linux WebKit, so anything
          decorative goes on the sibling below instead. */}
      <div className="relative">
        <div
          data-testid="detail-scroll"
          className={showsProse ? 'overflow-y-auto overscroll-contain' : undefined}
          style={showsProse ? { height: IMAGE_CONTAINER_HEIGHT + DETAIL_TEXT_HEIGHT } : undefined}
        >
          <EventImage event={event} tombstone={tombstone} />
          {showsProse ? (
            <EventDetailText event={event} tombstone={tombstone} detail={detail} />
          ) : (
            (isDescription || isIncorrect) && (
              <div className="px-4 py-3">
                <p
                  className={`${tombstone ? 'text-text-muted' : getEventTextClass(event)} text-sm leading-relaxed font-body`}
                >
                  {event.description}
                </p>
              </div>
            )
          )}
        </div>
        {showsProse && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3"
            // The card's own colour, which only this call site knows: it is per-event and inline.
            style={{
              backgroundImage: `linear-gradient(to top, ${(!tombstone && event.color) || 'var(--color-surface)'}, transparent)`,
            }}
          />
        )}
      </div>

      {isDescription && <ReportIssueButton event={event} tombstone={tombstone} />}
      {nextPlayer && (
        <div className="px-4 py-4 border-t border-border">
          <p className={`${getEventTextClass(event)} text-xl text-center font-display`}>
            <span className="font-bold">{nextPlayer.name}</span>
            <span className="opacity-70"> is up next</span>
          </p>
        </div>
      )}
    </>
  );
}

const GamePopup: React.FC<GamePopupProps> = ({
  type,
  event,
  onDismiss,
  nextPlayer,
  showYear = true,
  gameState,
  closeEnough,
  tombstone = false,
  dailyResult,
  leaderboard,
}) => {
  const isGameOver = type === 'gameOver';
  const isVisible = isGameOver ? !!gameState : !!event;

  const showsProse = showsProseFor(type, showYear, event);
  // The shard is fetched only where the prose is going to be rendered — never for a card in hand.
  const detail = useEventDetail(event?.name ?? null, showsProse);

  // The submit form is on screen exactly when there is a daily to claim and the player has not
  // claimed it.
  const showsSubmitForm = isGameOver && !!dailyResult && leaderboard?.submitted === false;
  // Tapping the card advances past a popup, which would eat every scroll drag through the prose.
  // The backdrop, ESC and the card's own ✕ still get the player out. `showsProse` is only ever
  // true on a description popup, so this never reaches the game-over sequence.
  const dismiss: ModalDismissMode = showsProse
    ? 'backdrop'
    : gameOverDismiss(showsSubmitForm, leaderboard?.unavailable === false);

  return (
    <Modal
      open={isVisible}
      onDismiss={onDismiss}
      dismiss={dismiss}
      cardStyle={!isGameOver && event && !tombstone ? getEventColorStyle(event) : undefined}
    >
      {isGameOver && gameState ? (
        <>
          <GameOverHeader gameState={gameState} />
          <GameOverContent
            gameState={gameState}
            dailyResult={dailyResult}
            leaderboard={leaderboard}
          />
          {dismiss !== 'locked' && (
            <p className="px-4 pb-4 text-center font-body text-sm text-text-muted">
              {dismiss === 'backdrop' ? 'Tap outside to continue' : 'Tap to continue'}
            </p>
          )}
        </>
      ) : (
        event && (
          <EventPopupContent
            type={type}
            event={event}
            showYear={showYear}
            nextPlayer={nextPlayer}
            tombstone={tombstone}
            showsProse={showsProse}
            detail={detail}
            onDismiss={onDismiss}
            closeEnough={closeEnough}
          />
        )
      )}
    </Modal>
  );
};

export default GamePopup;
