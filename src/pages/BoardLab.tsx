import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import ConfettiExplosion from 'react-confetti-explosion';
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { JsonCvPointerSensor, JsonCvTouchSensor } from '../utils/dndSensors';
import {
  ALL_CATEGORIES,
  DEFAULT_DIFFICULTIES,
  GameConfig,
  HistoricalEvent,
  WhenGameState,
} from '../types';
import { ALL_ERAS } from '../utils/eras';
import { useWhenGame } from '../hooks/useWhenGame';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useScreenShake } from '../hooks/useScreenShake';
import { useHaptics } from '../hooks/useHaptics';
import { getStreakFeedback, StreakFeedbackConfig } from '../utils/streakFeedback';
import PhysicalBoard, { BoardFeatures } from '../components/board/PhysicalBoard';
import HandBacks from '../components/board/HandBacks';
import ActiveCardDisplay from '../components/ActiveCardDisplay';
import Card from '../components/Card';
import GamePopup from '../components/GamePopup';

/**
 * Dev-only preview (route: /board-lab, no vercel.json rewrite, not linked from the app) of
 * the physical board. Plays a real game on the real engine and the real drag mechanic, with
 * the deck fixed by `?seed=` so two phones see the same cards. `?hand=` sets the hand size;
 * `?physics=0`, `?time=0`, `?ends=0` switch each of the board's three new behaviours off
 * for comparison against the shipped look.
 *
 * A finished game here is recorded like any custom game (the engine's stats recorder does
 * not know it is a preview).
 */

const DEFAULT_SEED = 'lab-1';
const DEFAULT_HAND = 5;

interface LabSettings {
  seed: string;
  hand: number;
  features: BoardFeatures;
}

function readSettings(params: URLSearchParams): LabSettings {
  const hand = Number(params.get('hand'));
  return {
    seed: params.get('seed') || DEFAULT_SEED,
    hand: Number.isInteger(hand) && hand >= 1 && hand <= 7 ? hand : DEFAULT_HAND,
    features: {
      physics: params.get('physics') !== '0',
      time: params.get('time') !== '0',
      ends: params.get('ends') !== '0',
    },
  };
}

function buildLabConfig(seed: string, hand: number): GameConfig {
  return {
    mode: 'suddenDeath',
    totalTurns: hand,
    selectedDifficulties: [...DEFAULT_DIFFICULTIES],
    selectedCategories: [...ALL_CATEGORIES],
    selectedEras: [...ALL_ERAS],
    challengeSeed: seed,
    playerCount: 1,
    cardsPerHand: hand,
    suddenDeathHandSize: hand,
  };
}

function withParam(params: URLSearchParams, key: string, value: string): string {
  const next = new URLSearchParams(params);
  next.set(key, value);
  return `?${next.toString()}`;
}

function newSeed(): string {
  return `lab-${Math.random().toString(36).slice(2, 7)}`;
}

/** A feature switch as a link, so a toggle is a URL you can send to a phone. */
const FeaturePill: React.FC<{ label: string; on: boolean; to: string }> = ({ label, on, to }) => (
  <Link
    to={to}
    replace
    className={`px-2 py-0.5 rounded-full border text-xs font-mono ${
      on ? 'border-accent text-text' : 'border-border text-text-muted line-through'
    }`}
  >
    {label}
  </Link>
);

const LabHeader: React.FC<{ settings: LabSettings; params: URLSearchParams }> = ({
  settings,
  params,
}) => {
  const { features } = settings;
  const flip = (key: keyof BoardFeatures) =>
    // eslint-disable-next-line security/detect-object-injection -- union-typed key
    withParam(params, key, features[key] ? '0' : '1');
  return (
    <div className="pt-safe-top shrink-0 border-b border-border bg-bg">
      <div className="h-11 flex items-center gap-2 px-3 text-xs font-mono text-text-muted">
        <Link to="/" className="text-text whitespace-nowrap">
          ← Home
        </Link>
        <span className="truncate min-w-0">board lab · {settings.seed}</span>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <FeaturePill label="physics" on={features.physics} to={flip('physics')} />
          <FeaturePill label="time" on={features.time} to={flip('time')} />
          <FeaturePill label="ends" on={features.ends} to={flip('ends')} />
        </div>
      </div>
    </div>
  );
};

const LabGameOver: React.FC<{
  placed: number;
  onReplay: () => void;
  params: URLSearchParams;
}> = ({ placed, onReplay, params }) => (
  <div className="flex-1 flex items-center justify-center gap-3 px-4 font-body">
    <span className="text-text text-sm">
      Game over · <span className="font-mono">{placed}</span> placed
    </span>
    <button
      onClick={onReplay}
      className="py-2 px-3 bg-border text-text rounded-xl text-sm active:scale-95"
    >
      Replay
    </button>
    <Link
      to={withParam(params, 'seed', newSeed())}
      className="py-2 px-3 bg-accent text-white rounded-xl text-sm active:scale-95"
    >
      New deck
    </Link>
  </div>
);

/** Whether the description popup may show the year: only for cards already on the board. */
function isRevealed(state: WhenGameState, event: HistoricalEvent | null): boolean {
  if (!event) return false;
  return (
    state.timeline.some((e) => e.name === event.name) ||
    state.failedPlacements.some((f) => f.event.name === event.name)
  );
}

