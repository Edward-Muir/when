import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDndContext } from '@dnd-kit/core';
import { RefreshCw, SkipForward } from 'lucide-react';
import { HistoricalEvent, Player } from '../types';
import { GameHintKey } from '../utils/playerStorage';
import { passesLeft } from '../utils/gameLogic';
import { useHaptics } from '../hooks/useHaptics';
import DraggableCard from './DraggableCard';
import Card from './Card';

/** `drag` bobs the top card; `tapCard` glows it. Same wrapper either way. */
function topCardNudgeClass(nudge: GameHintKey | null): string {
  if (nudge === 'drag') return 'animate-hint-lift';
  if (nudge === 'tapCard') return 'animate-hint-glow';
  return '';
}

/**
 * The most cards the hand ever shows at once: the top card and four behind it. A standard
 * hand is five, so the stack is the whole hand and thins by one with each miss. A larger hand
 * shows these five and keeps the rest out of sight until a swap brings them forward, so the
 * fan never grows wider than this.
 */
const MAX_FAN_CARDS = 5;
/** Each card behind the top one sits this much further right, and this much more turned. */
const FAN_STEP_PX = 6;
const FAN_STEP_DEG = 1.25;

/**
 * Where a card `depth` places behind the top card sits. Deeper cards are dimmer, never more
 * transparent: a see-through square shows the title of the card under it through its own.
 */
function fanPose(depth: number) {
  return {
    x: depth * FAN_STEP_PX,
    rotate: depth * FAN_STEP_DEG,
    filter: `brightness(${1 - depth * 0.1})`,
    opacity: 1,
    scale: 1,
    y: 0,
  };
}

