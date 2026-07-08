import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useNavigate } from 'react-router-dom';
import { isDailyReminderSupported, resyncDailyReminders } from './utils/dailyReminder';
import { useWhenGame } from './hooks/useWhenGame';
import { useImagePrefetch } from './hooks/useImagePrefetch';
import { pickIntroEvents } from './utils/introEvents';
import { GameConfig, HistoricalEvent } from './types';
import { buildDailyConfig } from './utils/dailyConfig';
import { hasPlayedToday } from './utils/playerStorage';
import { ChallengeConfig, challengeConfigToGameConfig } from './utils/challengeCode';
import ModeSelect from './components/ModeSelect';
import Game from './components/Game';
import GameStartTransition from './components/GameStartTransition';

interface AppProps {
  autoStartDaily?: boolean;
  autoStartChallenge?: ChallengeConfig;
  challengeCode?: string;
  onNavigateHome?: () => void;
}

function App({
  autoStartDaily = false,
  autoStartChallenge,
  challengeCode,
  onNavigateHome,
}: AppProps) {
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

  // Daily reminder: top up the rolling 8am notification window on launch and
  // resume, and deep-link notification taps to /daily. No-op on web and in app
  // shells that predate the LocalNotifications plugin.
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(() => {
    if (!isDailyReminderSupported()) return;

    resyncDailyReminders();
    const onResume = () => resyncDailyReminders();
    window.addEventListener('appResume', onResume);

    // Cold-start taps are retained by the plugin and delivered once this registers.
    const tapListener = LocalNotifications.addListener('localNotificationActionPerformed', () => {
      navigateRef.current('/daily');
    });

    return () => {
      window.removeEventListener('appResume', onResume);
      tapListener.then((h) => h.remove());
    };
  }, []);

  // Native only: lock zoom. WKWebView honors these constraints (Safari ignores
  // them for accessibility), so the web keeps pinch-to-zoom while the app can't
  // get stuck zoomed in with no chrome to reset it.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const viewport = document.querySelector('meta[name="viewport"]');
    viewport?.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no'
    );
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
    pendingPopup,
    showDescriptionPopup,
    showGameOverPopup,
    dismissPopup,
    newlyUnlockedAchievements,
    gameMilestones,
  } = useWhenGame();

  // Intro-animation cards: re-rolled whenever we (re)enter modeSelect so each game
  // gets a fresh intro, but held in state so the set warmed during the home-screen
  // dwell is exactly the set the transition renders. Warmed by useImagePrefetch.
  const [introEvents, setIntroEvents] = useState<HistoricalEvent[]>([]);
  useEffect(() => {
    if (state.phase === 'modeSelect' && allEvents.length > 0) {
      setIntroEvents(pickIntroEvents(allEvents));
    }
  }, [state.phase, allEvents]);

  useImagePrefetch(state, introEvents);

  // Drop today's pending 8am reminder once the daily is played (resync skips it).
  useEffect(() => {
    if (state.phase === 'gameOver') resyncDailyReminders();
  }, [state.phase]);

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

  // Auto-start challenge game when accessed via /challenge/:code route
  const hasAutoStartedChallenge = useRef(false);
  useEffect(() => {
    if (!autoStartChallenge || hasAutoStartedChallenge.current) return;
    if (state.phase !== 'modeSelect') return; // Wait for events to load

    hasAutoStartedChallenge.current = true;
    const gameConfig = challengeConfigToGameConfig(autoStartChallenge);
    gameConfig.challengeCode = challengeCode;
    gameConfig.challengeSeed = challengeCode;
    startGame(gameConfig);
  }, [autoStartChallenge, challengeCode, state.phase, startGame]);

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
          isLoading={state.phase === 'loading'}
          allEvents={allEvents}
        />
      )}
      {state.phase === 'transitioning' && (
        <GameStartTransition
          key="transition"
          onComplete={completeTransition}
          events={introEvents}
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
          newlyUnlockedAchievements={newlyUnlockedAchievements}
          gameMilestones={gameMilestones}
          allEvents={allEvents}
        />
      )}
    </AnimatePresence>
  );
}

export default App;
