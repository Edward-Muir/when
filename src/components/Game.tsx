import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
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
import { WhenGameState, PlacementResult, HistoricalEvent, GamePopupData } from '../types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useScreenShake } from '../hooks/useScreenShake';
import { useHaptics } from '../hooks/useHaptics';
import Timeline from './Timeline/Timeline';
import GamePopup from './GamePopup';
import Card from './Card';
import { Toast } from './Toast';
import { GameInfoCompact } from './PlayerInfo';
import TopBar from './TopBar';
import GameOverControls from './GameOverControls';
import ActiveCardDisplay from './ActiveCardDisplay';

interface GameProps {
  state: WhenGameState;
  onPlacement: (index: number) => PlacementResult | null;
  onCycleHand: () => void;
  pendingPopup: GamePopupData | null;
  showDescriptionPopup: (event: HistoricalEvent) => void;
  dismissPopup: () => void;
  onRestart: () => void;
  onNewGame: () => void;
}

const Game: React.FC<GameProps> = ({
  state,
  onPlacement,
  onCycleHand,
  pendingPopup,
  showDescriptionPopup,
  dismissPopup,
  onRestart,
  onNewGame,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [newEventName, setNewEventName] = useState<string | undefined>(undefined);
  const [showToast, setShowToast] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  // Game feel hooks
  const { shakeClassName, triggerShake } = useScreenShake();
  const { haptics } = useHaptics();

  // Track previous placement result to detect changes
  const prevPlacementRef = useRef(state.lastPlacementResult);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const activeCard = currentPlayer?.hand[0] || null;

  const { setNodeRef: setBottomBarRef } = useDroppable({ id: 'bottom-bar-zone' });

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
    haptics,
  });

  useEffect(() => {
    if (state.lastPlacementResult && state.lastPlacementResult !== prevPlacementRef.current) {
      if (state.lastPlacementResult.success) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        haptics.success();
      } else {
        triggerShake('medium');
        haptics.error();
      }
      setNewEventName(state.lastPlacementResult.event.name);
      setTimeout(() => setNewEventName(undefined), 1000);
    }
    prevPlacementRef.current = state.lastPlacementResult;
  }, [state.lastPlacementResult, haptics, triggerShake]);

  const handleActiveCardTap = () => {
    if (activeCard) {
      showDescriptionPopup(activeCard);
    }
  };

  const handleTimelineCardTap = (event: HistoricalEvent) => {
    showDescriptionPopup(event);
  };

  // Determine if we should show the year in the popup (only for cards in timeline)
  const showYearInPopup =
    pendingPopup?.type === 'description'
      ? state.timeline.some((e) => e.name === pendingPopup.event.name)
      : true; // Always show year for correct/incorrect popups

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
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
        <div
          className={`h-dvh min-h-screen-safe flex flex-col bg-light-bg dark:bg-dark-bg overflow-hidden pt-14 transition-colors ${shakeClassName}`}
        >
          <TopBar
            showHome={true}
            onHomeClick={() => setShowHomeConfirm(true)}
            gameMode={state.gameMode}
          />

          {showConfetti && (
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50">
              <ConfettiExplosion force={0.6} duration={2200} particleCount={50} width={300} />
            </div>
          )}

          {/* Main Timeline Area - takes remaining space */}
          <div className="flex-1 overflow-hidden">
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

          {/* Bottom Bar - Fixed height with game info + active card aligned with timeline */}
          <div
            ref={setBottomBarRef}
            className={`h-[120px] sm:h-[140px] flex items-center border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg z-40 pb-safe transition-colors duration-200 ${
              dragState.isOverHand ? 'bg-accent/10 dark:bg-accent-dark/10' : ''
            }`}
          >
            {state.phase === 'gameOver' ? (
              /* Game Over: Full-width horizontal buttons */
              <GameOverControls
                state={state}
                onRestart={onRestart}
                onNewGame={onNewGame}
                onShowToast={() => setShowToast(true)}
              />
            ) : (
              <>
                {/* Left: Game Info - matches year column width (96px) */}
                <div className="w-24 shrink-0 flex items-center justify-center">
                  <GameInfoCompact
                    currentPlayer={currentPlayer}
                    isMultiplayer={state.players.length > 1}
                  />
                </div>

                {/* Right: Active Card Area - aligned with timeline cards */}
                {activeCard && (
                  <ActiveCardDisplay
                    activeCard={activeCard}
                    currentPlayer={currentPlayer}
                    isAnimating={state.isAnimating}
                    isOverTimeline={dragState.isOverTimeline}
                    onCycleHand={onCycleHand}
                    onCardTap={handleActiveCardTap}
                  />
                )}
              </>
            )}
          </div>

          {createPortal(
            <DragOverlay dropAnimation={droppedOnTimelineRef.current ? null : undefined}>
              {draggedCardRef.current ? (
                <div className="dragging-card" style={{ transform: 'scale(1.05)' }}>
                  <Card event={draggedCardRef.current} size="landscape" />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}

          {pendingPopup && (
            <GamePopup
              type={pendingPopup.type}
              event={pendingPopup.event}
              onDismiss={dismissPopup}
              nextPlayer={pendingPopup.nextPlayer}
              showYear={showYearInPopup}
            />
          )}

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
    </motion.div>
  );
};

export default Game;
