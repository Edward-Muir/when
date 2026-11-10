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

  return (
    <div className="flex-1 flex items-center justify-start pl-3 pointer-events-auto">
      {/* The square stack, then the swap button beside it. The gap clears the fan: the back
          card reaches 16px right and its rotated corner a few more. */}
      <div className="flex items-center gap-7">
        <div className="relative flex items-center">
          {/* The fanned cards are dimmed, not translucent: a see-through square shows the
              title of the card under it through its own. */}
          {/* 3rd card (fanned to right) */}
          {currentPlayer.hand[2] && (
            <div
              className="absolute z-0 pointer-events-none brightness-75"
              style={{ transform: 'translateX(16px) rotate(4deg)' }}
            >
              <Card event={currentPlayer.hand[2]} size="square" />
            </div>
          )}

          {/* 2nd card (fanned to right) */}
          {currentPlayer.hand[1] && (
            <div
              className="absolute z-[1] pointer-events-none brightness-90"
              style={{ transform: 'translateX(8px) rotate(2deg)' }}
            >
              <Card event={currentPlayer.hand[1]} size="square" />
            </div>
          )}

          {/* Top card (active, draggable). The bob goes on this wrapper, not the drag
              handle: dnd-kit measures the activator node. */}
          <div className={`relative z-[2] ${cardNudgeClass}`}>
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