const LabGame: React.FC<{ settings: LabSettings; params: URLSearchParams }> = ({
  settings,
  params,
}) => {
  const {
    state,
    startGame,
    completeTransition,
    placeCard,
    cycleHand,
    restartGame,
    pendingPopup,
    showDescriptionPopup,
    dismissPopup,
  } = useWhenGame();
  const config = useMemo(() => buildLabConfig(settings.seed, settings.hand), [settings]);

  // Start as soon as the catalogue is in, and skip the start transition.
  useEffect(() => {
    if (state.phase === 'modeSelect') startGame(config);
  }, [state.phase, config, startGame]);
  useEffect(() => {
    if (state.phase === 'transitioning') completeTransition();
  }, [state.phase, completeTransition]);

  const { shakeClassName, triggerShake } = useScreenShake();
  const { vibrate, haptics } = useHaptics();
  const [confetti, setConfetti] = useState<StreakFeedbackConfig | null>(null);
  const [newEventName, setNewEventName] = useState<string>();
  const prevPlacementRef = useRef(state.lastPlacementResult);

  // Mirrors Game.tsx's placement feedback: confetti and a streak haptic on a hit, a shake
  // and an error buzz on a miss.
  useEffect(() => {
    const result = state.lastPlacementResult;
    if (!result || result === prevPlacementRef.current) return;
    prevPlacementRef.current = result;
    if (result.success) {
      setConfetti(getStreakFeedback(state.currentStreak));
      vibrate(getStreakFeedback(state.currentStreak).hapticPattern);
      const t = setTimeout(() => setConfetti(null), 2000);
      setNewEventName(result.event.name);
      const t2 = setTimeout(() => setNewEventName(undefined), 1000);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
    triggerShake('medium');
    haptics.error();
  }, [state.lastPlacementResult, state.currentStreak, vibrate, haptics, triggerShake]);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const activeCard = currentPlayer?.hand[0] ?? null;

  const { setNodeRef: setBottomBarRef } = useDroppable({ id: 'bottom-bar-zone' });
  const sensors = useSensors(
    useSensor(JsonCvPointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(JsonCvTouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } })
  );
  const {
    state: dragState,
    handlers,
    droppedOnTimelineRef,
    draggedCardRef,
  } = useDragAndDrop({
    activeCard,
    onPlacement: placeCard,
    isAnimating: state.isAnimating,
    haptics,
  });

  if (state.phase !== 'playing' && state.phase !== 'gameOver') {
    return (
      <div className="h-dvh flex items-center justify-center text-text-muted font-body bg-bg">
        Dealing…
      </div>
    );
  }

  const placed = Math.max(0, state.timeline.length - 1);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handlers.handleDragStart}
      onDragMove={handlers.handleDragMove}
      onDragOver={handlers.handleDragOver}
      onDragEnd={handlers.handleDragEnd}
      onDragCancel={handlers.handleDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div
        className={`h-dvh min-h-screen-safe flex flex-col bg-bg overflow-hidden ${shakeClassName}`}
      >
        <LabHeader settings={settings} params={params} />

        {confetti && (
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50">
            <ConfettiExplosion
              force={confetti.confettiForce}
              duration={confetti.confettiDuration}
              particleCount={confetti.confettiParticles}
              width={confetti.confettiWidth}
            />
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          <PhysicalBoard
            events={state.timeline}
            onEventTap={showDescriptionPopup}
            failedPlacements={state.failedPlacements}
            newEventName={newEventName}
            isDragging={dragState.isDragging}
            insertionIndex={dragState.insertionIndex}
            draggedCard={activeCard}
            isOverTimeline={dragState.isOverTimeline}
            lastPlacementResult={state.lastPlacementResult}
            animationPhase={state.animationPhase}
            currentStreak={state.currentStreak}
            enableCentering
            features={settings.features}
          />
        </div>

        {/* Bottom bar: the hand's lives and counters on the left, the active card on the right */}
        <div
          ref={setBottomBarRef}
          className={`h-[120px] sm:h-[140px] flex items-center border-t border-border bg-bg z-40 pb-safe transition-colors duration-200 ${
            dragState.isOverHand ? 'bg-accent/10' : ''
          }`}
        >
          {state.phase === 'gameOver' ? (
            <LabGameOver placed={placed} onReplay={restartGame} params={params} />
          ) : (
            <>
              <div className="board-center-item w-24 shrink-0 flex flex-col items-center justify-center gap-1.5">
                <HandBacks hand={currentPlayer?.hand ?? []} />
                <div className="font-mono text-lg text-text leading-none">{placed}</div>
                <div
                  className={`font-mono text-xs leading-none ${
                    state.currentStreak > 1 ? 'text-accent' : 'text-text-muted opacity-0'
                  }`}
                >
                  ⚡{state.currentStreak}
                </div>
              </div>
              {activeCard && currentPlayer && (
                <ActiveCardDisplay
                  activeCard={activeCard}
                  currentPlayer={currentPlayer}
                  isAnimating={state.isAnimating}
                  isOverTimeline={dragState.isOverTimeline}
                  onCycleHand={cycleHand}
                  onCardTap={() => showDescriptionPopup(activeCard)}
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
            showYear={isRevealed(state, pendingPopup.event)}
            tombstone={state.failedPlacements.some(
              (f) => f.event.name === pendingPopup.event?.name
            )}
          />
        )}
      </div>
    </DndContext>
  );
};

const BoardLab: React.FC = () => {
  const [params] = useSearchParams();
  const settings = useMemo(() => readSettings(params), [params]);
  // A new seed or hand size is a new game: remount the engine.
  return <LabGame key={`${settings.seed}:${settings.hand}`} settings={settings} params={params} />;
};

export default BoardLab;
