import { useState, useEffect, useRef, useMemo, CSSProperties } from 'react';
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
import {
  WhenGameState,
  PlacementResult,
  HistoricalEvent,
  GamePopupData,
  GamePhase,
} from '../types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useScreenShake } from '../hooks/useScreenShake';
import { useHaptics } from '../hooks/useHaptics';
import { warmLeaderboard } from '../hooks/useLeaderboard';
import { getLocalDateString } from '../utils/puzzleDate';
import Timeline from './Timeline/Timeline';
import GamePopup from './GamePopup';
import StatsPopup from './StatsPopup';
import HandDragOverlay, { dropAnimationFor } from './HandDragOverlay';
import { Toast } from './Toast';
import { GameInfoCompact } from './PlayerInfo';
import GameHomeButton from './GameHomeButton';
import LeaveConfirmModal from './LeaveConfirmModal';
import HintStrip from './HintStrip';
import { hintText } from '../utils/hintCopy';
import { useOnboardingHints } from '../hooks/useOnboardingHints';
import { useThemeIntro } from '../hooks/useThemeIntro';
import { useLeaveGame } from '../hooks/useLeaveGame';
import ThemeIntroPopup from './ThemeIntroPopup';
import GameOverControls from './GameOverControls';
import ActiveCardDisplay from './ActiveCardDisplay';
import AchievementUnlock from './AchievementUnlock';
import ShareStepPopup from './ShareStepPopup';
import MilestonePopup from './MilestonePopup';
import { useEndOfGameSequence, EndOfGameStep } from '../hooks/useEndOfGameSequence';
import { useDailyLeaderboard } from '../hooks/useDailyLeaderboard';
import { useUnlockedBadges } from '../hooks/useUnlockedBadges';
import { buildDailyResult } from '../utils/dailyResult';
import { getStreakFeedback } from '../utils/streakFeedback';
import { getVignetteColor } from '../utils/vignettePulse';
import { GameMilestone, getDailyCadence } from '../utils/statsStorage';
import { canRestartMidGame } from '../utils/dailyReplay';

/**
 * The leave prompt's Restart, offered while a practice game is being played
 * (`canRestartMidGame`). At game over the bottom bar has its own Restart, and a review is a
 * finished board. Extracted
 * because `Game` sits on ESLint's complexity ceiling of 15, like the helpers below.
 */
function midGameRestart(state: WhenGameState, restart: () => void): (() => void) | undefined {
  const available =
    state.phase === 'playing' &&
    !state.isReview &&
    canRestartMidGame(state.lastConfig, getDailyCadence().playedDates);
  return available ? restart : undefined;
}

// Whether the popup should reveal the event's year: cards already on the timeline and
// revealed tombstones do; a hand card being previewed doesn't (that's the puzzle).
/**
 * A close-enough hit's haptic: one short tick, against the streak tier's escalating pattern.
 * Distinct enough to feel, quiet enough not to read as a miss.
 */
const CLOSE_ENOUGH_HAPTIC = [10];

function shouldShowYearInPopup(pendingPopup: GamePopupData | null, state: WhenGameState): boolean {
  if (pendingPopup?.type === 'description' && pendingPopup.event) {
    const name = pendingPopup.event.name;
    return (
      state.timeline.some((e) => e.name === name) ||
      state.failedPlacements.some((f) => f.event.name === name)
    );
  }
  return pendingPopup?.type !== 'gameOver'; // Show year for correct/incorrect, not for gameOver
}

/**
 * The bottom bar's buttons are the fallback route, for once every end-of-game screen is gone.
 * While the game-over popup or any sequence step is up, one of those owns the share (and, on
 * the closing card, Restart and Home); the bar's buttons would show through the scrim and do
 * nothing, and Share would be on screen twice.
 *
 * Extracted rather than inlined because `Game` sits on ESLint's complexity ceiling of 15 —
 * same reason `shouldShowYearInPopup` above is a function.
 */
function isBottomBarVisible(
  pendingPopup: GamePopupData | null,
  endStep: EndOfGameStep | null
): boolean {
  return !pendingPopup && endStep === null;
}

/**
 * A card-description popup is open. The tap-a-card hint has been answered by definition, so
 * the hook stops offering it.
 *
 * Extracted rather than inlined at the `useOnboardingHints` call for the same reason as the
 * two helpers above — `Game` sits on ESLint's complexity ceiling of 15.
 */
function isCardPopupOpen(pendingPopup: GamePopupData | null): boolean {
  return pendingPopup?.type === 'description';
}

