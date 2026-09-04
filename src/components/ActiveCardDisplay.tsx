import { RefreshCw } from 'lucide-react';
import { HistoricalEvent, Player } from '../types';
import { GameHintKey } from '../utils/playerStorage';
import DraggableCard from './DraggableCard';
import Card from './Card';

interface ActiveCardDisplayProps {
  activeCard: HistoricalEvent;
  currentPlayer: Player;
  isAnimating: boolean;
  isOverTimeline: boolean;
  onCycleHand: () => void;
  onCardTap: () => void;
  /** The onboarding hint on screen: `drag` bobs the top card, `swap` pulses the button. */
  nudge?: GameHintKey | null;
}

const ActiveCardDisplay: React.FC<ActiveCardDisplayProps> = ({
  activeCard,
  currentPlayer,
  isAnimating,
  isOverTimeline,
  onCycleHand,
  onCardTap,
  nudge = null,
}) => {
  const canCycle = !isAnimating && currentPlayer.hand.length > 1;
  // Filled gold as well as flashing (swell + fade; a fade-only blink under Reduce Motion), so
  // the strip's "swap" has something to point at.
  const cycleNudge = nudge === 'swap';
  const cycleNudgeClass = cycleNudge
    ? 'animate-hint-pulse bg-accent border-accent hover:bg-accent'
    : 'bg-surface border-border hover:bg-border';
  const cardNudgeClass = nudge === 'drag' ? 'animate-hint-lift' : '';

  return (
    <div className="flex-1 flex items-center justify-start pl-3 pointer-events-auto">
      {/* Card stack container with cycle button */}
      <div className="relative">
        {/* Cycle button - top right corner */}
        <button
          onClick={() => canCycle && onCycleHand()}
          disabled={!canCycle}
          className={`absolute -top-2 -right-2 z-50 w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full
            border shadow-sm flex items-center justify-center
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-95 transition-all ${cycleNudgeClass}`}
          aria-label="Cycle to next card"
        >
          <RefreshCw className={`w-4 h-4 ${cycleNudge ? 'text-white' : 'text-text'}`} />
        </button>

        {/* Horizontal card stack */}
        <div className="relative flex items-center">
          {/* 3rd card (fanned to right) */}
          {currentPlayer.hand[2] && (
            <div
              className="absolute z-0 pointer-events-none opacity-50"
              style={{ transform: 'translateX(16px) rotate(4deg)' }}
            >
              <Card event={currentPlayer.hand[2]} size="landscape" />
            </div>
          )}

          {/* 2nd card (fanned to right) */}
          {currentPlayer.hand[1] && (
            <div
              className="absolute z-[1] pointer-events-none opacity-70"
              style={{ transform: 'translateX(8px) rotate(2deg)' }}
            >
              <Card event={currentPlayer.hand[1]} size="landscape" />
            </div>
          )}

          {/* Top card (active, draggable). The bob goes on this wrapper, not the drag
              handle: dnd-kit measures the activator node. */}
          <div className={`relative z-[2] ${cardNudgeClass}`}>
            <DraggableCard
              event={activeCard}
              onTap={onCardTap}
              disabled={isAnimating}
              isOverTimeline={isOverTimeline}
              isHidden={isAnimating}
              size="landscape"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCardDisplay;
