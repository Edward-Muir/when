import { useState, useCallback, useEffect } from 'react';
import {
  HistoricalEvent,
  WhenGameState,
  PlacementResult,
  GameConfig,
  GamePopupData,
} from '../types';
import {
  loadAllEvents,
  getCachedEvents,
  filterByDifficulty,
  filterByCategory,
  filterByEra,
} from '../utils/eventLoader';
import { GameMilestone } from '../utils/statsStorage';
import { useGameStatsRecorder } from './useGameStatsRecorder';
import { useSaveDailyResult } from './useSaveDailyResult';
import {
  sortByYear,
  initializePlayers,
  insertIntoTimeline,
  settledPosition,
  getNextActivePlayerIndex,
  minDeckSize,
} from '../utils/gameLogic';
import { buildRampedDeck } from '../utils/deckBuilder';
import { buildDailyDeck } from '../utils/dailyConfig';
import {
  areCuratedThemesLoaded,
  getCuratedThemeById,
  loadCuratedThemes,
} from '../utils/curatedThemes';
import { buildThemeReplayDeck, withFreshReplaySeed } from '../utils/themeReplay';
import {
  validatePlacement,
  calculatePlacementResult,
  processCorrectPlacement,
  processIncorrectPlacement,
  buildPopupData,
  PlacementStateUpdate,
} from '../utils/placementLogic';
import {
  DEFAULT_TUNING,
  MISS_FLASH_MS,
  getMissTravelMs,
} from '../components/Timeline/animationTuning';

interface UseWhenGameReturn {
  state: WhenGameState;
  allEvents: HistoricalEvent[];
  startGame: (config: GameConfig) => void;
  completeTransition: () => void;
  placeCard: (insertionIndex: number) => PlacementResult | null;
  cycleHand: () => void;
  resetGame: () => void;
  restartGame: () => void;
  /** Reopen a finished board for reading (`utils/dailyBoard.ts`), without replaying it. */
  enterReview: (restored: WhenGameState) => void;
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
  pendingPopup: GamePopupData | null;
  showDescriptionPopup: (event: HistoricalEvent) => void;
  showGameOverPopup: () => void;
  dismissPopup: () => void;
  /** Achievement ids unlocked by the most recently recorded game (for Phase 5 UI). */
  newlyUnlockedAchievements: string[];
  /** Personal-best milestones set by the most recently recorded game (text-only end-of-game popups). */
  gameMilestones: GameMilestone[];
}

// Miss-reveal choreography timings now live in the shared tuning module
// (re-exported here for existing importers). The hook reads DEFAULT_TUNING
// directly — game sequencing is not affected by the jig's tuning provider.
export { MISS_FLASH_MS, getMissTravelMs };

const initialState: WhenGameState = {
  phase: 'loading',
  gameMode: null,
  timeline: [],
  seedEventName: undefined,
  deck: [],
  placementHistory: [],
  failedPlacements: [],
  lastPlacementResult: null,
  isAnimating: false,
  animationPhase: null,
  lastConfig: null,
  players: [],
  currentPlayerIndex: 0,
  turnNumber: 0,
  roundNumber: 1,
  winners: [],
  activePlayersAtRoundStart: 0,
  currentStreak: 0,
  bestStreak: 0,
};

// Pending state for popup - stored outside of WhenGameState to avoid circular updates
interface PendingPopupState {
  popup: GamePopupData | null;
  pendingStateUpdate: (() => void) | null;
}

/**
 * The deck a config should be dealt from, in dealing order (index 0 is the starting timeline
 * card).
 *
 * The daily goes through `buildDailyDeck` rather than re-deriving a pool from the config's
 * filters. Those were parallel implementations of the same thing, which
 * docs/gameplay-feel warns against: when they drift, the /daily preview card silently stops
 * matching the deck actually dealt. For a curated theme it is not drift but a straight
 * break — the theme's pool is an explicit event list no category filter can express, so the
 * filter chain would hand back the whole catalogue.
 *
 * An Archive replay names its theme on the config and is dealt from that theme's pool with
 * a fresh seed (`themeReplay.ts`). A theme the calendar no longer carries yields an empty
 * deck, so `startGame`'s size guard refuses it loudly rather than dealing the catalogue.
 *
 * Custom and challenge games keep the filter chain; they have no date to key a pool on.
 */