interface GameProps {
  state: WhenGameState;
  onPlacement: (index: number) => PlacementResult | null;
  onCycleHand: () => void;
  pendingPopup: GamePopupData | null;
  showDescriptionPopup: (event: HistoricalEvent) => void;
  showGameOverPopup: () => void;
  dismissPopup: () => void;
  onRestart: () => void;
  /** Restart from the leave prompt mid-game: same deal rules as `onRestart`, no intro. */
  onRestartMidGame: () => void;
  onNewGame: () => void;
  newlyUnlockedAchievements: string[];
  gameMilestones: GameMilestone[];
  allEvents: HistoricalEvent[];
}

/**
 * The bar is tall only while it holds the square hand card. Game over swaps in a row of
 * buttons, and the board gets the space back.
 */
function bottomBarHeightClass(phase: GamePhase): string {
  return phase === 'gameOver' ? 'h-[120px] sm:h-[140px]' : 'hand-bar';
}

/**
 * The board steps back while the game-over popup is up: its cards have travelled into the
 * popup's gallery, so the rows behind the scrim would show every card twice. It returns when
 * the popup closes. The classes are in index.css; `GameOverGallery` owns the travel.
 *
 * A function for the same reason as the helpers above: `Game` sits on the complexity ceiling.
 */
function boardAreaClass(pendingPopup: GamePopupData | null): string {
  const away = pendingPopup?.type === 'gameOver';
  return `flex-1 overflow-hidden relative ${away ? 'board-away' : 'board-back'}`;
}

