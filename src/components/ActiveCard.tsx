import React from 'react';
import { HistoricalEvent, PlacementResult } from '../types';
import Card from './Card';

interface ActiveCardProps {
  event: HistoricalEvent;
  onTap: () => void;
  lastResult: PlacementResult | null;
  isAnimating: boolean;
}

const ActiveCard: React.FC<ActiveCardProps> = ({ event, onTap, lastResult, isAnimating }) => {
  const isRevealing = isAnimating && lastResult && !lastResult.success;
  const showYear = Boolean(isRevealing);

  // Determine animation classes
  let animationClass = '';
  if (isAnimating && lastResult) {
    if (lastResult.success) {
      animationClass = 'animate-success-glow';
    } else {
      animationClass = 'animate-error-pulse animate-shake';
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 pb-2">
      <p className="text-sketch/60 text-xs">Place this event:</p>
      <div className={`transition-all duration-300 ${animationClass}`}>
        <Card
          event={event}
          showYear={showYear}
          isRevealing={Boolean(isRevealing)}
          size="normal"
          onClick={onTap}
        />
      </div>
      <p className="text-sketch/40 text-xs">Tap for details</p>
    </div>
  );
};

export default ActiveCard;