/**
 * Fold a resolved turn into state, splitting off what multiplayer defers to popup dismissal.
 *
 * `deferTurn` holds back the hand-off (whose turn it is, and the turn/round counters), so the
 * board does not jump to the next player under the popup. `deferPhase` also holds back the
 * `gameOver` phase: a miss defers it, so the incorrect popup is read before the game ends,
 * while a correct placement applies it at once. Returns the state to commit now and, when
 * something was deferred, the patch to apply on dismissal.
 */
function applyTurnUpdate(
  prev: WhenGameState,
  update: PlacementStateUpdate,
  { deferTurn, deferPhase }: { deferTurn: boolean; deferPhase: boolean }
): { next: WhenGameState; deferred: Partial<WhenGameState> | null } {
  const turn: Partial<WhenGameState> = {
    currentPlayerIndex: update.currentPlayerIndex,
    turnNumber: update.turnNumber,
    roundNumber: update.roundNumber,
    activePlayersAtRoundStart: update.activePlayersAtRoundStart,
  };
  const phase: Partial<WhenGameState> = { phase: update.isGameOver ? 'gameOver' : 'playing' };

  const next: WhenGameState = {
    ...prev,
    players: update.players,
    deck: update.deck,
    winners: update.winners,
    isAnimating: false,
    animationPhase: null,
    ...(deferTurn ? {} : turn),
    ...(deferPhase ? {} : phase),
  };
  const deferred = deferTurn ? { ...turn, ...(deferPhase ? phase : {}) } : null;
  return { next, deferred };
}

function composeDeck(config: GameConfig, allEvents: HistoricalEvent[]): HistoricalEvent[] {
  const {
    mode,
    dailySeed,
    curatedThemeId,
    selectedDifficulties,
    selectedCategories,
    selectedEras,
  } = config;

  if (mode === 'daily' && dailySeed) return buildDailyDeck(allEvents, dailySeed);

  if (curatedThemeId) {
    const theme = getCuratedThemeById(curatedThemeId);
    return theme ? buildThemeReplayDeck(allEvents, theme, config.challengeSeed) : [];
  }

  const filtered = filterByEra(
    filterByCategory(filterByDifficulty(allEvents, selectedDifficulties), selectedCategories),
    selectedEras
  );
  return buildRampedDeck(filtered, config.challengeSeed, { allEvents });
}

