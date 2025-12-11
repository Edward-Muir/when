import { useEffect } from 'react';
import { useWhenGame } from './hooks/useWhenGame';
import { GameConfig } from './types';
import ModeSelect from './components/ModeSelect';
import Game from './components/Game';

function App() {
  // Set CSS custom property for viewport height (fallback for older browsers without dvh support)
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(setVh, 100);
    });

    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);

  const {
    state,
    allEvents,
    startGame,
    placeCard,
    resetGame,
    restartGame,
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

  // Loading state or mode selection
  if (state.phase === 'loading' || state.phase === 'modeSelect') {
    return (
      <ModeSelect
        onStart={handleStart}
        isLoading={state.phase === 'loading'}
        allEvents={allEvents}
      />
    );
  }

  // Playing or Game Over - show game with timeline visible
  return (
    <Game
      state={state}
      onPlacement={placeCard}
      modalEvent={modalEvent}
      openModal={openModal}
      closeModal={closeModal}
      onRestart={restartGame}
      onNewGame={handlePlayAgain}
    />
  );
}

export default App;
