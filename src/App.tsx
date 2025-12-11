import React from 'react';
import { useWhenGame } from './hooks/useWhenGame';
import { GameConfig } from './types';
import StartScreen from './components/StartScreen';
import Game from './components/Game';
import GameOver from './components/GameOver';

function App() {
  const {
    state,
    allEvents,
    startGame,
    placeCard,
    resetGame,
    modalEvent,
    openModal,
    closeModal,
  } = useWhenGame();

  const handleStart = (config: GameConfig) => {
    startGame(config);
  };

  const handlePlayAgain = () => {
    resetGame();
  };

  // Loading state
  if (state.phase === 'loading') {
    return (
      <StartScreen onStart={handleStart} isLoading={true} allEvents={allEvents} />
    );
  }

  // Ready to start
  if (state.phase === 'ready') {
    return (
      <StartScreen onStart={handleStart} allEvents={allEvents} />
    );
  }

  // Game over
  if (state.phase === 'gameOver') {
    return (
      <GameOver
        score={state.correctPlacements}
        total={state.totalTurns}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // Playing
  return (
    <Game
      state={state}
      onPlacement={placeCard}
      modalEvent={modalEvent}
      openModal={openModal}
      closeModal={closeModal}
    />
  );
}

export default App;
