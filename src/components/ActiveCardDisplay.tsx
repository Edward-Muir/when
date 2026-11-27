import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDndContext } from '@dnd-kit/core';
import { RefreshCw, SkipForward } from 'lucide-react';
import { HistoricalEvent, Player } from '../types';
import { GameHintKey } from '../utils/playerStorage';
import { PASS_STREAK, passProgress, passesAwarded, passesLeft } from '../utils/gameLogic';
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
 * Where a drawn card starts, on its way to `depth` places behind the top card: on the top card
 * of the deck pile in the bar's left panel, at that card's size, so it is seen to be dealt
 * from the deck. No
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

/**
 * The deck pile `GameInfoCompact` renders in the same bar: its top card, which is the first in
 * the pile, or the pile itself once the deck is empty.
 */
const DECK_TOP_SELECTOR = '[data-testid="deck-pile"] [data-testid="deck-card"]';
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
    const pileEl =
      document.querySelector<HTMLElement>(DECK_TOP_SELECTOR) ??
      document.querySelector<HTMLElement>(DECK_PILE_SELECTOR);
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

/** The name under each hand button: the same type as the deck pile's "Deck" caption. */
const HAND_LABEL_CLASS = 'text-sm text-text font-body';

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
  // The size is `--hand-button` (index.css): 48px, or 44px on a screen under 360px wide.
  return `w-[var(--hand-button)] h-[var(--hand-button)] min-w-[var(--hand-button)]
    min-h-[var(--hand-button)] shrink-0 rounded-full
    border shadow-sm flex items-center justify-center
    disabled:opacity-40 disabled:cursor-not-allowed
    active:scale-[0.92] active:shadow-none
    transition-[transform,background-color,box-shadow] duration-100 ${fill}`;
}

/**
 * The ring's circle, in the units of a 44-unit viewBox: on the button's 1px border, 2.5 wide.
 * The SVG fills the button, so at the 48px button it is drawn a little larger and still sits
 * on the border.
 */
const RING_RADIUS = 20.75;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
/** The space between two segments, along the circle. */
const RING_GAP = 7;
/** Where the first segment starts, clockwise from twelve o'clock: under the count badge. */
const RING_START_DEG = 45;

/**
 * An earned pass, as it is shown: the ring completes, its gold runs round both sides of the
 * button into the count badge, and the badge bursts as the count goes up.
 *
 * - `full`: all three segments lit, long enough to register that the third placement did it.
 * - `gather`: the gold leaves the far side of the ring first and closes on the badge.
 * - `pop`: the badge takes the new count, with a ring of gold thrown off it and a "+1".
 *
 * The count on the badge is held back until `pop`, so the number changes when the gold
 * arrives and not half a second before it. Only what is shown lags: the pass itself is in the
 * hand, and spendable, from the first frame.
 */
type EarnPhase = 'idle' | 'full' | 'gather' | 'pop';
const EARN_FULL_MS = 170;
const EARN_GATHER_MS = 330;
const EARN_POP_MS = 750;

/**
 * Walks the phases above each time the history earns a pass. Mounting with passes already
 * earned (a resumed daily) is not an earn. Under reduced motion it never leaves `idle`: the
 * count simply changes.
 *
 * The earn is noticed during render, not in an effect. An effect runs after the commit that
 * brought the new history, and that commit would paint one frame of the finished state (the
 * new count, an empty ring) before the animation began: the badge visibly jumped and jumped
 * back. Setting state while rendering makes React render again before it paints.
 */
