import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { HistoricalEvent, Player } from '../types';
import { GameHintKey } from '../utils/playerStorage';
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
  };
}

/** A swap, as the cards show it: each steps forward a place, in about this long. */
const SHUFFLE = { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] };
const STILL = { duration: 0 };

interface ActiveCardDisplayProps {
  activeCard: HistoricalEvent;
  currentPlayer: Player;
  isAnimating: boolean;
  onCycleHand: () => void;
  onCardTap: () => void;
  /**
   * The onboarding hint on screen: `drag` bobs the top card, `tapCard` glows it, `swap`
   * pulses the cycle button.
   */
  nudge?: GameHintKey | null;
}

const ActiveCardDisplay: React.FC<ActiveCardDisplayProps> = ({
  activeCard,
  currentPlayer,
  isAnimating,
  onCycleHand,
  onCardTap,
  nudge = null,
}) => {
  const canCycle = !isAnimating && currentPlayer.hand.length > 1;
  // Filled gold and glowing with the same animation as the Daily Play button (swell +
  // brightness, never opacity), so the strip's "swap" has something to point at.
  const cycleNudge = nudge === 'swap';
  // The darker fill is for a press, and for a pointer that can hover. A bare `hover:` sticks
  // on a touch screen: the tap leaves `:hover` set until something else is touched, and the
  // button looks held down for good.
  const cycleNudgeClass = cycleNudge
    ? 'animate-hint-glow bg-accent border-accent'
    : 'bg-surface border-border active:bg-border [@media(hover:hover)]:hover:bg-border';
  const reduceMotion = useReducedMotion();
  const shuffle = reduceMotion ? STILL : SHUFFLE;
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
  const cardNudgeClass = topCardNudgeClass(nudge);
  const fanned = currentPlayer.hand.slice(1, MAX_FAN_CARDS);

  return (
    <div className="flex-1 flex items-center justify-start pl-3 pointer-events-auto">
      {/* The square stack, then the swap button beside it. The gap clears the fan: the
          deepest card reaches 24px right and its rotated corner a few more. */}
      <div className="flex items-center gap-10">
        <div className="relative flex items-center">
          {/* The rest of the hand, peeking out behind the top card. Keyed by card, so on a swap
              each one glides forward a place; the card that was on top fades in at the back. */}
          {fanned.map((event, i) => (
            <motion.div
              key={event.name}
              data-hand-fan={i + 1}
              className="absolute pointer-events-none"
              style={{ zIndex: MAX_FAN_CARDS - 2 - i }}
              initial={settled.current ? { ...fanPose(i + 1), opacity: 0 } : false}
              animate={fanPose(i + 1)}
              transition={shuffle}
            >
              {/* Always on screen, so nothing for lazy loading to defer */}
              <Card event={event} size="square" priority />
            </motion.div>
          ))}

          {/* Top card (active, draggable). The hint's bob goes on this wrapper, not the drag
              handle: dnd-kit measures the activator node. The shuffle goes on a wrapper of its
              own inside it, because the hint animates this one's transform in CSS. */}
          <div className={`relative z-[5] ${cardNudgeClass}`}>
            <motion.div
              key={activeCard.name}
              initial={settled.current ? { x: FAN_STEP_PX, rotate: FAN_STEP_DEG } : false}
              animate={{ x: 0, rotate: 0 }}
              transition={shuffle}
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
        </div>

        {/* Swap button: beside the card, never on it, so it covers neither art nor title.
            44px, the minimum touch target. */}
        <button
          onClick={cycle}
          disabled={!canCycle}
          className={`w-11 h-11 min-w-11 min-h-11 shrink-0 rounded-full
            border shadow-sm flex items-center justify-center
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-[0.92] active:shadow-none
            transition-[transform,background-color,box-shadow] duration-100 ${cycleNudgeClass}`}
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
    </div>
  );
};

export default ActiveCardDisplay;
