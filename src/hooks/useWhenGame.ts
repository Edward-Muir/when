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
  filterByDifficulty,
  filterByCategory,
  filterByEra,
} from '../utils/eventLoader';
import { saveDailyResult } from '../utils/playerStorage';
import { generateEmojiGrid } from '../utils/share';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import {
  shuffleArray,
  shuffleArraySeeded,
  sortByYear,
  initializePlayers,
  insertIntoTimeline,
  getNextActivePlayerIndex,
} from '../utils/gameLogic';
import {
  validatePlacement,
  calculatePlacementResult,
  processCorrectPlacement,
  processIncorrectPlacement,
  buildPopupData,
} from '../utils/placementLogic';

interface UseWhenGameReturn {
  state: WhenGameState;
  allEvents: HistoricalEvent[];
  startGame: (config: GameConfig) => void;
  completeTransition: () => void;
  placeCard: (insertionIndex: number) => PlacementResult | null;
  cycleHand: () => void;
  resetGame: () => void;
  restartGame: () => void;
  viewTimeline: () => void;
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
  pendingPopup: GamePopupData | null;
  showDescriptionPopup: (event: HistoricalEvent) => void;
  showGameOverPopup: () => void;
  dismissPopup: () => void;
}

const initialState: WhenGameState = {
  phase: 'loading',
  gameMode: null,
  timeline: [],
  deck: [],
  placementHistory: [],
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

export function useWhenGame(): UseWhenGameReturn {
  const [state, setState] = useState<WhenGameState>(initialState);
  const [allEvents, setAllEvents] = useState<HistoricalEvent[]>([]);
  const [modalEvent, setModalEvent] = useState<HistoricalEvent | null>(null);
  const [pendingPopupState, setPendingPopupState] = useState<PendingPopupState>({
    popup: null,
    pendingStateUpdate: null,
  });

  // Load events on mount and go to mode select
  useEffect(() => {
    loadAllEvents().then((events) => {
      setAllEvents(events);
      setState((prev) => ({ ...prev, phase: 'modeSelect' }));
    });
  }, []);

  // Save daily result to localStorage when daily game ends
  useEffect(() => {
    if (state.phase === 'gameOver' && state.gameMode === 'daily' && state.lastConfig?.dailySeed) {
      const dailySeed = state.lastConfig.dailySeed;
      const theme = getDailyTheme(dailySeed);

      saveDailyResult({
        date: dailySeed,
        theme: getThemeDisplayName(theme),
        won: state.winners.length > 0,
        correctCount: state.placementHistory.filter((p) => p).length,
        totalAttempts: state.placementHistory.length,
        emojiGrid: generateEmojiGrid(state.placementHistory),
        bestStreak: state.bestStreak > 1 ? state.bestStreak : undefined,
      });
    }
  }, [
    state.phase,
    state.gameMode,
    state.lastConfig,
    state.winners,
    state.placementHistory,
    state.bestStreak,
  ]);

  const startGame = useCallback(
    (config: GameConfig) => {
      const {
        mode,
        selectedDifficulties,
        selectedCategories,
        selectedEras,
        dailySeed,
        playerCount = 1,
        playerNames = [],
        cardsPerHand = 5,
        suddenDeathHandSize = 5,
      } = config;

      // Apply filters to get available events
      let filteredEvents = filterByDifficulty(allEvents, selectedDifficulties);
      filteredEvents = filterByCategory(filteredEvents, selectedCategories);
      filteredEvents = filterByEra(filteredEvents, selectedEras);

      // Use suddenDeathHandSize for sudden death mode, cardsPerHand otherwise
      const effectiveHandSize = mode === 'suddenDeath' ? suddenDeathHandSize : cardsPerHand;

      // Calculate minimum required cards
      const minRequired = playerCount * effectiveHandSize + 1 + playerCount * 2;

      if (filteredEvents.length < minRequired) {
        console.error('Not enough events to start the game');
        return;
      }

      // Use seeded shuffle for daily mode, regular shuffle otherwise
      const shuffled =
        mode === 'daily' && dailySeed
          ? shuffleArraySeeded(filteredEvents, dailySeed)
          : shuffleArray(filteredEvents);

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
        players,
        currentPlayerIndex: 0,
        turnNumber: 1,
        roundNumber: 1,
        winners: [],
        deck: remainingDeck,
        placementHistory: [],
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

      // 3. Show popup immediately for multiplayer, or for incorrect single-player placements
      if (!isSinglePlayer || !result.success) {
        const nextPlayerIdx = !isSinglePlayer
          ? getNextActivePlayerIndex(state.currentPlayerIndex, state.players)
          : state.currentPlayerIndex;
        const nextPlayer = !isSinglePlayer ? state.players.at(nextPlayerIdx) : undefined;
        setPendingPopupState({
          popup: buildPopupData(result.success ? 'correct' : 'incorrect', activeCard, nextPlayer),
          pendingStateUpdate: null,
        });
      }

      if (result.success) {
        // 4a. Correct placement: insert into timeline and start animation
        const newTimeline = insertIntoTimeline(state.timeline, activeCard, result.correctPosition);

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
            const shouldShowPopup = !isSinglePlayer && !update.isGameOver;

            if (shouldShowPopup) {
              const pendingUpdate = () => {
                setState((s) => ({
                  ...s,
                  currentPlayerIndex: update.currentPlayerIndex,
                  turnNumber: update.turnNumber,
                  roundNumber: update.roundNumber,
                  activePlayersAtRoundStart: update.activePlayersAtRoundStart,
                }));
              };
              setPendingPopupState((prevPopup) => ({
                ...prevPopup,
                pendingStateUpdate: pendingUpdate,
              }));

              return {
                ...prev,
                players: update.players,
                deck: update.deck,
                winners: update.winners,
                phase: update.isGameOver ? 'gameOver' : 'playing',
                isAnimating: false,
                animationPhase: null,
              };
            }

            return {
              ...prev,
              players: update.players,
              deck: update.deck,
              currentPlayerIndex: update.currentPlayerIndex,
              turnNumber: update.turnNumber,
              roundNumber: update.roundNumber,
              winners: update.winners,
              phase: update.isGameOver ? 'gameOver' : 'playing',
              isAnimating: false,
              animationPhase: null,
              activePlayersAtRoundStart: update.activePlayersAtRoundStart,
            };
          });
        }, 600);
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

        // 5b. After red flash, remove card from timeline
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            timeline: prev.timeline.filter((e) => e.name !== activeCard.name),
            animationPhase: 'moving',
          }));
        }, 400);

        // 6b. After animation, finalize incorrect placement
        setTimeout(() => {
          setState((prev) => {
            const update = processIncorrectPlacement(prev, activeCard);

            // For multiplayer, defer turn advancement to popup dismiss
            if (!isSinglePlayer) {
              const pendingUpdate = () => {
                setState((s) => ({
                  ...s,
                  currentPlayerIndex: update.currentPlayerIndex,
                  turnNumber: update.turnNumber,
                  roundNumber: update.roundNumber,
                  activePlayersAtRoundStart: update.activePlayersAtRoundStart,
                  phase: update.isGameOver ? 'gameOver' : 'playing',
                }));
              };
              setPendingPopupState((prevPopup) => ({
                ...prevPopup,
                pendingStateUpdate: pendingUpdate,
              }));

              return {
                ...prev,
                players: update.players,
                deck: update.deck,
                winners: update.winners,
                isAnimating: false,
                animationPhase: null,
              };
            }

            // For single player, apply all updates immediately
            return {
              ...prev,
              players: update.players,
              deck: update.deck,
              currentPlayerIndex: update.currentPlayerIndex,
              turnNumber: update.turnNumber,
              roundNumber: update.roundNumber,
              winners: update.winners,
              phase: update.isGameOver ? 'gameOver' : 'playing',
              isAnimating: false,
              animationPhase: null,
              activePlayersAtRoundStart: update.activePlayersAtRoundStart,
            };
          });
        }, 800);
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

  const viewTimeline = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'viewTimeline' }));
  }, []);

  const restartGame = useCallback(() => {
    if (state.lastConfig) {
      startGame(state.lastConfig);
    }
  }, [state.lastConfig, startGame]);

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
    viewTimeline,
    modalEvent,
    openModal,
    closeModal,
    pendingPopup: pendingPopupState.popup,
    showDescriptionPopup,
    showGameOverPopup,
    dismissPopup,
  };
}
