import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult } from '../types';
import Card from './Card';

interface DraggableCardProps {
  event: HistoricalEvent;
  onTap: () => void;
  lastResult: PlacementResult | null;
  isAnimating: boolean;
  disabled?: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  event,
  onTap,
  lastResult,
  isAnimating,
  disabled = false,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'active-card',
    data: { event },
    disabled: disabled || isAnimating,
  });

  const isRevealing = isAnimating && lastResult && !lastResult.success;

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
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        transition-all duration-200
        ${animationClass}
        ${isDragging ? 'invisible' : ''}
        ${disabled || isAnimating ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={{
        touchAction: 'none', // Prevent scroll interference on mobile
      }}
      onClick={(e) => {
        // Only trigger tap if not dragging
        if (!isDragging) {
          onTap();
        }
      }}
    >
      <Card
        event={event}
        isRevealing={Boolean(isRevealing)}
        size="normal"
      />
    </div>
  );
};

export default DraggableCard;