/** Where the deck pile is, as a hand card would have to be moved and shrunk to sit on it. */
export interface DeckOrigin {
  x: number;
  y: number;
  scale: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The move from the hand card's resting place to the deck pile: centre to centre, and scaled
 * to the pile's width. Null when either cannot be measured, which sends the draw down the
 * short fallback slide.
 */
export function deckOrigin(pile: Box | null, hand: Box | null): DeckOrigin | null {
  if (!pile || !hand || pile.width <= 0 || hand.width <= 0) return null;
  return {
    x: pile.left + pile.width / 2 - (hand.left + hand.width / 2),
    y: pile.top + pile.height / 2 - (hand.top + hand.height / 2),
    scale: pile.width / hand.width,
  };
}

/**
 * Where a drawn card starts, on its way to `depth` places behind the top card: on the deck
 * pile in the bar's left panel, the pile's size, so it is seen to be dealt from the deck. No
 * fade. The card is opaque from its first frame, which keeps this clear of the framer opacity
 * flicker in the Android WebView (docs/mobile-ios).
 *
 * With no pile to measure it falls back to a short slide from the right of its slot, with a
 * fade, which is what a draw looked like before the deck was on screen.
 */
function arrivalPose(depth: number, origin: DeckOrigin | null) {
  const rest = fanPose(depth);
  if (!origin) {
    return { ...rest, x: rest.x + 34, rotate: rest.rotate + 7, scale: 0.94, opacity: 0 };
  }
  return { ...rest, x: origin.x, y: origin.y, rotate: 0, scale: origin.scale };
}

/** How a drawn card travels from the deck: a soft spring, about a third of a second. */
const ARRIVE = { type: 'spring' as const, stiffness: 260, damping: 28 };

/** The deck pile `GameInfoCompact` renders in the same bar. */
const DECK_PILE_SELECTOR = '[data-testid="deck-pile"]';

/**
 * Keeps the deck pile's position relative to the hand measured, for the next draw to start
 * from. Measured after every commit, so the value a newly drawn card reads at mount is the
 * last commit's; that is always there, because nothing is drawn on a hand's first paint. The
 * pile is in a sibling cell of the bar's grid, so it is found in the document, not by a ref.
 * `offsetWidth`, not the rect's width: the pile dips as a card leaves it, and a rect would
 * measure it mid-dip.
 */
function useDeckOrigin(handRef: React.RefObject<HTMLDivElement | null>) {
  const origin = useRef<DeckOrigin | null>(null);
  useLayoutEffect(() => {
    const hand = handRef.current?.getBoundingClientRect() ?? null;
    const pileEl = document.querySelector<HTMLElement>(DECK_PILE_SELECTOR);
    if (!pileEl || !hand) {
      origin.current = null;
      return;
    }
    const rect = pileEl.getBoundingClientRect();
    const width = pileEl.offsetWidth;
    const height = pileEl.offsetHeight;
    origin.current = deckOrigin(
      {
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.top + rect.height / 2 - height / 2,
        width,
        height,
      },
      hand
    );
  });
  return origin;
}

/** A passed card's way out: a small hop, then off the bottom of the screen, turning. */
const THROW = {
  animate: { x: [0, 30, 90], y: [0, -18, 260], rotate: [0, 6, 28] },
  transition: { duration: 0.42, times: [0, 0.3, 1], ease: 'easeIn' as const },
};

/** Two taps closer together than this spend one pass, not two. */
const PASS_COOLDOWN_MS = 450;

/**
 * The names of the cards that have just been drawn into this hand: in it now, and not in it on
 * the last render. A swap reorders the same cards and a miss only removes one, so neither
 * yields any; the first paint, a resumed daily and a multiplayer hand-off have no previous
 * hand for this player to compare with, so they yield none either.
 */
function useDrawnCards(player: Player): ReadonlySet<string> {
  const previous = useRef<{ id: number; names: Set<string> } | null>(null);
  const names = player.hand.map((event) => event.name);
  const before = previous.current;
  const drawn =
    before && before.id === player.id
      ? new Set(names.filter((name) => !before.names.has(name)))
      : new Set<string>();
  const key = `${player.id}:${names.join('|')}`;
  useEffect(() => {
    previous.current = { id: player.id, names: new Set(names) };
    // `key` is the hand's identity; `names` is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return drawn;
}

/** The shared look of the two round buttons beside the hand. */
function handButtonClass(nudged: boolean): string {
  // The darker fill is for a press, and for a pointer that can hover. A bare `hover:` sticks
  // on a touch screen: the tap leaves `:hover` set until something else is touched, and the
  // button looks held down for good. Nudged, it is filled gold and glows with the same
  // animation as the Daily Play button (swell + brightness, never opacity), so the strip has
  // something to point at.
  const fill = nudged
    ? 'animate-hint-glow bg-accent border-accent'
    : 'bg-surface border-border active:bg-border [@media(hover:hover)]:hover:bg-border';
  return `w-11 h-11 min-w-11 min-h-11 shrink-0 rounded-full
    border shadow-sm flex items-center justify-center
    disabled:opacity-40 disabled:cursor-not-allowed
    active:scale-[0.92] active:shadow-none
    transition-[transform,background-color,box-shadow] duration-100 ${fill}`;
}

/**
 * The passes left, on the corner of the Pass button. It pops when a pass is earned, which is
 * the only announcement an earned pass gets. Transform only, like `StreakBolt`.
 */
const PassBadge: React.FC<{ count: number; still: boolean }> = ({ count, still }) => {
  const previous = useRef<number | null>(null);
  const grew = previous.current !== null && count > previous.current;
  useEffect(() => {
    previous.current = count;
  }, [count]);
  const tone = count > 0 ? 'bg-accent text-white' : 'bg-border text-text-muted';
  return (
    <motion.span
      key={count}
      data-testid="pass-count"
      aria-hidden
      initial={grew && !still ? { scale: 1.6 } : false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`pointer-events-none absolute -top-1 right-0 flex h-4 min-w-4 items-center
        justify-center rounded-full px-1 font-body text-[10px] font-semibold leading-none
        ring-2 ring-bg ${tone}`}
    >
      {count}
    </motion.span>
  );
};

/** A swap, as the cards show it: each steps forward a place, in about this long. */
const SHUFFLE = { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] };
const STILL = { duration: 0 };

interface ActiveCardDisplayProps {
  activeCard: HistoricalEvent;
  currentPlayer: Player;
  isAnimating: boolean;
  onCycleHand: () => void;
  /** Spend a pass: the engine discards the active card and draws another, or refuses. */
  onPass: () => void;
  /** Cards left to draw. A pass needs one. */
  deckLength: number;
  onCardTap: () => void;
  /**
   * The onboarding hint on screen: `drag` bobs the top card, `tapCard` glows it, `swap`
   * pulses the cycle button and `pass` the pass button.
   */
  nudge?: GameHintKey | null;
}

const ActiveCardDisplay: React.FC<ActiveCardDisplayProps> = ({
  activeCard,
  currentPlayer,
  isAnimating,
  onCycleHand,
  onPass,
  deckLength,
  onCardTap,
  nudge = null,
}) => {
  // Neither button works while the card is being dragged. The drop places whatever is on top
  // of the hand at that moment, so a second finger on Swap would place a card the player never
  // dragged, and one on Pass would discard the card in their hand.
  const dragActive = useDndContext().active !== null;
  const idle = !isAnimating && !dragActive;
  const canCycle = idle && currentPlayer.hand.length > 1;
  const passes = passesLeft(currentPlayer);
  const canPass = idle && passes > 0 && deckLength > 0;
  const cycleNudge = nudge === 'swap';
  const passNudge = nudge === 'pass';
  const reduceMotion = useReducedMotion();
  const shuffle = reduceMotion ? STILL : SHUFFLE;
  const arrive = reduceMotion ? STILL : ARRIVE;
  const { haptics } = useHaptics();
  const passesId = useId();
  const drawn = useDrawnCards(currentPlayer);
  // The top card's box: the hand's resting place, which the deal from the deck is measured to.
  const topRef = useRef<HTMLDivElement | null>(null);
  const origin = useDeckOrigin(topRef);
  // The card just passed, shown falling away. Presentation only: the engine has already
  // discarded it, in one commit, so the daily save never sees a pass in flight.
  const [thrown, setThrown] = useState<HistoricalEvent | null>(null);
  const lastPass = useRef(0);
  // Half a turn of the arrows per swap, always the same way round.
  const [turns, setTurns] = useState(0);
  // Nothing animates in on the first paint of a hand: the cards are simply there.
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);
  const cycle = () => {
    if (!canCycle) return;
    if (!reduceMotion) setTurns((t) => t + 1);
    onCycleHand();
  };
  const pass = () => {
    const now = Date.now();
    if (!canPass || now - lastPass.current < PASS_COOLDOWN_MS) return;
    lastPass.current = now;
    if (!reduceMotion) setThrown(activeCard);
    haptics.medium();
    onPass();
  };
  /** A drawn card deals in; any other card new to a slot fades in or steps up, as on a swap. */
  const fanInitial = (name: string, depth: number) => {
    if (!settled.current) return false;
    return drawn.has(name) && !reduceMotion
      ? arrivalPose(depth, origin.current)
      : { ...fanPose(depth), opacity: 0 };
  };
  const topDrawn = drawn.has(activeCard.name) && !reduceMotion;
  const topInitial = topDrawn
    ? arrivalPose(0, origin.current)
    : { x: FAN_STEP_PX, rotate: FAN_STEP_DEG };
  const cardNudgeClass = topCardNudgeClass(nudge);
  const fanned = currentPlayer.hand.slice(1, MAX_FAN_CARDS);

  return (
    // Two cells of the bar's `hand-grid` (index.css): the square stack in the middle of the
    // screen, and the swap and pass buttons in the space to its right, opposite the counter. The fan
    // spills out of the middle cell: its deepest card reaches 24px right, which `.hand-swap`
    // keeps the button clear of.
    <>
      <div className="relative flex items-center pointer-events-auto">
        {/* The rest of the hand, peeking out behind the top card. Keyed by card, so on a swap
              each one glides forward a place; the card that was on top fades in at the back. */}
        {fanned.map((event, i) => (
          <motion.div
            key={event.name}
            data-hand-fan={i + 1}
            className="absolute pointer-events-none"
            style={{ zIndex: MAX_FAN_CARDS - 2 - i }}
            initial={fanInitial(event.name, i + 1)}
            animate={fanPose(i + 1)}
            transition={drawn.has(event.name) ? arrive : shuffle}
          >
            {/* Always on screen, so nothing for lazy loading to defer */}
            <Card event={event} size="square" priority />
          </motion.div>
        ))}

        {/* Top card (active, draggable). The hint's bob goes on this wrapper, not the drag
              handle: dnd-kit measures the activator node. The shuffle goes on a wrapper of its
              own inside it, because the hint animates this one's transform in CSS. */}
        <div ref={topRef} className={`relative z-[5] ${cardNudgeClass}`}>
          <motion.div
            key={activeCard.name}
            initial={settled.current ? topInitial : false}
            animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={topDrawn ? arrive : shuffle}
          >
            <DraggableCard
              event={activeCard}
              onTap={onCardTap}
              disabled={isAnimating}
              isHidden={isAnimating}
              size="square"
              priority
            />
          </motion.div>
        </div>

        {/* The passed card, on its way out over the top of the hand. A copy, not the hand's
            own card leaving: that element also unmounts on a swap and on every placement, and
            an exiting `DraggableCard` would register the drag id twice. No opacity, so there
            is no frame in which it can flash back. */}
        {thrown && (
          <motion.div
            key={thrown.name}
            data-testid="passed-card"
            aria-hidden
            className="absolute left-0 top-0 z-[6] pointer-events-none"
            initial={{ x: 0, y: 0, rotate: 0 }}
            animate={THROW.animate}
            transition={THROW.transition}
            onAnimationComplete={() => setThrown(null)}
          >
            <Card event={thrown} size="square" priority />
          </motion.div>
        )}
      </div>

      {/* Pass and, below it, Swap: beside the card, never on it, so they cover neither art nor
          title. 44px each, the minimum touch target, and 12px apart. Pass is the upper one: it
          cannot be undone, so it sits further from a resting thumb than Swap, which can. */}
      <div className="hand-swap flex flex-col items-center justify-center gap-3 pointer-events-auto">
        {/* The badge is a sibling of the button, not a child, so a disabled button's dimming
            does not take the count with it. */}
        <div className="relative flex">
          <button
            onClick={pass}
            disabled={!canPass}
            className={handButtonClass(passNudge)}
            aria-label="Pass this card"
            aria-describedby={passesId}
          >
            <SkipForward className={`w-5 h-5 ${passNudge ? 'text-white' : 'text-text'}`} />
          </button>
          <PassBadge count={passes} still={reduceMotion === true} />
          <span id={passesId} className="sr-only">
            {passes === 1 ? '1 pass left' : `${passes} passes left`}
          </span>
        </div>

        <button
          onClick={cycle}
          disabled={!canCycle}
          className={handButtonClass(cycleNudge)}
          aria-label="Cycle to next card"
        >
          <motion.span
            className="flex"
            animate={{ rotate: turns * 180 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <RefreshCw className={`w-5 h-5 ${cycleNudge ? 'text-white' : 'text-text'}`} />
          </motion.span>
        </button>
      </div>
    </>
  );
};

export default ActiveCardDisplay;
