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
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-sketch/60 text-sm">Place this event on the timeline</p>
      <div className={`transition-all duration-300 ${animationClass}`}>
        <Card
          event={event}
          showYear={showYear}
          isRevealing={Boolean(isRevealing)}
          size="large"
          onClick={onTap}
        />
      </div>
      <p className="text-sketch/40 text-xs">Tap card for details</p>
    </div>
  );
};

export default ActiveCard;
