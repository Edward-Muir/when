import { RefreshCw } from 'lucide-react';
import { HistoricalEvent, Player } from '../types';
import DraggableCard from './DraggableCard';
import Card from './Card';

interface ActiveCardDisplayProps {
  activeCard: HistoricalEvent;
  currentPlayer: Player;
  isAnimating: boolean;
  isOverTimeline: boolean;
  onCycleHand: () => void;
  onCardTap: () => void;
}

const ActiveCardDisplay: React.FC<ActiveCardDisplayProps> = ({
  activeCard,
  currentPlayer,
  isAnimating,
  isOverTimeline,
  onCycleHand,
  onCardTap,
}) => {
  const canCycle = !isAnimating && currentPlayer.hand.length > 1;

  return (
    <div className="flex-1 flex items-center justify-start pl-3 pointer-events-auto">
      {/* Card stack container with cycle button */}
      <div className="relative">
        {/* Cycle button - top right corner */}
        <button
          onClick={() => canCycle && onCycleHand()}
          disabled={!canCycle}
          className="absolute -top-2 -right-2 z-50 w-10 h-10 min-w-10 min-h-10 shrink-0 rounded-full
            bg-surface border border-border
            shadow-sm flex items-center justify-center
            hover:bg-border
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-95 transition-all"
          aria-label="Cycle to next card"
        >
          <RefreshCw className="w-4 h-4 text-text" />
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

          {/* Top card (active, draggable) */}
          <div className="relative z-[2]">
            <DraggableCard
              event={activeCard}
              onTap={onCardTap}
              disabled={isAnimating}
              isOverTimeline={isOverTimeline}
              isHidden={isAnimating}
              size="landscape"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCardDisplay;
