import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWhenGame } from './hooks/useWhenGame';
import { GameConfig } from './types';
import ModeSelect from './components/ModeSelect';
import Game from './components/Game';
import GameStartTransition from './components/GameStartTransition';
import ViewTimeline from './components/ViewTimeline';

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
    completeTransition,
    placeCard,
    cycleHand,
    resetGame,
    restartGame,
    viewTimeline,
    pendingPopup,
    showDescriptionPopup,
    showGameOverPopup,
    dismissPopup,
  } = useWhenGame();

  const handleStart = (config: GameConfig) => {
    startGame(config);
  };

  const handlePlayAgain = () => {
    resetGame();
  };

  // All phases wrapped in AnimatePresence for smooth transitions
  return (
    <AnimatePresence mode="wait">
      {(state.phase === 'loading' || state.phase === 'modeSelect') && (
        <ModeSelect
          key="modeSelect"
          onStart={handleStart}
          onViewTimeline={viewTimeline}
          isLoading={state.phase === 'loading'}
          allEvents={allEvents}
        />
      )}
      {state.phase === 'viewTimeline' && (
        <ViewTimeline key="viewTimeline" allEvents={allEvents} onHomeClick={resetGame} />
      )}
      {state.phase === 'transitioning' && (
        <GameStartTransition
          key="transition"
          onComplete={completeTransition}
          allEvents={allEvents}
        />
      )}
      {(state.phase === 'playing' || state.phase === 'gameOver') && (
        <Game
          key="game"
          state={state}
          onPlacement={placeCard}
          onCycleHand={cycleHand}
          pendingPopup={pendingPopup}
          showDescriptionPopup={showDescriptionPopup}
          showGameOverPopup={showGameOverPopup}
          dismissPopup={dismissPopup}
          onRestart={restartGame}
          onNewGame={handlePlayAgain}
        />
      )}
    </AnimatePresence>
  );
}

export default App;
