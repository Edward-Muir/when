import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useWhenGame } from './hooks/useWhenGame';
import { GameConfig } from './types';
import { buildDailyConfig } from './utils/dailyConfig';
import { hasPlayedToday } from './utils/playerStorage';
import ModeSelect from './components/ModeSelect';
import Game from './components/Game';
import GameStartTransition from './components/GameStartTransition';
import ViewTimeline from './components/ViewTimeline';

interface AppProps {
  autoStartDaily?: boolean;
  onNavigateHome?: () => void;
}

function App({ autoStartDaily = false, onNavigateHome }: AppProps) {
  // Set CSS custom property for viewport height (fallback for older browsers without dvh support)
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    const handleOrientationChange = () => {
      setTimeout(setVh, 100);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Capacitor lifecycle: dispatch events so hooks can pause/resume background work
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listeners = Promise.all([
      CapApp.addListener('pause', () => {
        window.dispatchEvent(new Event('appPause'));
      }),
      CapApp.addListener('resume', () => {
        window.dispatchEvent(new Event('appResume'));
      }),
    ]);

    return () => {
      listeners.then((handles) => handles.forEach((h) => h.remove()));
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

  // Auto-start daily game when accessed via /daily route
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (!autoStartDaily || hasAutoStarted.current) return;
    if (state.phase !== 'modeSelect') return; // Wait for events to load

    hasAutoStarted.current = true;

    if (hasPlayedToday()) {
      onNavigateHome?.();
      return;
    }

    startGame(buildDailyConfig());
  }, [autoStartDaily, state.phase, startGame, onNavigateHome]);

  const handleStart = (config: GameConfig) => {
    startGame(config);
  };

  const handlePlayAgain = () => {
    resetGame();
    onNavigateHome?.();
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
