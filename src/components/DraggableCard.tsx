import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { HistoricalEvent } from '../types';
import Card, { CardSize } from './Card';
import { HAND_CARD_ATTR } from '../hooks/useDragAndDrop';

interface DraggableCardProps {
  event: HistoricalEvent;
  onTap: () => void;
  disabled?: boolean;
  isHidden?: boolean;
  size?: CardSize;
  priority?: boolean;
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  event,
  onTap,
  disabled = false,
  isHidden = false,
  size = 'normal',
  priority = false,
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: 'active-card',
    data: { event },
    disabled,
  });

  return (
    // Gone from the hand the moment it is lifted: the drag overlay starts as this exact square
    // and closes into the landscape card (HandDragOverlay), so a ghost left behind would be a
    // second copy of the card, with the next card's title showing through it.
    <div
      ref={setNodeRef}
      className={`
        pointer-events-none
        ${isHidden || isDragging ? 'invisible' : ''}
      `}
    >
      {/* Card is the drag handle - only this area triggers drag initiation */}
      <div
        ref={setActivatorNodeRef}
        {...{ [HAND_CARD_ATTR]: '' }}
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
        <Card event={event} size={size} priority={priority} />
      </div>
    </div>
  );
};

export default DraggableCard;
