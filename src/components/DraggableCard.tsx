import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { HistoricalEvent } from '../types';
import Card from './Card';

interface DraggableCardProps {
  event: HistoricalEvent;
  onTap: () => void;
  disabled?: boolean;
  isOverTimeline?: boolean;
  isHidden?: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  event,
  onTap,
  disabled = false,
  isOverTimeline = false,
  isHidden = false,
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: 'active-card',
    data: { event },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        pointer-events-none
        ${isHidden ? 'invisible' : ''}
        ${!isHidden && isDragging ? (isOverTimeline ? 'invisible' : 'opacity-ghost') : ''}
      `}
    >
      {/* Card is the drag handle - only this area triggers drag initiation */}
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className={`
          pointer-events-auto
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
    </div>
  );
};

export default DraggableCard;
