import React from 'react';
import { useWhenGame } from './hooks/useWhenGame';
import StartScreen from './components/StartScreen';
import Game from './components/Game';
import GameOver from './components/GameOver';

function App() {
  const {
    state,
    startGame,
    placeCard,
    resetGame,
    modalEvent,
    openModal,
    closeModal,
  } = useWhenGame();

  const handleStart = () => {
    startGame(8); // 8 turns
  };

  const handlePlayAgain = () => {
    resetGame();
  };

  // Loading state
  if (state.phase === 'loading') {
    return (
      <StartScreen onStart={handleStart} isLoading={true} />
    );
  }

  // Ready to start
  if (state.phase === 'ready') {
    return (
      <StartScreen onStart={handleStart} />
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
