import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { HistoricalEvent } from '../types';
import Card from './Card';

interface DraggableCardProps {
  event: HistoricalEvent;
  onTap: () => void;
  disabled?: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  event,
  onTap,
  disabled = false,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'active-card',
    data: { event },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        transition-all duration-200
        ${isDragging ? 'invisible' : ''}
        ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={{
        touchAction: 'none', // Prevent scroll interference on mobile
      }}
      onClick={() => {
        // Only trigger tap if not dragging
        if (!isDragging) {
          onTap();
        }
      }}
    >
      <Card event={event} size="normal" />
    </div>
  );
};

export default DraggableCard;
