import { RefreshCw } from 'lucide-react';
import { HistoricalEvent, Player } from '../types';
import DraggableCard from './DraggableCard';
import Card from './Card';

interface ActiveCardDisplayProps {
  activeCard: HistoricalEvent;
  currentPlayer: Player;
  playersCount: number;
  isAnimating: boolean;
  isOverTimeline: boolean;
  onCycleHand: () => void;
  onCardTap: () => void;
}

const ActiveCardDisplay: React.FC<ActiveCardDisplayProps> = ({
  activeCard,
  currentPlayer,
  playersCount,
  isAnimating,
  isOverTimeline,
  onCycleHand,
  onCardTap,
}) => {
  const canCycle = !isAnimating && currentPlayer.hand.length > 1;

  return (
    <div className="relative flex flex-col items-start gap-2 pb-2 pointer-events-auto">
      <p className="text-light-muted dark:text-dark-muted text-ui-label font-body">
        {playersCount > 1 ? `${currentPlayer.name}'s turn:` : 'Drag to timeline:'}
      </p>
      <div className="relative z-40">
        <div className="relative p-2 pb-4 pr-4 rounded-xl bg-light-border/50 dark:bg-dark-border/100">
          {/* Cycle button - top right corner */}
          <button
            onClick={() => canCycle && onCycleHand()}
            disabled={!canCycle}
            className="absolute -top-3 -right-3 z-50 w-11 h-11 min-w-11 min-h-11 shrink-0 aspect-square rounded-full
              bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border
              shadow-sm flex items-center justify-center
              hover:bg-light-border dark:hover:bg-dark-border
              disabled:opacity-40 disabled:cursor-not-allowed
              active:scale-95 transition-all"
            aria-label="Cycle to next card"
          >
            <RefreshCw className="w-5 h-5 text-accent dark:text-accent-dark" />
          </button>

          {/* 3rd card (bottom of stack) */}
          {currentPlayer.hand[2] && (
            <div
              className="absolute top-2 left-2 z-0 pointer-events-none opacity-50"
              style={{ transform: 'translate(12px, 12px)' }}
            >
              <Card event={currentPlayer.hand[2]} size="normal" />
            </div>
          )}

          {/* 2nd card (middle of stack) */}
          {currentPlayer.hand[1] && (
            <div
              className="absolute top-2 left-2 z-[1] pointer-events-none opacity-70"
              style={{ transform: 'translate(6px, 6px)' }}
            >
              <Card event={currentPlayer.hand[1]} size="normal" />
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCardDisplay;
