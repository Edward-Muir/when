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
function fanStyle(depth: number): React.CSSProperties {
  return {
    transform: `translateX(${depth * FAN_STEP_PX}px) rotate(${depth * FAN_STEP_DEG}deg)`,
    filter: `brightness(${1 - depth * 0.1})`,
    zIndex: MAX_FAN_CARDS - 1 - depth,
  };
}

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
  const cycleNudgeClass = cycleNudge
    ? 'animate-hint-glow bg-accent border-accent hover:bg-accent'
    : 'bg-surface border-border hover:bg-border';
  const cardNudgeClass = topCardNudgeClass(nudge);
  const fanned = currentPlayer.hand.slice(1, MAX_FAN_CARDS);

  return (
    <div className="flex-1 flex items-center justify-start pl-3 pointer-events-auto">
      {/* The square stack, then the swap button beside it. The gap clears the fan: the
          deepest card reaches 24px right and its rotated corner a few more. */}
      <div className="flex items-center gap-10">
        <div className="relative flex items-center">
          {/* The rest of the hand, peeking out behind the top card: deepest first, so each
              card paints over the one behind it. */}
          {fanned
            .map((event, i) => ({ event, depth: i + 1 }))
            .reverse()
            .map(({ event, depth }) => (
              <div
                key={event.name}
                data-hand-fan={depth}
                className="absolute pointer-events-none"
                style={fanStyle(depth)}
              >
                {/* Always on screen, so nothing for lazy loading to defer */}
                <Card event={event} size="square" priority />
              </div>
            ))}

          {/* Top card (active, draggable). The bob goes on this wrapper, not the drag
              handle: dnd-kit measures the activator node. */}
          <div className={`relative z-[5] ${cardNudgeClass}`}>
            <DraggableCard
              event={activeCard}
              onTap={onCardTap}
              disabled={isAnimating}
              isHidden={isAnimating}
              size="square"
              priority
            />
          </div>
        </div>

        {/* Swap button: beside the card, never on it, so it covers neither art nor title.
            44px, the minimum touch target. */}
        <button
          onClick={() => canCycle && onCycleHand()}
          disabled={!canCycle}
          className={`w-11 h-11 min-w-11 min-h-11 shrink-0 rounded-full
            border shadow-sm flex items-center justify-center
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-95 transition-all ${cycleNudgeClass}`}
          aria-label="Cycle to next card"
        >
          <RefreshCw className={`w-5 h-5 ${cycleNudge ? 'text-white' : 'text-text'}`} />
        </button>
      </div>
    </div>
  );
};

export default ActiveCardDisplay;
