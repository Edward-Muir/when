import { useState, useCallback, useRef } from 'react';
import { DragStartEvent, DragEndEvent, DragOverEvent, DragMoveEvent } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult } from '../types';

interface UseDragAndDropProps {
  activeCard: HistoricalEvent | null;
  onPlacement: (index: number) => PlacementResult | null;
  isAnimating: boolean;
}

interface DragState {
  isDragging: boolean;
  insertionIndex: number | null;
  isOverHand: boolean;
  isOverTimeline: boolean;
}

interface DragHandlers {
  handleDragStart: (event: DragStartEvent) => void;
  handleDragMove: (event: DragMoveEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

interface UseDragAndDropReturn {
  state: DragState;
  handlers: DragHandlers;
  droppedOnTimelineRef: React.MutableRefObject<boolean>;
  draggedCardRef: React.MutableRefObject<HistoricalEvent | null>;
}

export function useDragAndDrop({
  activeCard,
  onPlacement,
  isAnimating,
}: UseDragAndDropProps): UseDragAndDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [isOverHand, setIsOverHand] = useState(false);
  const [isOverTimeline, setIsOverTimeline] = useState(false);
  const [yearPositions, setYearPositions] = useState<number[]>([]);

  const droppedOnTimelineRef = useRef(false);
  const draggedCardRef = useRef<HistoricalEvent | null>(null);

  const calculateInsertionFromPositions = useCallback(
    (pointerY: number, positions: number[]): number => {
      if (positions.length === 0) return 0;

      for (let i = 0; i < positions.length; i++) {
        if (pointerY < positions[i]) {
          return i;
        }
      }

      return positions.length;
    },
    []
  );

  const handleDragStart = useCallback(
    (_event: DragStartEvent) => {
      setIsDragging(true);
      setInsertionIndex(null);
      draggedCardRef.current = activeCard;

      const yearElements = document.querySelectorAll('[data-timeline-year]');
      const positions = Array.from(yearElements).map((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      setYearPositions(positions);
    },
    [activeCard]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const activatorEvent = event.activatorEvent;
      let initialY: number;

      if (typeof TouchEvent !== 'undefined' && activatorEvent instanceof TouchEvent) {
        initialY = activatorEvent.touches[0]?.clientY ?? 0;
      } else if (activatorEvent instanceof MouseEvent || activatorEvent instanceof PointerEvent) {
        initialY = activatorEvent.clientY;
      } else {
        return;
      }

      const pointerY = initialY + event.delta.y;
      const newIndex = calculateInsertionFromPositions(pointerY, yearPositions);
      setInsertionIndex(newIndex);
    },
    [yearPositions, calculateInsertionFromPositions]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;

    if (!over) {
      setIsOverHand(false);
      setIsOverTimeline(false);
      return;
    }

    // Bottom bar zone is the new "hand zone" (returns card to hand)
    setIsOverHand(over.id === 'bottom-bar-zone');
    setIsOverTimeline(over.id === 'timeline-zone');
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over } = event;
      const isDropOnTimeline = over?.id === 'timeline-zone';

      droppedOnTimelineRef.current = isDropOnTimeline && insertionIndex !== null && !isAnimating;

      setIsDragging(false);
      setIsOverHand(false);
      setIsOverTimeline(false);

      if (droppedOnTimelineRef.current) {
        onPlacement(insertionIndex!);
      }

      setInsertionIndex(null);
      if (!droppedOnTimelineRef.current) {
        draggedCardRef.current = null;
      }
    },
    [insertionIndex, onPlacement, isAnimating]
  );

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setInsertionIndex(null);
    draggedCardRef.current = null;
  }, []);

  return {
    state: {
      isDragging,
      insertionIndex,
      isOverHand,
      isOverTimeline,
    },
    handlers: {
      handleDragStart,
      handleDragMove,
      handleDragOver,
      handleDragEnd,
      handleDragCancel,
    },
    droppedOnTimelineRef,
    draggedCardRef,
  };
}
