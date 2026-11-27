import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { HistoricalEvent, Player } from '../types';
import { getImageUrl } from '../utils/cloudinaryImage';
import { Users, Ruler, Zap } from 'lucide-react';
import { getStreakFeedback } from '../utils/streakFeedback';
import { GameHintKey } from '../utils/playerStorage';

// Widest hand the picture distinguishes. A bigger hand reuses the five-card fan; the
// number overlaid on top still shows the true count.
const MAX_FANNED_CARDS = 5;

// Step per card away from the centre of the fan. The 24x24 viewBox is the constraint: at
// five cards the outer card sits two steps out and two steps of rotation over, so its
// half-extent is 2 * 1.5 + 6 * cos(16deg) + 8 * sin(16deg) + 0.75 (half the stroke) =
// 11.7, inside the 12 available. Widening either step means redoing that sum, or the
// outer card is silently clipped by the viewBox edge.
const FAN_X_STEP = 1.5;
const FAN_ANGLE_STEP = 8;

/**
 * The fanned card rects, one per card in hand, so the picture agrees with the number it
 * sits behind. Renders into a caller-supplied 24x24 <svg>.
 */
const HandCardFan: React.FC<{ count: number }> = ({ count }) => {
  // An empty hand draws nothing — a card here would claim the player still holds one.
  // Both callers switch the number to a colour that reads without a card behind it.
  const cards = Math.min(Math.max(count, 0), MAX_FANNED_CARDS);

  return (
    <>
      {Array.from({ length: cards }, (_, i) => {
        const offset = i - (cards - 1) / 2;
        const x = 6 + FAN_X_STEP * offset;

        return (
          <rect
            key={i}
            data-testid="hand-card"
            x={x}
            y="4"
            width="12"
            height="16"
            rx="1.5"
            transform={`rotate(${FAN_ANGLE_STEP * offset} ${x + 6} 12)`}
            className="fill-current"
            // Back to front, 0.4 -> 0.8. An attribute rather than Tailwind's `opacity-NN`
            // because the value is computed, and Tailwind cannot generate a class from an
            // interpolated string — it would emit no rule at all.
            opacity={cards === 1 ? 0.8 : 0.4 + (0.4 * i) / (cards - 1)}
          />
        );
      })}
    </>
  );
};

