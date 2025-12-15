import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import ConfettiExplosion from 'react-confetti-explosion';
import { RotateCcw, Home, Share2, Sun, Moon, Check, X, Trophy, Flag } from 'lucide-react';
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
import { formatYear } from '../utils/gameLogic';
import { shareResults } from '../utils/share';
import DraggableCard from './DraggableCard';
import Timeline from './Timeline/Timeline';
import ExpandedCard from './ExpandedCard';
import Card from './Card';
import { Toast } from './Toast';
import PlayerInfo from './PlayerInfo';
import { useTheme } from '../hooks/useTheme';

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
  const { isDark, toggleTheme } = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [newEventName, setNewEventName] = useState<string | undefined>(undefined);
  const [showToast, setShowToast] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  // Get active card from current player's hand
  const currentPlayer = state.players[state.currentPlayerIndex];
  const activeCard = currentPlayer?.hand[0] || null;

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [isOverHand, setIsOverHand] = useState(false);
  const [isOverTimeline, setIsOverTimeline] = useState(false);
  const [yearPositions, setYearPositions] = useState<number[]>([]); // Captured at drag start
  const droppedOnTimelineRef = useRef(false); // Track if last drop was on timeline (for animation)
  const draggedCardRef = useRef<HistoricalEvent | null>(null); // Store dragged card for DragOverlay

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
      }

      setNewEventName(state.lastPlacementResult.event.name);
      setTimeout(() => setNewEventName(undefined), 1000);
    }
  }, [state.lastPlacementResult]);

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

    // Store the card being dragged so DragOverlay can render it even after activeCard becomes null
    draggedCardRef.current = activeCard;

    // Capture year positions NOW - they won't change during drag (scroll is disabled)
    const yearElements = document.querySelectorAll('[data-timeline-year]');
    const positions = Array.from(yearElements).map(el => {
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2; // Center Y of each year
    });
    setYearPositions(positions);
  }, [activeCard]);

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

  // handleDragOver tracks which zone we're over (for visual feedback)
  // Position calculation is handled by handleDragMove
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;

    if (!over) {
      setIsOverHand(false);
      setIsOverTimeline(false);
      return;
    }

    setIsOverHand(over.id === 'hand-zone');
    setIsOverTimeline(over.id === 'timeline-zone');
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;
    const isDropOnTimeline = over?.id === 'timeline-zone';

    // Track if dropped on timeline (for DragOverlay animation)
    droppedOnTimelineRef.current = isDropOnTimeline && insertionIndex !== null && !state.isAnimating;

    setIsDragging(false);
    setIsOverHand(false);
    setIsOverTimeline(false);

    // Only place if dropped on timeline zone and we have a valid insertion index
    if (droppedOnTimelineRef.current) {
      onPlacement(insertionIndex!);
    }
    // If dropped on hand zone or nowhere, card just snaps back (no action)

    setInsertionIndex(null);
    // Only clear ref if NOT dropping on timeline (for snap-back animation)
    // When dropping on timeline, dropAnimation=null makes card disappear instantly
    if (!droppedOnTimelineRef.current) {
      draggedCardRef.current = null;
    }
  }, [insertionIndex, onPlacement, state.isAnimating]);

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setInsertionIndex(null);
    draggedCardRef.current = null;
  }, []);

  const handleActiveCardTap = () => {
    if (activeCard) {
      openModal(activeCard);
    }
  };

  const handleTimelineCardTap = (event: HistoricalEvent) => {
    openModal(event);
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
      <div className="h-dvh min-h-screen-safe flex flex-row bg-light-bg dark:bg-dark-bg overflow-hidden pt-safe pb-safe transition-colors">
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

        {/* Top-right controls */}
        <div className="absolute top-2 right-2 flex gap-2 z-40">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-6 h-6 text-accent dark:text-accent-dark" />
            ) : (
              <Moon className="w-6 h-6 text-accent dark:text-accent-dark" />
            )}
          </button>
          <button
            onClick={() => setShowHomeConfirm(true)}
            className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border transition-colors"
            aria-label="Go home"
          >
            <Home className="w-6 h-6 text-accent dark:text-accent-dark" />
          </button>
        </div>

        {/* Left Panel - 40% - Game Info + Active Card (entire panel is drop zone) */}
        <div
          ref={setHandDropRef}
          className={`w-2/5 flex flex-col h-full p-3 transition-colors duration-200 z-10 ${isOverHand ? 'bg-accent/10 dark:bg-accent-dark/10' : ''}`}
        >
            {/* Game Info */}
            <div className="mb-4">
              <h1 className="text-light-text dark:text-dark-text text-ui-title mb-3 font-display">When?</h1>

              {/* Player Info */}
              <PlayerInfo
                players={state.players}
                currentPlayerIndex={state.currentPlayerIndex}
                turnNumber={state.turnNumber}
                roundNumber={state.roundNumber}
                gameMode={state.gameMode}
              />

              {/* Result/Winner/Stats Banner */}
              {state.phase === 'gameOver' ? (
                // Game over banners
                state.gameMode === 'suddenDeath' && state.players.length === 1 && state.winners.length === 0 ? (
                  // Single-player sudden death: Game Over (loss)
                  <div className="mt-3 p-3 rounded-xl border-2 animate-banner-in bg-error/15 border-error/50 dark:bg-error/25 dark:border-error/60">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-error text-white">
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </div>
                      <span className="font-semibold text-lg leading-none text-error">
                        Game Over
                      </span>
                    </div>
                    <div className="text-ui-caption text-light-muted dark:text-dark-muted mt-2">
                      Streak: {state.placementHistory.filter(p => p).length} correct
                    </div>
                  </div>
                ) : (state.players.length > 1 || state.gameMode === 'suddenDeath') && state.winners.length > 0 ? (
                  // Multiplayer/Sudden Death: Winner banner
                  <div className="mt-3 p-3 rounded-xl border-2 animate-banner-in bg-success/15 border-success/50 dark:bg-success/25 dark:border-success/60">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-success text-white">
                        <Trophy className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </div>
                      <span className="font-semibold text-lg leading-none text-success">
                        {state.winners.length === 1 ? 'Winner!' : 'Winners!'}
                      </span>
                    </div>
                    <div className="text-ui-caption text-light-muted dark:text-dark-muted mt-2">
                      {state.winners.map(w => w.name).join(', ')}
                    </div>
                  </div>
                ) : state.players.length === 1 && state.gameMode !== 'suddenDeath' ? (
                  // Single player: Completion stats banner
                  <div className="mt-3 p-3 rounded-xl border-2 animate-banner-in bg-accent/15 border-accent/50 dark:bg-accent-dark/25 dark:border-accent-dark/60">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-accent dark:bg-accent-dark text-white">
                        <Flag className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </div>
                      <span className="font-semibold text-lg leading-none text-accent dark:text-accent-dark">
                        Complete!
                      </span>
                    </div>
                    <div className="text-ui-caption text-light-muted dark:text-dark-muted mt-2">
                      {state.roundNumber} {state.roundNumber === 1 ? 'round' : 'rounds'} · {state.placementHistory.filter(p => p).length}/{state.placementHistory.length} correct
                    </div>
                  </div>
                ) : null
              ) : state.lastPlacementResult && (
                // During gameplay: placement feedback
                <div className={`mt-3 p-3 rounded-xl border-2 animate-banner-in ${
                  state.lastPlacementResult.success
                    ? 'bg-success/15 border-success/50 dark:bg-success/25 dark:border-success/60'
                    : 'bg-error/15 border-error/50 dark:bg-error/25 dark:border-error/60'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      state.lastPlacementResult.success
                        ? 'bg-success text-white'
                        : 'bg-error text-white'
                    }`}>
                      {state.lastPlacementResult.success
                        ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        : <X className="w-3.5 h-3.5" strokeWidth={3} />
                      }
                    </div>
                    <span className={`font-semibold text-lg leading-none ${
                      state.lastPlacementResult.success
                        ? 'text-success dark:text-success'
                        : 'text-error dark:text-error'
                    }`}>
                      {state.lastPlacementResult.success ? 'Correct!' : 'Wrong!'}
                    </span>
                  </div>
                  <div className="text-ui-caption text-light-muted dark:text-dark-muted mt-2">
                    {state.lastPlacementResult.event.friendly_name} ({formatYear(state.lastPlacementResult.event.year)})
                  </div>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Active Card or Game Over Controls */}
            {state.phase === 'gameOver' ? (
              <div className="flex flex-col gap-2 pointer-events-auto">
                <button
                  onClick={async () => {
                    const showClipboardToast = await shareResults(state);
                    if (showClipboardToast) {
                      setShowToast(true);
                    }
                  }}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 font-body"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                {state.gameMode !== 'daily' && (
                  <button
                    onClick={onRestart}
                    className="w-full py-3 px-4 bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 font-body"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restart
                  </button>
                )}

                <button
                  onClick={onNewGame}
                  className="w-full py-3 px-4 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-border/50 dark:hover:bg-dark-border/50 text-light-text dark:text-dark-text text-sm font-medium rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 font-body"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>


              </div>
            ) : (
              activeCard && (
                <div className="relative flex flex-col items-start gap-2 pb-2 pointer-events-auto">
                  <p className="text-light-muted dark:text-dark-muted text-ui-label font-body">
                    {state.players.length > 1 ? `${currentPlayer?.name}'s turn:` : 'Drag to timeline:'}
                  </p>
                  <div className="p-1 rounded-xl bg-light-border/50 dark:bg-dark-border/100">
                    <DraggableCard
                      event={activeCard}
                      onTap={handleActiveCardTap}
                      disabled={state.isAnimating}
                      isOverTimeline={isOverTimeline}
                      isHidden={state.isAnimating}
                    />
                  </div>
                  <p className="text-light-muted/60 dark:text-dark-muted/60 text-ui-caption font-body">{isDragging && isOverHand ? 'Release to cancel' : 'Tap for details'}</p>
                </div>
              )
            )}
        </div>

        {/* Right Panel - 60% - Timeline */}
        <div className="w-3/5 h-full">
          <Timeline
            events={state.timeline}
            onEventTap={handleTimelineCardTap}
            newEventName={newEventName}
            isDragging={isDragging}
            insertionIndex={insertionIndex}
            draggedCard={activeCard}
            isOverTimeline={isOverTimeline}
            lastPlacementResult={state.lastPlacementResult}
            animationPhase={state.animationPhase}
          />
        </div>

        {/* Drag Overlay - The card that follows your finger */}
        {/* Portal to document.body to fix React 19 positioning issue */}
        {createPortal(
          <DragOverlay dropAnimation={droppedOnTimelineRef.current ? null : undefined}>
            {draggedCardRef.current ? (
              <div
                className="dragging-card"
                style={{
                  transform: 'scale(1.05)',
                }}
              >
                <Card event={draggedCardRef.current} size="normal" />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}

        {/* Expanded Card */}
        <ExpandedCard
          event={modalEvent}
          onClose={closeModal}
          showYear={showYearInModal}
        />

        {/* Toast */}
        <Toast
          message="Copied to clipboard!"
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />

        {/* Home Confirmation Dialog */}
        {showHomeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={() => setShowHomeConfirm(false)} />
            <div className="relative bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <h2 className="text-lg font-display text-light-text dark:text-dark-text mb-2">Leave game?</h2>
              <p className="text-light-muted dark:text-dark-muted text-sm mb-6 font-body">
                Your current progress will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHomeConfirm(false)}
                  className="flex-1 py-3 px-4 bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text rounded-xl font-medium transition-colors hover:bg-light-border/80 dark:hover:bg-dark-border/80 active:scale-95 font-body"
                >
                  Cancel
                </button>
                <button
                  onClick={onNewGame}
                  className="flex-1 py-3 px-4 bg-accent dark:bg-accent-dark text-white rounded-xl font-medium transition-colors hover:bg-accent/90 dark:hover:bg-accent-dark/90 active:scale-95 font-body"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default Game;
