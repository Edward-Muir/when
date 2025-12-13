import { useState, useEffect, useCallback } from 'react';
import ConfettiExplosion from 'react-confetti-explosion';
import { RotateCcw, Home, Share2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
  pointerWithin,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { WhenGameState, PlacementResult, HistoricalEvent } from '../types';
import DraggableCard from './DraggableCard';
import Timeline from './Timeline/Timeline';
import EventModal from './EventModal';
import TurnBanner from './TurnBanner';
import Card from './Card';

interface GameProps {
  state: WhenGameState;
  onPlacement: (index: number) => PlacementResult | null;
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
  onRestart: () => void;
  onNewGame: () => void;
}

const Game: React.FC<GameProps> = ({
  state,
  onPlacement,
  modalEvent,
  openModal,
  closeModal,
  onRestart,
  onNewGame,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [newEventName, setNewEventName] = useState<string | undefined>(undefined);
  const [showTurnBanner, setShowTurnBanner] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [isOverHand, setIsOverHand] = useState(false);
  const [yearPositions, setYearPositions] = useState<number[]>([]); // Captured at drag start

  // Make the hand area a drop zone so card can be returned
  const { setNodeRef: setHandDropRef } = useDroppable({
    id: 'hand-zone',
  });

  // Configure sensors for touch + pointer
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 8,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  // Handle placement result animations
  useEffect(() => {
    if (state.lastPlacementResult) {
      if (state.lastPlacementResult.success) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      } else {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 400);
      }

      setNewEventName(state.lastPlacementResult.event.name);
      setTimeout(() => setNewEventName(undefined), 1000);

      if (state.phase !== 'gameOver') {
        setShowTurnBanner(true);
      }
    }
  }, [state.lastPlacementResult, state.phase]);

  const handleDismissTurnBanner = useCallback(() => {
    setShowTurnBanner(false);
  }, []);

  // Calculate insertion index from pointer Y against pre-captured year positions
  const calculateInsertionFromPositions = useCallback((pointerY: number, positions: number[]): number => {
    if (positions.length === 0) return 0;

    // Scan top-to-bottom: insert before the first year whose center is below pointer
    for (let i = 0; i < positions.length; i++) {
      if (pointerY < positions[i]) {
        return i;
      }
    }

    // Pointer is below all years, insert at end
    return positions.length;
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setIsDragging(true);
    setInsertionIndex(null);

    // Capture year positions NOW - they won't change during drag (scroll is disabled)
    const yearElements = document.querySelectorAll('[data-timeline-year]');
    const positions = Array.from(yearElements).map(el => {
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2; // Center Y of each year
    });
    setYearPositions(positions);
  }, []);

  // Continuous position tracking during drag
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // Get the initial pointer position from activator event
    const activatorEvent = event.activatorEvent;
    let initialY: number;

    if (activatorEvent instanceof TouchEvent) {
      initialY = activatorEvent.touches[0]?.clientY ?? 0;
    } else if (activatorEvent instanceof MouseEvent || activatorEvent instanceof PointerEvent) {
      initialY = activatorEvent.clientY;
    } else {
      return;
    }

    // Add delta to get current pointer position
    const pointerY = initialY + event.delta.y;

    // Calculate insertion index using pre-captured year positions
    const newIndex = calculateInsertionFromPositions(pointerY, yearPositions);
    setInsertionIndex(newIndex);
  }, [yearPositions, calculateInsertionFromPositions]);

  // handleDragOver now only tracks whether we're over the hand zone (for visual feedback)
  // Position calculation is handled by handleDragMove
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;

    if (!over) {
      setIsOverHand(false);
      return;
    }

    setIsOverHand(over.id === 'hand-zone');
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;

    setIsDragging(false);
    setIsOverHand(false);

    // Only place if dropped on timeline zone and we have a valid insertion index
    const isDropOnTimeline = over?.id === 'timeline-zone';
    if (isDropOnTimeline && insertionIndex !== null && !state.isAnimating) {
      onPlacement(insertionIndex);
    }
    // If dropped on hand zone or nowhere, card just snaps back (no action)

    setInsertionIndex(null);
  }, [insertionIndex, onPlacement, state.isAnimating]);

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setInsertionIndex(null);
  }, []);

  const handleActiveCardTap = () => {
    if (state.activeCard) {
      openModal(state.activeCard);
    }
  };

  const showYearInModal = modalEvent
    ? state.timeline.some((e) => e.name === modalEvent.name)
    : false;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div className={`h-dvh min-h-screen-safe flex flex-row bg-cream overflow-hidden pt-safe pb-safe ${screenShake ? 'animate-screen-shake' : ''}`}>
        {/* Confetti */}
        {showConfetti && (
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50">
            <ConfettiExplosion
              force={0.6}
              duration={2200}
              particleCount={50}
              width={300}
            />
          </div>
        )}

        {/* Left Panel - 40% - Game Info + Active Card (entire panel is drop zone) */}
        <div
          ref={setHandDropRef}
          className={`w-2/5 flex flex-col h-full p-3 border-r border-amber-200/50 transition-colors duration-200 ${isOverHand ? 'bg-amber-100/50' : ''}`}
        >
            {/* Game Info */}
            <div className="mb-4">
              <h1 className="text-sketch text-xl font-bold mb-1">When?</h1>
              <div className="text-sketch/70 text-sm">
                Turn {state.currentTurn}/{state.totalTurns}
              </div>
              <div className="text-amber-600 text-sm font-medium">
                Score: {state.correctPlacements}/{state.currentTurn > 0 ? state.currentTurn - 1 : 0}
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Active Card or Game Over Controls */}
            {state.phase === 'gameOver' ? (
              <div className="flex flex-col gap-2 pointer-events-auto">
                <button
                  onClick={() => console.log('Share clicked')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                {state.gameMode !== 'daily' && (
                  <button
                    onClick={onRestart}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restart
                  </button>
                )}

                <button
                  onClick={onNewGame}
                  className="w-full py-3 px-4 bg-paper border border-amber-300 hover:bg-amber-50 text-sketch text-sm font-medium rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>
            ) : (
              state.activeCard && (
                <div className="flex flex-col items-start gap-2 pb-2 pointer-events-auto">
                  <p className="text-sketch/60 text-xs">Drag to timeline:</p>
                  <div className="relative">
                    {/* Ghost card shows when hovering over hand zone */}
                    {isDragging && isOverHand && (
                      <div className="opacity-50 border-2 border-dashed border-amber-400 rounded-lg">
                        <Card event={state.activeCard} size="normal" />
                      </div>
                    )}
                    {/* Actual draggable card - hidden when ghost is showing */}
                    <div className={isDragging && isOverHand ? 'hidden' : ''}>
                      <DraggableCard
                        event={state.activeCard}
                        onTap={handleActiveCardTap}
                        lastResult={state.lastPlacementResult}
                        isAnimating={state.isAnimating}
                        disabled={state.isAnimating}
                      />
                    </div>
                  </div>
                  <p className="text-sketch/40 text-xs">{isDragging && isOverHand ? 'Release to cancel' : 'Tap for details'}</p>
                </div>
              )
            )}
        </div>

        {/* Right Panel - 60% - Timeline */}
        <div className="w-3/5 h-full">
          <Timeline
            events={state.timeline}
            onEventTap={openModal}
            newEventName={newEventName}
            isDragging={isDragging}
            insertionIndex={insertionIndex}
            draggedCard={state.activeCard}
          />
        </div>

        {/* Drag Overlay - The card that follows your finger */}
        <DragOverlay>
          {isDragging && state.activeCard ? (
            <div
              className="dragging-card"
              style={{
                transform: 'scale(1.05)',
              }}
            >
              <Card event={state.activeCard} size="normal" />
            </div>
          ) : null}
        </DragOverlay>

        {/* Event Modal */}
        {modalEvent && (
          <EventModal
            event={modalEvent}
            onClose={closeModal}
            showYear={showYearInModal}
          />
        )}

        {/* Turn Banner */}
        {showTurnBanner && state.lastPlacementResult && (
          <TurnBanner
            placementResult={state.lastPlacementResult}
            nextPlayerName={null}
            onDismiss={handleDismissTurnBanner}
          />
        )}
      </div>
    </DndContext>
  );
};

export default Game;