export function useWhenGame(): UseWhenGameReturn {
  // On a warm cache (e.g. remount after visiting /stats or /achievements), start straight in
  // modeSelect with the catalogue already in hand — no loading-screen flash. Cold first load
  // still falls through to 'loading' and the effect below.
  //
  // The theme calendar has to be warm too, not just the events. Mode select computes today's
  // theme name and preview card synchronously on its first render, so shortcutting past a
  // cold calendar would show a category theme on a curated day and then swap it underneath
  // the player.
  const [state, setState] = useState<WhenGameState>(() =>
    (getCachedEvents()?.length ?? 0) > 0 && areCuratedThemesLoaded()
      ? { ...initialState, phase: 'modeSelect' }
      : initialState
  );
  const [allEvents, setAllEvents] = useState<HistoricalEvent[]>(() => getCachedEvents() ?? []);
  const [modalEvent, setModalEvent] = useState<HistoricalEvent | null>(null);
  const [pendingPopupState, setPendingPopupState] = useState<PendingPopupState>({
    popup: null,
    pendingStateUpdate: null,
  });

  // Load events and the theme calendar on mount, then go to mode select. Both are needed
  // before any puzzle can be decided; loadCuratedThemes never rejects, so a calendar outage
  // just means no curated day rather than a stuck loading screen.
  useEffect(() => {
    Promise.all([loadAllEvents(), loadCuratedThemes()]).then(([events]) => {
      setAllEvents(events);
      setState((prev) => ({ ...prev, phase: 'modeSelect' }));
    });
  }, []);

  useSaveDailyResult(state);

  // Record every finished game into stats, unlocking achievements and detecting personal bests.
  const { newlyUnlockedAchievements, gameMilestones } = useGameStatsRecorder(state, allEvents);

  const startGame = useCallback(
    (config: GameConfig) => {
      const {
        mode,
        dailySeed,
        playerCount = 1,
        playerNames = [],
        cardsPerHand = 5,
        suddenDeathHandSize = 5,
      } = config;

      // Use suddenDeathHandSize for sudden death mode, cardsPerHand otherwise
      const effectiveHandSize = mode === 'suddenDeath' ? suddenDeathHandSize : cardsPerHand;

      const isDaily = mode === 'daily' && Boolean(dailySeed);
      const shuffled = composeDeck(config, allEvents);

      // Checked against the composed deck, not the pre-filter pool: a curated theme's pool is
      // a couple of dozen cards while the unfiltered catalogue is thousands, so testing the
      // wrong one would wave through a deck too short to deal.
      const minRequired = minDeckSize(playerCount, effectiveHandSize);
      if (shuffled.length < minRequired) {
        // Loud, because the old quiet return left the player tapping Play on a screen that
        // never changed, with nothing to explain it.
        console.error(
          `Not enough events to start the game: deck has ${shuffled.length}, need ${minRequired}` +
            (isDaily ? ` (daily ${dailySeed})` : '') +
            (config.curatedThemeId ? ` (theme ${config.curatedThemeId})` : '')
        );
        return;
      }

      // Pick 1 event for the starting timeline
      const timelineEvents = sortByYear([shuffled[0]]);
      const deckForGame = shuffled.slice(1);

      // Initialize players with hands (even for single player)
      const { players, remainingDeck } = initializePlayers(
        playerCount,
        playerNames,
        effectiveHandSize,
        deckForGame
      );

      setState({
        phase: 'transitioning',
        gameMode: mode,
        timeline: timelineEvents,
        seedEventName: shuffled[0].name,
        players,
        currentPlayerIndex: 0,
        turnNumber: 1,
        roundNumber: 1,
        winners: [],
        deck: remainingDeck,
        placementHistory: [],
        failedPlacements: [],
        lastPlacementResult: null,
        isAnimating: false,
        animationPhase: null,
        lastConfig: config,
        activePlayersAtRoundStart: playerCount,
        currentStreak: 0,
        bestStreak: 0,
      });
    },
    [allEvents]
  );

  // Commit a resolved turn from inside a setState updater. Whatever multiplayer defers is
  // stashed on the pending popup, so dismissing it applies the rest.
  const commitTurn = (
    prev: WhenGameState,
    update: PlacementStateUpdate,
    defer: { deferTurn: boolean; deferPhase: boolean }
  ): WhenGameState => {
    const { next, deferred } = applyTurnUpdate(prev, update, defer);
    if (deferred) {
      setPendingPopupState((prevPopup) => ({
        ...prevPopup,
        pendingStateUpdate: () => setState((s) => ({ ...s, ...deferred })),
      }));
    }
    return next;
  };

  const placeCard = useCallback(
    (insertionIndex: number): PlacementResult | null => {
      // 1. Validate placement attempt
      const currentPlayer = state.players[state.currentPlayerIndex];
      const validation = validatePlacement(state, currentPlayer);
      if (!validation) return null;

      const { activeCard } = validation;
      const isSinglePlayer = state.players.length === 1;

      // 2. Calculate placement result
      const result = calculatePlacementResult(state.timeline, activeCard, insertionIndex);

      // 3. Show popup immediately for multiplayer (turn handoff). Single-player misses get
      // the tombstone reveal + miss banner instead of a blocking popup.
      if (!isSinglePlayer) {
        const nextPlayerIdx = getNextActivePlayerIndex(state.currentPlayerIndex, state.players);
        const nextPlayer = state.players.at(nextPlayerIdx);
        setPendingPopupState({
          popup: buildPopupData(result, nextPlayer),
          pendingStateUpdate: null,
        });
      }

      if (result.success) {
        // 4a. Correct placement. The card settles at its `year`, so the board stays sorted;
        // a card won on a window slides there from wherever it was dropped. See gameLogic.
        const settled = settledPosition(state.timeline, activeCard, insertionIndex);
        const newTimeline = insertIntoTimeline(state.timeline, activeCard, settled);

        setState((prev) => ({
          ...prev,
          timeline: newTimeline,
          isAnimating: true,
          animationPhase: 'flash',
          placementHistory: [...prev.placementHistory, true],
          lastPlacementResult: result,
          currentStreak: prev.currentStreak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
        }));

        // 5a. After flash animation, finalize correct placement
        setTimeout(() => {
          setState((prev) => {
            const update = processCorrectPlacement(prev, activeCard);
            return commitTurn(prev, update, {
              deferTurn: !isSinglePlayer && !update.isGameOver,
              deferPhase: false,
            });
          });
        }, DEFAULT_TUNING.success.flashMs);
      } else {
        // 4b. Incorrect placement: show card at attempted position briefly
        const tempTimeline = insertIntoTimeline(state.timeline, activeCard, insertionIndex);

        setState((prev) => ({
          ...prev,
          timeline: tempTimeline,
          isAnimating: true,
          animationPhase: 'flash',
          placementHistory: [...prev.placementHistory, false],
          lastPlacementResult: result,
          currentStreak: 0,
        }));

        // 5b. After red flash, remove card from timeline; it reappears as a tombstone
        // at its true position (display only — placement rules ignore failedPlacements)
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            timeline: prev.timeline.filter((e) => e.name !== activeCard.name),
            failedPlacements: [
              ...prev.failedPlacements,
              {
                event: activeCard,
                attemptedPosition: insertionIndex,
                correctPosition: result.correctPosition,
                timelineLength: state.timeline.length,
                seq: prev.turnNumber,
              },
            ],
            animationPhase: 'moving',
          }));
        }, MISS_FLASH_MS);

        // 6b. After animation, finalize incorrect placement
        setTimeout(
          () => {
            setState((prev) => {
              const update = processIncorrectPlacement(prev, activeCard);
              // Multiplayer defers the hand-off, and the game-over phase, to popup dismissal
              return commitTurn(prev, update, {
                deferTurn: !isSinglePlayer,
                deferPhase: !isSinglePlayer,
              });
            });
            // Input stays locked through flash + travel + a settle margin for the wake springs
          },
          MISS_FLASH_MS +
            getMissTravelMs(Math.abs(insertionIndex - result.correctPosition)) +
            DEFAULT_TUNING.miss.settleMarginMs
        );
      }

      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally omitting full state to prevent infinite re-renders; we access specific fields via closure
    [state.phase, state.players, state.currentPlayerIndex, state.timeline, state.isAnimating]
  );

  const cycleHand = useCallback(() => {
    if (state.isAnimating || state.phase !== 'playing') return;

    setState((prev) => {
      const newPlayers = [...prev.players];
      const player = { ...newPlayers[prev.currentPlayerIndex] };

      if (player.hand.length <= 1) return prev;

      // Move first card to end of array
      const [first, ...rest] = player.hand;
      player.hand = [...rest, first];
      newPlayers[prev.currentPlayerIndex] = player;

      return { ...prev, players: newPlayers };
    });
  }, [state.isAnimating, state.phase]);

  const completeTransition = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'transitioning') return prev;
      return { ...prev, phase: 'playing' };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState({ ...initialState, phase: 'modeSelect' });
  }, []);

  // A replay restarts with a new seed so Restart reshuffles like a fresh play; every other
  // config restarts as-is (a challenge game is *meant* to repeat its order).
  const restartGame = useCallback(() => {
    const config = state.lastConfig;
    if (config) startGame(config.curatedThemeId ? withFreshReplaySeed(config) : config);
  }, [state.lastConfig, startGame]);

  /**
   * Show a finished board again without replaying it: `restoreDailyBoard` hands back a
   * `gameOver` state flagged `isReview`, and `App` already routes that phase to `Game`, so the
   * player lands on the board they built with the same bottom bar. Nothing is dealt and
   * nothing is written — see the flag's comment in `types/index.ts`.
   */
  const enterReview = useCallback((restored: WhenGameState) => {
    setState(restored);
  }, []);

  const openModal = useCallback((event: HistoricalEvent) => {
    setModalEvent(event);
  }, []);

  const closeModal = useCallback(() => {
    setModalEvent(null);
  }, []);

  // Show description popup for viewing card details
  const showDescriptionPopup = useCallback((event: HistoricalEvent) => {
    setPendingPopupState({
      popup: {
        type: 'description',
        event,
      },
      pendingStateUpdate: null,
    });
  }, []);

  // Dismiss popup and apply any pending state updates
  const dismissPopup = useCallback(() => {
    const { pendingStateUpdate } = pendingPopupState;
    setPendingPopupState({ popup: null, pendingStateUpdate: null });
    if (pendingStateUpdate) {
      pendingStateUpdate();
    }
  }, [pendingPopupState]);

  // Show game over popup
  const showGameOverPopup = useCallback(() => {
    setPendingPopupState({
      popup: {
        type: 'gameOver',
        event: null,
        gameState: state,
      },
      pendingStateUpdate: null,
    });
  }, [state]);

  return {
    state,
    allEvents,
    startGame,
    completeTransition,
    placeCard,
    cycleHand,
    resetGame,
    restartGame,
    enterReview,
    modalEvent,
    openModal,
    closeModal,
    pendingPopup: pendingPopupState.popup,
    showDescriptionPopup,
    showGameOverPopup,
    dismissPopup,
    newlyUnlockedAchievements,
    gameMilestones,
  };
}
