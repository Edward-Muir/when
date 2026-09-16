import React, { useLayoutEffect, useState } from 'react';
import { Check, Trophy, X } from 'lucide-react';
import { HistoricalEvent, Player, GamePopupType, WhenGameState } from '../types';
import { formatYear } from '../utils/gameLogic';
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
import { usePinnedFaceHeight } from '../hooks/usePinnedFaceHeight';
import EventDetailText from './EventDetailText';
import { EventInfoButton } from './EventInfoButton';

interface GamePopupProps {
  type: GamePopupType;
  event: HistoricalEvent | null;
  onDismiss: () => void;
  nextPlayer?: Player;
  showYear?: boolean;
  gameState?: WhenGameState;
  // Tombstoned (failed) event: greyscale image, muted text, surface background —
  // matches the tombstone card treatment on the timeline
  tombstone?: boolean;
  /** The completed daily, or null when this game has no leaderboard. Built by `Game`. */
  dailyResult?: DailyResult | null;
  /** Owned by `Game` so the rank it resolves is read directly by the share step. */
  leaderboard?: DailyLeaderboard;
  /** Open showing the long-form prose rather than the short description. The Daily hero's info
      button is a request to read, so it would be a wasted tap to land on the description. */
  openExpanded?: boolean;
}

/**
 * Whether this popup may offer the "read more" info button. All three conditions matter:
 *
 * - `description`: correct/incorrect reveals are a beat in the game loop, not a reading surface.
 * - `showYear`: false exactly when the card is still in the player's hand. The long-form prose
 *   is written post-placement and names dates freely, so showing it there would hand over the
 *   answer. This is the spoiler gate — see docs/event-detail/index.md.
 * - `has_detail`: set only where prose actually exists, so the button never opens nothing.
 */
function canReadMoreAbout(type: GamePopupType, showYear: boolean, event: HistoricalEvent | null) {
  return type === 'description' && showYear && !!event?.has_detail;
}

// Sub-component for result banner (full-width colored banner at top)
function ResultBanner({ isCorrect }: { isCorrect: boolean }) {
  return (
    <div className={`px-4 py-2 flex items-center gap-2 ${isCorrect ? 'bg-success' : 'bg-error'}`}>
      <div className="w-5 h-5 flex items-center justify-center">
        {isCorrect ? (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        )}
      </div>
      <span className="font-semibold text-lg text-white leading-none">
        {isCorrect ? 'Correct!' : 'Wrong!'}
      </span>
    </div>
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
            {formatYear(event.year)}
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
  expanded,
  setExpanded,
  canReadMore,
  detail,
}: {
  type: GamePopupType;
  event: HistoricalEvent;
  showYear: boolean;
  nextPlayer?: Player;
  tombstone?: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  canReadMore: boolean;
  detail: ReturnType<typeof useEventDetail>;
}) {
  const isCorrect = type === 'correct';
  const isIncorrect = type === 'incorrect';
  const isDescription = type === 'description';

  // Swapping the prose in for the description must not resize the card, so everything between the
  // header and the report row is pinned to what it occupied with the description in it, and the
  // image scrolls away with the prose inside that. The ref goes on the description, never on the
  // region that survives the swap: a height taken from the prose is the full unclipped text, and
  // pinning to that grows the card on every open.
  const pinnedText = usePinnedFaceHeight(expanded, [event.name, event.description, showYear]);
  const measured = pinnedText.style?.height;
  // The region holds the image too, so what it pins to is the image box plus that measurement.
  const bodyStyle =
    typeof measured === 'number' ? { height: measured + IMAGE_CONTAINER_HEIGHT } : undefined;

  return (
    <>
      {(isCorrect || isIncorrect) && <ResultBanner isCorrect={isCorrect} />}
      <EventHeader
        event={event}
        showYear={showYear}
        isIncorrect={isIncorrect}
        tombstone={tombstone}
        trailing={
          canReadMore ? (
            <EventInfoButton
              event={event}
              tombstone={tombstone}
              expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            />
          ) : undefined
        }
      />

      {/* Collapsed the scroller has no height and no overflow, so it is exactly as tall as the
          image plus the description and nothing scrolls. Expanded it is the same box around
          several hundred more pixels of prose, so the image scrolls up out of it and the reader
          gets the lot.

          The scroller itself carries nothing but `overflow` — no mask, no filter, nothing that
          would promote it to its own compositing layer. The fade is a sibling drawn over its
          bottom edge instead, because a `mask-image` on the scroller left the image painting at
          its unscrolled position on iOS Safari while the text moved over it. */}
      <div className="relative">
        <div
          data-testid="detail-scroll"
          className={expanded ? 'overflow-y-auto overscroll-contain' : undefined}
          style={bodyStyle}
        >
          <EventImage event={event} tombstone={tombstone} />
          {(isDescription || isIncorrect) &&
            (expanded ? (
              <EventDetailText event={event} tombstone={tombstone} detail={detail} />
            ) : (
              <div ref={pinnedText.ref} className="px-4 py-3">
                <p
                  className={`${tombstone ? 'text-text-muted' : getEventTextClass(event)} text-sm leading-relaxed font-body`}
                >
                  {event.description}
                </p>
              </div>
            ))}
        </div>
        {expanded && (
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
  tombstone = false,
  dailyResult,
  leaderboard,
  openExpanded = false,
}) => {
  const isGameOver = type === 'gameOver';
  const isVisible = isGameOver ? !!gameState : !!event;

  const [expanded, setExpanded] = useState(false);
  // A surface that opened on the prose has nothing to offer a toggle to, so it shows no control.
  const canReadMore = canReadMoreAbout(type, showYear, event) && !openExpanded;
  const detail = useEventDetail(event?.name ?? null, expanded);

  // The popup instance is reused across cards, so the text goes back to the description whenever
  // the event changes — otherwise the next card opens on the previous one's prose. Same reason
  // ReportIssueButton resets on `event.name`.
  //
  // `openExpanded` is expressed through the same reset rather than as a starting state, and in a
  // layout effect, because the box is pinned to the height the *description* measures: the
  // description has to be committed once before anything can be pinned to it. Opening straight on
  // the prose instead leaves nothing measured, and the prose renders at its full unclipped height
  // — a card twice the height of the phone. Rendering it and swapping before paint costs a commit
  // and is invisible.
  useLayoutEffect(() => {
    setExpanded(false);
    if (isVisible && openExpanded) setExpanded(true);
  }, [event?.name, isVisible, openExpanded]);

  // The submit form is on screen exactly when there is a daily to claim and the player has not
  // claimed it.
  const showsSubmitForm = isGameOver && !!dailyResult && leaderboard?.submitted === false;
  // Tapping the card advances past a popup, which would eat every scroll drag through the prose.
  // The backdrop and ESC still get the player out. `expanded` is only ever true on a description
  // popup, so this never reaches the game-over sequence.
  const dismiss: ModalDismissMode = expanded
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
            expanded={expanded}
            setExpanded={setExpanded}
            canReadMore={canReadMore}
            detail={detail}
          />
        )
      )}
    </Modal>
  );
};

export default GamePopup;
