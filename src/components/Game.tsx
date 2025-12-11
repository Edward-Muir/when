import React, { useState, useEffect } from 'react';
import ConfettiExplosion from 'react-confetti-explosion';
import { WhenGameState, PlacementResult, HistoricalEvent } from '../types';
import Header from './Header';
import ActiveCard from './ActiveCard';
import Timeline from './Timeline/Timeline';
import EventModal from './EventModal';

interface GameProps {
  state: WhenGameState;
  onPlacement: (index: number) => PlacementResult | null;
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
}

const Game: React.FC<GameProps> = ({
  state,
  onPlacement,
  modalEvent,
  openModal,
  closeModal,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [newEventName, setNewEventName] = useState<string | undefined>(undefined);

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

      // Track the new event for animation
      setNewEventName(state.lastPlacementResult.event.name);
      setTimeout(() => setNewEventName(undefined), 1000);
    }
  }, [state.lastPlacementResult]);

  const handlePlacement = (index: number) => {
    if (state.isAnimating) return;
    onPlacement(index);
  };

  const handleActiveCardTap = () => {
    if (state.activeCard) {
      openModal(state.activeCard);
    }
  };

  // Determine if the modal should show the year (only for timeline events, not active card)
  const showYearInModal = modalEvent
    ? state.timeline.some((e) => e.name === modalEvent.name)
    : false;

  return (
    <div className={`h-screen flex flex-row bg-cream ${screenShake ? 'animate-screen-shake' : ''}`}>
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

      {/* Left Panel: Game Info + Active Card */}
      <div className="w-2/5 flex flex-col h-full p-3 border-r border-amber-200/50">
        {/* Header/Game Info */}
        <Header
          currentTurn={state.currentTurn}
          totalTurns={state.totalTurns}
          correctPlacements={state.correctPlacements}
        />

        {/* Spacer to push active card to bottom */}
        <div className="flex-1" />

        {/* Active Card Area */}
        {state.activeCard && (
          <ActiveCard
            event={state.activeCard}
            onTap={handleActiveCardTap}
            lastResult={state.lastPlacementResult}
            isAnimating={state.isAnimating}
          />
        )}
      </div>

      {/* Right Panel: Timeline */}
      <div className="w-3/5 h-full">
        <Timeline
          events={state.timeline}
          onPlacement={handlePlacement}
          onEventTap={openModal}
          disabled={state.isAnimating}
          newEventName={newEventName}
        />
      </div>

      {/* Event Modal */}
      {modalEvent && (
        <EventModal
          event={modalEvent}
          onClose={closeModal}
          showYear={showYearInModal}
        />
      )}
    </div>
  );
};

export default Game;