// Custom hand of cards icon with count overlay
const HandCardsIcon: React.FC<{ count: number; className?: string; isCurrent?: boolean }> = ({
  count,
  className = '',
  isCurrent = false,
}) => (
  <div className={`relative ${className}`}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <HandCardFan count={count} />
    </svg>
    {/* Count overlay - contrasting color. Both overrides are picked to read against a
        card, so with an empty fan the number inherits the row's own colour instead. */}
    <span
      className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
        count === 0 ? '' : isCurrent ? 'text-accent-secondary' : 'text-bg'
      }`}
    >
      {count}
    </span>
  </div>
);

interface PlayerInfoProps {
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  roundNumber: number;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ players, currentPlayerIndex }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {players.map((player, index) => {
        const isCurrent = index === currentPlayerIndex;
        const isEliminated = player.isEliminated;
        const hasWon = player.hasWon;

        return (
          <div
            key={player.id}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 font-body
              ${
                isCurrent
                  ? 'bg-accent-secondary text-white shadow-sm'
                  : isEliminated
                    ? 'bg-error/20 text-error line-through opacity-60'
                    : hasWon
                      ? 'bg-success/20 text-success'
                      : 'bg-border text-text-muted'
              }
            `}
          >
            <Users className="w-3 h-3" />
            <span className="font-medium flex-1">{player.name}</span>
            {hasWon ? (
              <span className="text-sm">🏆</span>
            ) : (
              <HandCardsIcon count={player.hand.length} isCurrent={isCurrent} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * The streak, beside the timeline counter. Absent at zero: a fresh game, or one just after a
 * miss, has no streak to show, and the bar is quieter without a "0". It pops in with the first
 * correct placement, which is the keyed remount below doing what it does on every change.
 */
const StreakBolt: React.FC<{ streak: number }> = ({ streak }) => {
  const config = getStreakFeedback(streak);
  if (streak <= 0) return null;

  return (
    <div
      data-testid="streak-counter"
      className={`flex items-center gap-1 ${config.boltColorClass}`}
    >
      <motion.div
        key={streak}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={`flex items-center gap-0.5 ${config.boltAnimationClass}`}
      >
        <Zap className={`w-4 h-4 ${config.boltFilled ? 'fill-current' : ''}`} />
        <span className="font-mono text-sm font-bold">{streak}</span>
      </motion.div>
    </div>
  );
};

/** The deck's count stops here: an ordinary day's deck is thousands of cards deep. */
export const DECK_COUNT_CAP = 30;

/** What the pile says: the true count up to the cap, then "30+". */
export function deckCountLabel(count: number): string {
  return count > DECK_COUNT_CAP ? `${DECK_COUNT_CAP}+` : String(Math.max(0, count));
}

function deckAriaLabel(count: number): string {
  if (count <= 0) return 'The deck is empty';
  if (count > DECK_COUNT_CAP) return `More than ${DECK_COUNT_CAP} cards in the deck`;
  return count === 1 ? '1 card in the deck' : `${count} cards in the deck`;
}

/** How many of the deck's next cards show their art in the pile. */
const PILE_ART_CARDS = 3;
/** A pile card's side, and how far each card under the top one peeks out, down and left. */
const PILE_CARD_PX = 40;
const PILE_STEP_PX = 3;
/** The pile's box: the top card plus the two steps the deepest card sits out by. */
const PILE_PX = PILE_CARD_PX + (PILE_ART_CARDS - 1) * PILE_STEP_PX;

/**
 * One card of the pile: its painting, or a blank tile if it has none or it fails to load.
 * The `thumbnail` rung, the same URL the hand and the board ask for, and one
 * `useImagePrefetch` has already warmed for the next five deck cards, so the pile costs no
 * request of its own. Never add a rung for it (docs/cloudinary-cost-controls.md).
 */
const PileArt: React.FC<{ event: HistoricalEvent; depth: number }> = ({ event, depth }) => {
  const [failed, setFailed] = useState(false);
  const src = failed ? undefined : getImageUrl(event.image_url, 'thumbnail');
  return (
    <div
      data-testid="deck-card"
      className="absolute overflow-hidden rounded-[5px] border border-border bg-surface"
      // The top card sits at the pile's top right, under the count; each card below it steps
      // down and to the left, and is dimmer, never more transparent, as the hand's fan is.
      style={{
        width: PILE_CARD_PX,
        height: PILE_CARD_PX,
        top: depth * PILE_STEP_PX,
        left: (PILE_ART_CARDS - 1 - depth) * PILE_STEP_PX,
        zIndex: PILE_ART_CARDS - depth,
        filter: depth ? `brightness(${1 - depth * 0.2})` : undefined,
      }}
    >
      {src && (
        <img
          src={src}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
};

/**
 * The deck: the paintings of its next few cards, stacked, with the cards left to draw on a
 * badge at its top right corner, clear of the art. It is where a drawn card comes from
 * (`ActiveCardDisplay` finds the top card by its test id and deals from its centre). Real art
 * rather than a card back, at the maintainer's request: at this size nobody can read a card
 * from it, and it makes plain what the pile is. It dips as a card leaves; transform only,
 * like `StreakBolt`. Not a button: the counter above opens the stats. `GameInfoCompact`
 * captions it "deck".
 *
 * The top painting is `deck[0]`. After a miss a catch-up draw can deal a card from further
 * down (`catchUp.ts`), so now and then the card dealt is not the one that was showing. That
 * is accepted; at this size it does not read as anything.
 */
export const DeckPile: React.FC<{ deck: HistoricalEvent[] }> = ({ deck }) => {
  const count = deck.length;
  const reduceMotion = useReducedMotion();
  const dip = useAnimationControls();
  const previous = useRef<number | null>(null);
  useEffect(() => {
    const fell = previous.current !== null && count < previous.current;
    previous.current = count;
    if (fell && !reduceMotion) {
      void dip.start({
        scale: [0.86, 1],
        transition: { type: 'spring', stiffness: 400, damping: 15 },
      });
    }
  }, [count, reduceMotion, dip]);
  const empty = count <= 0;

  return (
    <motion.div
      data-testid="deck-pile"
      role="img"
      aria-label={deckAriaLabel(count)}
      animate={dip}
      className="relative"
      style={{ width: PILE_PX, height: PILE_PX }}
    >
      {empty ? (
        <div
          data-testid="deck-outline"
          className="absolute right-0 top-0 rounded-[5px] border-[1.5px] border-dashed border-text-muted opacity-50"
          style={{ width: PILE_CARD_PX, height: PILE_CARD_PX }}
        />
      ) : (
        deck
          .slice(0, PILE_ART_CARDS)
          .map((event, depth) => <PileArt key={event.name} event={event} depth={depth} />)
      )}
      {/* The count, on the pile's top right corner like the pass count on its button, so the
          art under it stays visible, and in the same gold: the app's accent, as the hand icon
          above it is. It was ink at first, which read as plain black and outside the theme. */}
      <span
        className={`absolute -right-2 -top-1.5 z-[4] flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-body text-[10px] font-semibold leading-none ring-2 ring-bg ${
          empty ? 'bg-border text-text-muted' : 'bg-accent text-white'
        }`}
      >
        {deckCountLabel(count)}
      </span>
    </motion.div>
  );
};

// Compact game info for the bottom bar
interface GameInfoCompactProps {
  currentPlayer: Player;
  isMultiplayer: boolean;
  timelineLength: number;
  /** The cards left to draw, next first: the deck pile under the counters shows them. */
  deck: HistoricalEvent[];
  onStatsClick?: () => void;
  currentStreak?: number;
  /** The onboarding hint on screen: `stats` glows the counters. */
  nudge?: GameHintKey | null;
}

/**
 * The hand bar's left panel: the timeline length and the streak on one line, and the deck
 * under them.
 *
 * It used to lead with a fan icon carrying the number of cards in hand and a "cards left"
 * label. The maintainer removed both once the hand card grew: the fanned hand beside this
 * panel already shows the cards, and the panel had become crowded. The number is still in the
 * stats popup these counters open. A hand of more than five (Custom only) therefore shows no
 * count on the bar, since the fan stops at five.
 */
export const GameInfoCompact: React.FC<GameInfoCompactProps> = ({
  currentPlayer,
  isMultiplayer,
  timelineLength,
  deck,
  onStatsClick,
  currentStreak = 0,
  nudge = null,
}) => {
  // `bg-border` is not decoration: the button is transparent, and `animate-hint-glow` is
  // transform and filter only, so without a surface to swell there is nothing to see.
  const nudgeClass = nudge === 'stats' ? 'animate-hint-glow bg-border' : '';

  // Single player: the two counters, as the button that opens the stats. Every `button` is
  // at least 44px tall (index.css), which is what makes one short row a fair touch target.
  // Multiplayer has no counters, only whose turn it is.
  const counters = isMultiplayer ? (
    <span className="text-sm font-medium text-text font-body">{currentPlayer.name}</span>
  ) : (
    <button
      onClick={onStatsClick}
      aria-label={`Game stats: ${timelineLength} in the timeline, streak ${currentStreak}`}
      className={`flex items-center justify-center gap-2.5 px-2 -mx-2 rounded-md text-sm text-text-muted font-body active:bg-border transition-colors cursor-pointer ${nudgeClass}`}
    >
      <span data-testid="timeline-counter" className="flex items-center gap-1">
        <Ruler className="w-4 h-4" />
        <span className="font-mono">{timelineLength}</span>
      </span>
      <StreakBolt streak={currentStreak} />
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {counters}
      {/* The pile and its name. The caption is outside the pile so it neither dips with it
          nor moves the point a card is dealt from, and it is hidden from a screen reader,
          which has the pile's own label. */}
      <div className="flex flex-col items-center gap-0.5">
        <DeckPile deck={deck} />
        <span aria-hidden className="text-sm text-text font-body">
          deck
        </span>
      </div>
    </div>
  );
};

export default PlayerInfo;