function usePassEarn(history: readonly boolean[], still: boolean): EarnPhase {
  const awarded = passesAwarded(history);
  const [seen, setSeen] = useState(awarded);
  const [phase, setPhase] = useState<EarnPhase>('idle');
  if (awarded !== seen) {
    setSeen(awarded);
    setPhase(awarded > seen && !still ? 'full' : 'idle');
  }
  // One value for the whole of one earn: it changes when an earn starts and when it is over,
  // and not as the phases advance, so the timers below are set once and left to run.
  const earning = phase === 'idle' ? null : seen;
  useEffect(() => {
    if (earning === null) return undefined;
    const timers = [
      window.setTimeout(() => setPhase('gather'), EARN_FULL_MS),
      window.setTimeout(() => setPhase('pop'), EARN_FULL_MS + EARN_GATHER_MS),
      window.setTimeout(() => setPhase('idle'), EARN_FULL_MS + EARN_GATHER_MS + EARN_POP_MS),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [earning]);
  return phase;
}

/** A point on the ring, `deg` clockwise from twelve o'clock. */
function ringPoint(deg: number): string {
  const rad = (deg * Math.PI) / 180;
  const x = 22 + RING_RADIUS * Math.sin(rad);
  const y = 22 - RING_RADIUS * Math.cos(rad);
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

/**
 * The two halves of the ring, each drawn from the badge's corner round to the point opposite
 * it. Drawn from the badge, so shortening one pulls its far end in towards the badge.
 */
const GATHER_ARCS = [1, 0].map(
  (sweep) =>
    `M ${ringPoint(RING_START_DEG)} A ${RING_RADIUS} ${RING_RADIUS} 0 0 ${sweep} ${ringPoint(RING_START_DEG + 180)}`
);

/**
 * Progress to the next pass, drawn on the Pass button's own border: one segment for each
 * correct placement in a row, `PASS_STREAK` in all. It makes the earning rule visible where
 * the pass is spent, and it is why the button is not plain.
 *
 * - The gaps sit at the count badge's corner and at thirds from it, so the badge covers a
 *   gap, not a segment, and the last segment to light runs up to the badge it is about to
 *   raise.
 * - A sibling of the button, like the badge: a spent or disabled button still shows how
 *   close the next pass is.
 * - While a pass is being earned it is lit in full, then its gold is drawn off into the badge
 *   (`EarnPhase`). The gold thickens as it shortens, so it reads as gathered, not erased.
 * - It follows pass progress, not a streak tier, so it lives here and not in
 *   `streakFeedback.ts`.
 */
const PassRing: React.FC<{ history: readonly boolean[]; phase: EarnPhase }> = ({
  history,
  phase,
}) => {
  const lit = phase === 'full' ? PASS_STREAK : phase === 'idle' ? passProgress(history) : 0;
  const step = RING_LENGTH / PASS_STREAK;

  return (
    <svg
      data-testid="pass-ring"
      data-lit={lit}
      aria-hidden
      viewBox="0 0 44 44"
      fill="none"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {Array.from({ length: PASS_STREAK }, (_, i) => (
        <circle
          key={i}
          data-testid="pass-ring-segment"
          data-lit={i < lit}
          cx="22"
          cy="22"
          r={RING_RADIUS}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${step - RING_GAP} ${RING_LENGTH - step + RING_GAP}`}
          strokeDashoffset={-(i * step + RING_GAP / 2)}
          transform={`rotate(${RING_START_DEG - 90} 22 22)`}
          stroke={i < lit ? 'var(--color-accent)' : 'var(--color-border)'}
          // The gold arrives softly and leaves at once: the gather below takes over from it.
          className={i < lit ? 'transition-[stroke] duration-150' : ''}
        />
      ))}
      {phase === 'gather' &&
        GATHER_ARCS.map((d) => (
          <motion.path
            key={d}
            data-testid="pass-ring-gather"
            d={d}
            stroke="var(--color-accent)"
            strokeLinecap="round"
            initial={{ pathLength: 1, strokeWidth: 2.5 }}
            animate={{ pathLength: 0.02, strokeWidth: 5 }}
            transition={{ duration: EARN_GATHER_MS / 1000, ease: [0.5, 0, 0.9, 0.4] }}
          />
        ))}
    </svg>
  );
};

/** What a screen reader hears for the Pass button: what is left, and what earns the next. */
function passStatus(passes: number, toNext: number): string {
  const left = passes === 1 ? '1 pass left' : `${passes} passes left`;
  return `${left}, ${toNext} more in a row for another`;
}

/**
 * The passes left, on the corner of the Pass button. It pops when the count rises, hard, as
 * the gathered ring lands in it. Transform only, like `StreakBolt`.
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
      initial={grew && !still ? { scale: 2.1 } : false}
      animate={{ scale: 1 }}
      // Firm enough that the rebound stays near full size: a looser spring shrank the badge
      // to a dot on its way back.
      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
      className={`pointer-events-none absolute -top-1 right-0 z-[1] flex h-4 min-w-4 items-center
        justify-center rounded-full px-1 font-body text-[10px] font-semibold leading-none
        ring-2 ring-bg ${tone}`}
    >
      {count}
    </motion.span>
  );
};

/**
 * What the badge throws off as the pass lands: a ring of gold opening out from it, and a
 * "+1" that lifts away. Mounted only for the `pop` phase, at the badge's own corner. These two
 * do fade, which nothing else on the button does: they are leaving, and they are outside any
 * Modal, where the Android WebView's opacity flicker lives (docs/mobile-ios).
 */
const PassEarned: React.FC = () => (
  <span
    data-testid="pass-earned"
    aria-hidden
    className="pointer-events-none absolute -top-1 right-0 flex h-4 w-4 items-center justify-center"
  >
    <motion.span
      className="absolute h-4 w-4 rounded-full border-2 border-accent"
      initial={{ scale: 0.8, opacity: 0.9 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    />
    <motion.span
      className="absolute font-body text-xs font-bold text-accent"
      initial={{ y: -6, scale: 0.5, opacity: 0 }}
      animate={{ y: [-6, -20, -26], scale: [0.5, 1.25, 1], opacity: [0, 1, 0] }}
      transition={{ duration: EARN_POP_MS / 1000, times: [0, 0.3, 1], ease: 'easeOut' }}
    >
      +1
    </motion.span>
  </span>
);

/**
 * Everything on the Pass button that is not the button: the progress ring, the count badge,
 * and the moment a pass is earned. Siblings of the button, not children, so a disabled
 * button's dimming does not take them with it. A component of its own so the earn's timers
 * and its lagging count stay out of `ActiveCardDisplay`.
 */
const PassStatus: React.FC<{ player: Player; nudged: boolean; still: boolean }> = ({
  player,
  nudged,
  still,
}) => {
  const phase = usePassEarn(player.placementHistory, still);
  const { haptics } = useHaptics();
  useEffect(() => {
    if (phase === 'pop') haptics.light();
  }, [phase, haptics]);
  // The count the badge shows: one short of the truth until the gold reaches it.
  const arriving = phase === 'full' || phase === 'gather';
  const shown = Math.max(0, passesLeft(player) - (arriving ? 1 : 0));

  return (
    <>
      {/* Not while the hint has the button filled gold: gold on gold says nothing. */}
      {!nudged && <PassRing history={player.placementHistory} phase={phase} />}
      <PassBadge count={shown} still={still} />
      {phase === 'pop' && <PassEarned />}
    </>
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

      {/* Pass and, below it, Cycle: beside the card, never on it, so they cover neither art nor
          title. 48px each: at 44px and 12px apart a thumb landed between them, or on the wrong
          one. Pass is the upper one: it cannot be undone, so it sits further from a resting
          thumb than Cycle, which can. Each is named under it, in the type of the "Deck"
          caption opposite: a returning player had no way to tell what the new button did. The
          names are hidden from a screen reader, which has each button's own label. */}
      <div className="hand-swap flex flex-col items-center justify-center gap-3 pointer-events-auto">
        <div className="flex flex-col items-center gap-1">
          {/* The ring and the badge are siblings of the button, not children, so a disabled
              button's dimming does not take them with it. */}
          <div className="relative flex">
            <button
              onClick={pass}
              disabled={!canPass}
              className={handButtonClass(passNudge)}
              aria-label="Pass this card"
              aria-describedby={passesId}
            >
              <SkipForward
                className={`w-[22px] h-[22px] ${passNudge ? 'text-white' : 'text-text'}`}
              />
            </button>
            <PassStatus player={currentPlayer} nudged={passNudge} still={reduceMotion === true} />
            <span id={passesId} className="sr-only">
              {passStatus(passes, PASS_STREAK - passProgress(currentPlayer.placementHistory))}
            </span>
          </div>
          <span aria-hidden className={HAND_LABEL_CLASS}>
            Pass
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
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
              <RefreshCw
                className={`w-[22px] h-[22px] ${cycleNudge ? 'text-white' : 'text-text'}`}
              />
            </motion.span>
          </button>
          <span aria-hidden className={HAND_LABEL_CLASS}>
            Cycle
          </span>
        </div>
      </div>
    </>
  );
};

export default ActiveCardDisplay;
