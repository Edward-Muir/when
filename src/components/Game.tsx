import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ConfettiExplosion from 'react-confetti-explosion';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { JsonCvPointerSensor, JsonCvTouchSensor } from '../utils/dndSensors';
import { WhenGameState, PlacementResult, HistoricalEvent } from '../types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import Timeline from './Timeline/Timeline';
import ExpandedCard from './ExpandedCard';
import Card from './Card';
import { Toast } from './Toast';
import PlayerInfo from './PlayerInfo';
import TopBar from './TopBar';
import ResultBanner from './ResultBanner';
import GameOverControls from './GameOverControls';
import ActiveCardDisplay from './ActiveCardDisplay';

interface GameProps {
  state: WhenGameState;
  onPlacement: (index: number) => PlacementResult | null;
  onCycleHand: () => void;
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
  onRestart: () => void;
  onNewGame: () => void;
}

const Game: React.FC<GameProps> = ({
  state,
  onPlacement,
  onCycleHand,
  modalEvent,
  openModal,
  closeModal,
  onRestart,
  onNewGame,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [newEventName, setNewEventName] = useState<string | undefined>(undefined);
  const [showToast, setShowToast] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const activeCard = currentPlayer?.hand[0] || null;

  const { setNodeRef: setHandDropRef } = useDroppable({ id: 'hand-zone' });

  const pointerSensor = useSensor(JsonCvPointerSensor, {
    activationConstraint: { distance: 8 },
  });

  const touchSensor = useSensor(JsonCvTouchSensor, {
    activationConstraint: { delay: 100, tolerance: 8 },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  const {
    state: dragState,
    handlers: dragHandlers,
    droppedOnTimelineRef,
    draggedCardRef,
  } = useDragAndDrop({
    activeCard,
    onPlacement,
    isAnimating: state.isAnimating,
  });

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
      onDragStart={dragHandlers.handleDragStart}
      onDragMove={dragHandlers.handleDragMove}
      onDragOver={dragHandlers.handleDragOver}
      onDragEnd={dragHandlers.handleDragEnd}
      onDragCancel={dragHandlers.handleDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div className="h-dvh min-h-screen-safe flex flex-row bg-light-bg dark:bg-dark-bg overflow-hidden pt-14 pb-safe transition-colors">
        <TopBar showHome={true} onHomeClick={() => setShowHomeConfirm(true)} />

        {showConfetti && (
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50">
            <ConfettiExplosion force={0.6} duration={2200} particleCount={50} width={300} />
          </div>
        )}

        {/* Left Panel - 40% - Game Info + Active Card */}
        <div
          ref={setHandDropRef}
          className={`w-2/5 flex flex-col h-full p-3 transition-colors duration-200 z-40 ${
            dragState.isOverHand ? 'bg-accent/10 dark:bg-accent-dark/10' : ''
          }`}
        >
          <div className="mb-4">
            <h1 className="text-light-text dark:text-dark-text text-ui-title mb-3 font-display">
              When?
            </h1>

            <PlayerInfo
              players={state.players}
              currentPlayerIndex={state.currentPlayerIndex}
              turnNumber={state.turnNumber}
              roundNumber={state.roundNumber}
            />

            <ResultBanner
              phase={state.phase}
              gameMode={state.gameMode}
              lastPlacementResult={state.lastPlacementResult}
              players={state.players}
              winners={state.winners}
              placementHistory={state.placementHistory}
              roundNumber={state.roundNumber}
            />
          </div>

          <div className="flex-1" />

          {state.phase === 'gameOver' ? (
            <GameOverControls
              state={state}
              onRestart={onRestart}
              onNewGame={onNewGame}
              onShowToast={() => setShowToast(true)}
            />
          ) : (
            activeCard && (
              <ActiveCardDisplay
                activeCard={activeCard}
                currentPlayer={currentPlayer}
                playersCount={state.players.length}
                isAnimating={state.isAnimating}
                isOverTimeline={dragState.isOverTimeline}
                onCycleHand={onCycleHand}
                onCardTap={handleActiveCardTap}
              />
            )
          )}
        </div>

        {/* Right Panel - 60% - Timeline */}
        <div className="w-3/5 h-full">
          <Timeline
            events={state.timeline}
            onEventTap={handleTimelineCardTap}
            newEventName={newEventName}
            isDragging={dragState.isDragging}
            insertionIndex={dragState.insertionIndex}
            draggedCard={activeCard}
            isOverTimeline={dragState.isOverTimeline}
            lastPlacementResult={state.lastPlacementResult}
            animationPhase={state.animationPhase}
          />
        </div>

        {createPortal(
          <DragOverlay dropAnimation={droppedOnTimelineRef.current ? null : undefined}>
            {draggedCardRef.current ? (
              <div className="dragging-card" style={{ transform: 'scale(1.05)' }}>
                <Card event={draggedCardRef.current} size="normal" />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}

        <ExpandedCard event={modalEvent} onClose={closeModal} showYear={showYearInModal} />

        <Toast
          message="Copied to clipboard!"
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />

        {showHomeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 dark:bg-black/70"
              onClick={() => setShowHomeConfirm(false)}
            />
            <div className="relative bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-6 max-w-sm w-full">
              <h2 className="text-lg font-display text-light-text dark:text-dark-text mb-2">
                Leave game?
              </h2>
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
