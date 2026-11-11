import { useState, useCallback, useRef } from 'react';
import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion';
import { DragStartEvent, DragEndEvent, DragOverEvent, DragMoveEvent } from '@dnd-kit/core';
import { HistoricalEvent, PlacementResult } from '../types';
import { useHaptics } from './useHaptics';

type HapticsType = ReturnType<typeof useHaptics>['haptics'];

interface UseDragAndDropProps {
  activeCard: HistoricalEvent | null;
  onPlacement: (index: number) => PlacementResult | null;
  isAnimating: boolean;
  haptics?: HapticsType;
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
  /** The carried card: where it was picked up, and its shape. Read by HandDragOverlay. */
  carry: DragCarry;
}

/** Pickup: a critically damped spring, mostly done in 165ms, settled by about 375ms, no overshoot. */
const PICKUP_SPRING = { type: 'spring' as const, stiffness: 520, damping: 45, mass: 1 };
/** The way home runs on dnd-kit's return flight; keep in step with HandDragOverlay's RETURN_*. */
const RETURN_TWEEN = {
  duration: 0.18,
  ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
};

export interface DragCarry {
  /** Where the hand card was grabbed and how big it was. */
  grabRef: React.MutableRefObject<DragGrab | null>;
  /**
   * The carried card's shape: 0 is the square in the hand, 1 the landscape row. Animated by
   * the hook, on pickup and on a return to the hand.
   */
  morph: MotionValue<number>;
}

/** The pickup, in the hand card's own box: the overlay grows its landscape card from here. */
export interface DragGrab {
  /** Pointer position inside the hand card. */
  x: number;
  y: number;
  /** The hand card's box in the viewport at pickup. */
  left: number;
  width: number;
  height: number;
}

function pointerOf(e: Event | null): { x: number; y: number } | null {
  if (!e) return null;
  if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
    const t = e.touches[0];
    return t ? { x: t.clientX, y: t.clientY } : null;
  }
  if (e instanceof MouseEvent) return { x: e.clientX, y: e.clientY };
  return null;
}

/** Marks the hand card's drag handle, so the pickup can measure the card it was made on. */
export const HAND_CARD_ATTR = 'data-hand-card';

/**
 * Measured off the card under the pointer, not dnd-kit's `active.rect`: that is filled in by an
 * effect, so on a pickup it is either empty (the first drag) or left over from the last one.
 */
function readGrab(event: DragStartEvent): DragGrab | null {
  const target = event.activatorEvent?.target;
  const card = target instanceof Element ? target.closest(`[${HAND_CARD_ATTR}]`) : null;
  const rect = card?.getBoundingClientRect() ?? event.active.rect.current.initial;
  if (!rect) return null;
  const p = pointerOf(event.activatorEvent);
  return {
    x: p ? p.x - rect.left : rect.width / 2,
    y: p ? p.y - rect.top : rect.height / 2,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function useDragAndDrop({
  activeCard,
  onPlacement,
  isAnimating,
  haptics,
}: UseDragAndDropProps): UseDragAndDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [isOverHand, setIsOverHand] = useState(false);
  const [isOverTimeline, setIsOverTimeline] = useState(false);
  const [yearPositions, setYearPositions] = useState<number[]>([]);

  const droppedOnTimelineRef = useRef(false);
  const draggedCardRef = useRef<HistoricalEvent | null>(null);
  const prevInsertionIndexRef = useRef<number | null>(null);
  const grabRef = useRef<DragGrab | null>(null);
  const morph = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  /** Send the carried card back to its square, unless motion is reduced (it never left 1). */
  const morphHome = useCallback(() => {
    if (!reduceMotion) animate(morph, 0, RETURN_TWEEN);
  }, [morph, reduceMotion]);

  const calculateInsertionFromPositions = useCallback(
    (pointerY: number, positions: number[]): number => {
      if (positions.length === 0) return 0;

      const insertionPoint = positions.findIndex((pos) => pointerY < pos);
      return insertionPoint === -1 ? positions.length : insertionPoint;
    },
    []
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      grabRef.current = readGrab(event);
      morph.stop();
      morph.set(reduceMotion ? 1 : 0);
      if (!reduceMotion) animate(morph, 1, PICKUP_SPRING);
      setIsDragging(true);
      setInsertionIndex(null);
      prevInsertionIndexRef.current = null;
      draggedCardRef.current = activeCard;

      // Haptic feedback: light tap to confirm card is grabbed
      haptics?.select();

      const yearElements = document.querySelectorAll('[data-timeline-year]');
      const positions = Array.from(yearElements).map((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      setYearPositions(positions);
    },
    [activeCard, haptics, morph, reduceMotion]
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

      // Haptic feedback: subtle pulse when crossing insertion boundaries
      if (newIndex !== prevInsertionIndexRef.current && prevInsertionIndexRef.current !== null) {
        haptics?.light();
      }
      prevInsertionIndexRef.current = newIndex;

      setInsertionIndex(newIndex);
    },
    [yearPositions, calculateInsertionFromPositions, haptics]
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

      // Haptic feedback: weighted "landing" feel when dropped on timeline
      if (droppedOnTimelineRef.current) {
        haptics?.drop();
      }

      setIsDragging(false);
      setIsOverHand(false);
      setIsOverTimeline(false);
      prevInsertionIndexRef.current = null;

      if (droppedOnTimelineRef.current) {
        onPlacement(insertionIndex!);
      }

      setInsertionIndex(null);
      if (!droppedOnTimelineRef.current) {
        draggedCardRef.current = null;
        morphHome();
      }
    },
    [insertionIndex, onPlacement, isAnimating, haptics, morphHome]
  );

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    // Same clean-up as handleDragEnd, and for the same reason: these are only ever written by
    // handleDragOver, so without this a cancel over the board would leave `isOverTimeline`
    // true into the NEXT drag — long enough for the ghost row and its rail extension to appear
    // before the pointer had been over the board at all.
    setIsOverHand(false);
    setIsOverTimeline(false);
    setInsertionIndex(null);
    draggedCardRef.current = null;
    prevInsertionIndexRef.current = null;
    morphHome();
  }, [morphHome]);

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
    carry: { grabRef, morph },
  };
}
