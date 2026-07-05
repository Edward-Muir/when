import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import Timeline from '../components/Timeline/Timeline';
import {
  AnimationTuning,
  AnimationTuningContext,
  DEFAULT_TUNING,
  scaleTuning,
} from '../components/Timeline/animationTuning';
import { useTheme } from '../hooks/useTheme';
import { useScreenShake } from '../hooks/useScreenShake';
import { useHaptics } from '../hooks/useHaptics';
import { getStreakFeedback, StreakFeedbackConfig } from '../utils/streakFeedback';
import { loadAllEvents } from '../utils/eventLoader';
import { HistoricalEvent } from '../types';
import ControlsPanel from './animJig/ControlsPanel';
import { clearStoredTuning, loadStoredTuning, saveStoredTuning } from './animJig/tuningSchema';
import { useAnimJigDriver } from './animJig/useAnimJigDriver';

/**
 * Dev-only harness (route: /anim-jig) for iterating on the correct/incorrect
 * placement animations. Renders the real Timeline component driven by a
 * synthetic replay driver, with every animation constant live-tweakable via
 * the tuning provider. Not linked from the game UI.
 */
const AnimJig: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [allEvents, setAllEvents] = useState<HistoricalEvent[]>();
  useEffect(() => {
    loadAllEvents().then(setAllEvents);
  }, []);

  // Tuning under edit (unscaled). Persisted so a tuning session survives reloads.
  const [tuning, setTuning] = useState<AnimationTuning>(loadStoredTuning);
  useEffect(() => {
    if (tuning === DEFAULT_TUNING) clearStoredTuning();
    else saveStoredTuning(tuning);
  }, [tuning]);

  const [speed, setSpeed] = useState(1);
  const [forceReduced, setForceReduced] = useState(false);
  const [distance, setDistance] = useState(2);
  const [direction, setDirection] = useState<'early' | 'late'>('early');

  // Everything — component transitions, wake schedule, driver phase timeouts and
  // the CSS-var durations — reads this one scaled object, so slow-mo stays coherent.
  const liveTuning = useMemo(() => scaleTuning(tuning, speed), [tuning, speed]);

  const { shakeClassName, triggerShake } = useScreenShake();
  const { vibrate, haptics } = useHaptics();
  const [confetti, setConfetti] = useState<StreakFeedbackConfig | null>(null);
  const confettiTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(confettiTimer.current), []);

  const driver = useAnimJigDriver(allEvents, liveTuning, {
    // Mirrors Game.tsx's placement feedback (confetti / haptics / shake)
    onSuccess: (streak) => {
      const feedback = getStreakFeedback(streak);
      setConfetti(null);
      window.clearTimeout(confettiTimer.current);
      // Re-mount ConfettiExplosion on the next frame so back-to-back plays re-fire
      requestAnimationFrame(() => setConfetti(feedback));
      confettiTimer.current = window.setTimeout(() => setConfetti(null), 2000);
      vibrate(feedback.hapticPattern);
    },
    onMiss: () => {
      triggerShake('medium');
      haptics.error();
    },
  });

  const maxDistance = Math.max(
    1,
    direction === 'early' ? driver.correctGap : driver.boardSize - driver.correctGap
  );

  return (
    <div className="h-screen-safe flex flex-col md:flex-row bg-bg overflow-hidden">
      {/* Phone-width column hosting the real Timeline under the tuning provider */}
      <div
        className={`relative h-1/2 w-full shrink-0 overflow-hidden border-b border-border md:h-full md:w-[390px] md:border-b-0 md:border-r ${shakeClassName}`}
        style={
          {
            '--anim-glow-dur': `${liveTuning.success.glowDurS}s`,
            '--anim-error-pulse-dur': `${liveTuning.miss.errorPulseDurS}s`,
          } as React.CSSProperties
        }
      >
        {confetti && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50">
            <ConfettiExplosion
              force={confetti.confettiForce}
              duration={confetti.confettiDuration}
              particleCount={confetti.confettiParticles}
              width={confetti.confettiWidth}
            />
          </div>
        )}
        {driver.ready ? (
          <AnimationTuningContext.Provider value={liveTuning}>
            <MotionConfig reducedMotion={forceReduced ? 'always' : 'user'}>
              <Timeline
                events={driver.state.timeline}
                onEventTap={() => {}}
                failedPlacements={driver.state.failedPlacements}
                newEventName={driver.state.newEventName}
                isDragging={false}
                insertionIndex={null}
                draggedCard={null}
                isOverTimeline={false}
                lastPlacementResult={driver.state.lastPlacementResult}
                animationPhase={driver.state.animationPhase}
                currentStreak={driver.state.currentStreak}
                preloadDetailImages={false}
                startAtMiddle
              />
            </MotionConfig>
          </AnimationTuningContext.Provider>
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted font-body">
            Loading events…
          </div>
        )}
      </div>

      {/* Control panel */}
      <div className="flex-1 overflow-y-auto">
        <ControlsPanel
          tuning={tuning}
          onTuningChange={setTuning}
          onResetAllTuning={() => setTuning(DEFAULT_TUNING)}
          speed={speed}
          onSpeedChange={setSpeed}
          forceReduced={forceReduced}
          onForceReducedChange={setForceReduced}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          distance={distance}
          onDistanceChange={setDistance}
          direction={direction}
          onDirectionChange={setDirection}
          maxDistance={maxDistance}
          status={driver.status}
          onPlayCorrect={driver.playCorrect}
          onPlayMiss={() => driver.playMiss(Math.min(distance, maxDistance), direction)}
          onReplay={driver.replay}
          onResetBoard={driver.reset}
        />
      </div>
    </div>
  );
};

export default AnimJig;