const Game: React.FC<GameProps> = ({
  state,
  onPlacement,
  onCycleHand,
  pendingPopup,
  showDescriptionPopup,
  showGameOverPopup,
  dismissPopup,
  onRestart,
  onRestartMidGame,
  onNewGame,
  newlyUnlockedAchievements,
  gameMilestones,
  allEvents,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [newEventName, setNewEventName] = useState<string | undefined>(undefined);
  const [showToast, setShowToast] = useState(false);
  const [gameOverPopupShown, setGameOverPopupShown] = useState(false);
  const [showStatsPopup, setShowStatsPopup] = useState(false);
  // Full-screen edge-in colour pulse shown on each placement. `key` remounts
  // the overlay so the animation retriggers on rapid back-to-back placements.
  const [vignette, setVignette] = useState<{ color: string; key: number } | null>(null);

  // This game's badges and the catalogue that gives them their art, which is warmed here.
  const { unlockedDefs, eventsByName } = useUnlockedBadges(newlyUnlockedAchievements, allEvents);

  // The daily leaderboard, owned here because three screens want it: the game-over popup shows
  // the board and the submit form, the popup's dismiss gate depends on whether the score is on
  // it, and the share step prints the rank. One instance, read directly, rather than owned by
  // LeaderboardSubmit and reported upward through callbacks that could fall out of sync.
  // A board being re-read has nothing to submit: its score is already on the board (or was
  // declined), so no result means `useDailyLeaderboard` stays idle.
  const dailyResult = useMemo(() => (state.isReview ? null : buildDailyResult(state)), [state]);
  const leaderboard = useDailyLeaderboard(dailyResult);

  // The end-of-game screens after the game-over popup, in order: milestones (if any),
  // achievements (if any), then always the share. See the hook for why the game-over popup
  // itself stays outside the queue.
  const { step: endStep, advance: advanceEndStep } = useEndOfGameSequence({
    popupType: pendingPopup?.type,
    phase: state.phase,
    hasMilestones: gameMilestones.length > 0,
    hasAchievements: unlockedDefs.length > 0,
  });

  // Home, from the Home button or the system Back gesture: asks only when progress would be lost.
  const leave = useLeaveGame(state, onNewGame);

  // Game feel hooks
  const { shakeClassName, triggerShake } = useScreenShake();
  const { haptics, vibrate } = useHaptics();

  // Prefetch leaderboard for daily mode

  // Track previous placement result to detect changes
  const prevPlacementRef = useRef(state.lastPlacementResult);

  // Capture streak feedback config at time of placement for confetti/haptics
  const streakFeedbackRef = useRef(getStreakFeedback(0));

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
    carry,
  } = useDragAndDrop({
    activeCard,
    onPlacement,
    isAnimating: state.isAnimating,
    haptics,
  });

  // The curated theme's intro, opened as play begins on the first game of a theme.
  const themeIntro = useThemeIntro(state);

  // The one-shot hints: the idle drag nudge, then one strip per placement walking the ladder
  // wrong / correct -> tap a card -> the counter -> swap. All the conditions live in the
  // hook; this component only mounts the strip and passes the glow target its key.
  const hints = useOnboardingHints({
    phase: state.phase,
    isAnimating: state.isAnimating,
    isDragging: dragState.isDragging,
    lastPlacementResult: state.lastPlacementResult,
    handLength: currentPlayer?.hand.length ?? 0,
    deckLength: state.deck.length,
    timelineLength: state.timeline.length,
    activeCardName: activeCard?.name,
    isMultiplayer: state.players.length > 1,
    statsOpen: showStatsPopup,
    cardOpen: isCardPopupOpen(pendingPopup),
    introOpen: themeIntro.open,
  });

  useEffect(() => {
    const placement = state.lastPlacementResult;
    if (placement && placement !== prevPlacementRef.current) {
      // Whole-screen edge-in pulse: red on a miss, streak colour on a hit, the secondary
      // accent when a window is what carried it.
      const closeEnough = placement.closeEnough === true;
      const color = getVignetteColor(placement.success, state.currentStreak, closeEnough);
      setVignette({ color, key: Date.now() });
      setTimeout(() => setVignette(null), 900); // matches --anim-vignette-dur
      if (placement.success) {
        // Capture streak feedback for this placement
        streakFeedbackRef.current = getStreakFeedback(state.currentStreak);
        // The one-shot hint teaches close-enough once; this is what keeps it legible every
        // time after that. Confetti is withheld rather than reduced — a smaller burst reads
        // as a rendering glitch, its absence reads as a different outcome. The haptic drops
        // to a single tick for the same reason.
        setShowConfetti(!closeEnough);
        setTimeout(() => setShowConfetti(false), 2000);
        vibrate(closeEnough ? CLOSE_ENOUGH_HAPTIC : streakFeedbackRef.current.hapticPattern);
      } else {
        triggerShake('medium');
        haptics.error();
      }
      setNewEventName(placement.event.name);
      setTimeout(() => setNewEventName(undefined), 1000);
    }
    prevPlacementRef.current = state.lastPlacementResult;
  }, [state.lastPlacementResult, state.currentStreak, haptics, vibrate, triggerShake]);

  // Show game over popup when game ends. A review opens straight onto the board: the summary
  // has been seen, and never showing the popup is also what keeps `useEndOfGameSequence`
  // dormant, since that queue arms on the popup closing.
  useEffect(() => {
    if (state.phase === 'gameOver' && !state.isReview && !gameOverPopupShown) {
      setGameOverPopupShown(true);
      showGameOverPopup();
    }
    // Reset when starting a new game. The end-of-game sequence resets itself on the same
    // phase change.
    if (state.phase === 'playing') {
      setGameOverPopupShown(false);
    }
  }, [state.phase, state.isReview, gameOverPopupShown, showGameOverPopup]);

  // Warm the daily board while the player is still playing. `useDailyLeaderboard` above only
  // starts fetching once the game is over and there is a result to submit; this makes sure the
  // slow part is already done by then — the serverless function is warm and the date's bots have
  // been lazily generated.
  //
  // So it only needs to touch the endpoint, not download the board. Sending no deviceId and
  // `limit=1` takes the cheap path in api/leaderboard/[date].ts, which otherwise reads the
  // whole sorted set to locate the caller.
  useEffect(() => {
    if (state.gameMode === 'daily' && !state.isReview) {
      warmLeaderboard(getLocalDateString());
    }
  }, [state.gameMode, state.isReview]);

  const handleActiveCardTap = () => {
    if (activeCard) showDescriptionPopup(activeCard);
  };

  const showYearInPopup = shouldShowYearInPopup(pendingPopup, state);
  // Tombstoned (failed) events get the muted/greyscale popup treatment
  const isTombstonePopup =
    pendingPopup?.type === 'description' &&
    state.failedPlacements.some((f) => f.event.name === pendingPopup.event?.name);

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
          className={`h-dvh min-h-screen-safe flex flex-col bg-bg overflow-hidden pt-safe transition-colors ${shakeClassName}`}
        >
          {showConfetti && (
            <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50">
              <ConfettiExplosion
                force={streakFeedbackRef.current.confettiForce}
                duration={streakFeedbackRef.current.confettiDuration}
                particleCount={streakFeedbackRef.current.confettiParticles}
                width={streakFeedbackRef.current.confettiWidth}
              />
            </div>
          )}

          {/* Main Timeline Area - takes remaining space */}
          <div className={boardAreaClass(pendingPopup)}>
            <Timeline
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
              enableCentering={true}
            />
            <HintStrip
              placement="floating"
              text={hintText(hints.active)}
              onDismiss={hints.dismiss}
            />
            <GameHomeButton onClick={leave.requestHome} hidden={dragState.isDragging} />
          </div>

          {/* Bottom Bar - Fixed height with game info + active card aligned with timeline.
              `hand-bar` (index.css) is the square hand card plus the safe-area inset. */}
          <div
            ref={setBottomBarRef}
            className={`${bottomBarHeightClass(state.phase)} flex items-center border-t border-border bg-bg z-40 pb-safe transition-colors duration-200 ${
              dragState.isOverHand ? 'bg-accent/10' : ''
            }`}
          >
            {state.phase === 'gameOver' ? (
              /* Game Over: Full-width horizontal buttons */
              <GameOverControls
                state={state}
                onRestart={onRestart}
                onNewGame={onNewGame}
                onShowToast={() => setShowToast(true)}
                visible={isBottomBarVisible(pendingPopup, endStep)}
              />
            ) : (
              <>
                {/* Left: Game Info - matches year column width (96px); board-center-item offsets the bar */}
                <div className="board-center-item w-24 shrink-0 flex items-center justify-center">
                  <GameInfoCompact
                    currentPlayer={currentPlayer}
                    isMultiplayer={state.players.length > 1}
                    timelineLength={state.timeline.length}
                    onStatsClick={() => setShowStatsPopup(true)}
                    currentStreak={state.currentStreak}
                    nudge={hints.active}
                    placementInFlight={state.isAnimating ? state.lastPlacementResult : null}
                  />
                </div>

                {/* Right: Active Card Area - aligned with timeline cards */}
                {activeCard && (
                  <ActiveCardDisplay
                    activeCard={activeCard}
                    currentPlayer={currentPlayer}
                    isAnimating={state.isAnimating}
                    onCycleHand={onCycleHand}
                    onCardTap={handleActiveCardTap}
                    nudge={hints.active}
                  />
                )}
              </>
            )}
          </div>

          {createPortal(
            <DragOverlay dropAnimation={dropAnimationFor(droppedOnTimelineRef.current)}>
              {draggedCardRef.current ? (
                <HandDragOverlay event={draggedCardRef.current} carry={carry} />
              ) : null}
            </DragOverlay>,
            document.body
          )}

          <GamePopup
            type={pendingPopup?.type ?? 'correct'}
            event={pendingPopup?.event ?? null}
            onDismiss={dismissPopup}
            nextPlayer={pendingPopup?.nextPlayer}
            showYear={showYearInPopup}
            gameState={pendingPopup?.gameState}
            closeEnough={pendingPopup?.closeEnough}
            tombstone={isTombstonePopup}
            dailyResult={dailyResult}
            leaderboard={leaderboard}
          />

          <ThemeIntroPopup intro={themeIntro} />

          <StatsPopup
            isOpen={showStatsPopup}
            cardsInHand={currentPlayer?.hand.length ?? 0}
            timelineLength={state.timeline.length}
            currentStreak={state.currentStreak}
            onDismiss={() => setShowStatsPopup(false)}
          />

          <Toast
            message="Copied to clipboard!"
            isVisible={showToast}
            onClose={() => setShowToast(false)}
          />

          <LeaveConfirmModal
            open={leave.confirmOpen}
            onClose={leave.closeConfirm}
            onConfirm={onNewGame}
            onRestart={midGameRestart(state, onRestartMidGame)}
            restartDisabled={state.isAnimating}
          />

          {/* The end-of-game sequence. Each step dismisses to the next; the closing card always
              ends it, so the finale is the same screen whether or not this game unlocked
              anything, and it is the one that offers Restart and Home. No step chains into
              another by hand — the queue owns the order. */}
          <MilestonePopup
            open={endStep === 'milestones'}
            milestones={gameMilestones}
            onDismiss={advanceEndStep}
          />

          <AchievementUnlock
            open={endStep === 'achievements'}
            achievements={unlockedDefs}
            eventsByName={eventsByName}
            onDismiss={advanceEndStep}
          />

          <ShareStepPopup
            open={endStep === 'share'}
            gameState={state}
            leaderboard={leaderboard}
            onDismiss={advanceEndStep}
            onRestart={onRestart}
            onHome={onNewGame}
          />
        </div>
      </DndContext>

      {/* Whole-screen placement feedback: colour blooms in from the edges and
          fades toward the centre. Sits outside the shake container so it stays
          stationary while the board shakes on a miss. */}
      {vignette && (
        <div
          key={vignette.key}
          aria-hidden="true"
          className="vignette-overlay animate-vignette pointer-events-none fixed inset-0 z-[45]"
          style={{ '--vignette-color': vignette.color } as CSSProperties}
        />
      )}
    </motion.div>
  );
};

export default Game;
