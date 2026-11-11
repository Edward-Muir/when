import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { HistoricalEvent, Player, GamePopupType, WhenGameState } from '../types';
import { formatEventYear } from '../utils/gameLogic';
import { DailyResult } from '../utils/playerStorage';
import { DailyLeaderboard } from '../hooks/useDailyLeaderboard';
import CategoryIcon from './CategoryIcon';
import Modal, { ModalDismissMode, ModalProps } from './ui/Modal';
import { getEventColorStyle, getEventTextClass } from '../utils/eventColor';
import { getImageUrl } from '../utils/cloudinaryImage';
import ReportIssueButton from './ReportIssueButton';
import { useEventDetail } from '../hooks/useEventDetail';
import EventDetailText from './EventDetailText';
import GameOverGallery, { GAME_OVER_TITLE_ID } from './gameOver/GameOverGallery';

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
 *   renders, so an event added without prose still gets a working popup.
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

// Sub-component for event header (title + year)
function EventHeader({
  event,
  showYear,
  isIncorrect,
  tombstone,
}: {
  event: HistoricalEvent;
  showYear: boolean;
  isIncorrect?: boolean;
  tombstone?: boolean;
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

/**
 * The Modal shell of the game-over popup: wide, so the gallery's paintings are as large as the
 * screen allows, and scrollable, because a Daily card with the leaderboard block is taller than
 * a short phone.
 *
 * While the gallery's tiles are still flying in, the card's own surface is held back so they
 * land on the scrim and the popup forms under them. Colours only: the card's opacity is never
 * touched (docs/mobile-ios/index.md), and its `transition-colors` eases the surface in.
 *
 * A function, not inline props, because `GamePopup` sits on the complexity ceiling.
 */
const BARE_CARD: React.CSSProperties = {
  backgroundColor: 'transparent',
  borderColor: 'transparent',
  boxShadow: 'none',
};

function gameOverShell(
  surface: boolean
): Pick<ModalProps, 'size' | 'scroll' | 'labelledBy' | 'cardStyle'> {
  return {
    size: 'wide',
    scroll: 'card',
    labelledBy: GAME_OVER_TITLE_ID,
    cardStyle: surface ? undefined : BARE_CARD,
  };
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

      {isDescription && (
        <ReportIssueButton event={event} tombstone={tombstone} onClose={onDismiss} />
      )}
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

  // Whether the game-over card shows its surface yet. False until the gallery says so, which
  // is at once when nothing travels. See `gameOverShell`.
  const [gallerySurface, setGallerySurface] = useState(false);

  const showsProse = showsProseFor(type, showYear, event);
  // The shard is fetched only where the prose is going to be rendered — never for a card in hand.
  const detail = useEventDetail(event?.name ?? null, showsProse);

  // The submit form is on screen exactly when there is a daily to claim and the player has not
  // claimed it.
  const showsSubmitForm = isGameOver && !!dailyResult && leaderboard?.submitted === false;
  // Tapping the card advances past a popup, which would eat every scroll drag through the prose.
  // The backdrop, ESC and the ✕ beside the report button still get the player out. `showsProse` is only ever
  // true on a description popup, so this never reaches the game-over sequence.
  const dismiss: ModalDismissMode = showsProse
    ? 'backdrop'
    : gameOverDismiss(showsSubmitForm, leaderboard?.unavailable === false);

  // Two modals, both always mounted, each driven by its own `open`. Sharing one would hand the
  // game-over card whatever the last card popup left on it: in multiplayer the final "Wrong!"
  // popup is still closing in that card's colour when the game-over popup opens.
  return (
    <>
      <Modal
        open={!isGameOver && isVisible}
        onDismiss={onDismiss}
        dismiss={dismiss}
        cardStyle={event && !tombstone ? getEventColorStyle(event) : undefined}
      >
        {event && (
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
        )}
      </Modal>
      <Modal
        open={isGameOver && isVisible}
        onDismiss={onDismiss}
        dismiss={dismiss}
        {...gameOverShell(gallerySurface)}
      >
        {gameState && (
          <GameOverGallery
            gameState={gameState}
            dailyResult={dailyResult}
            leaderboard={leaderboard}
            dismiss={dismiss}
            onSurfaceChange={setGallerySurface}
          />
        )}
      </Modal>
    </>
  );
};

export default GamePopup;
