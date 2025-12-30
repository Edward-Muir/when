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
import {
  shuffleArray,
  shuffleArraySeeded,
  sortByYear,
  isPlacementCorrect,
  findCorrectPosition,
  insertIntoTimeline,
  initializePlayers,
  removeFromHand,
  addToHand,
  drawCard,
  getNextActivePlayerIndex,
  shouldGameEnd,
  processEndOfRound,
} from '../utils/gameLogic';

interface UseWhenGameReturn {
  state: WhenGameState;
  allEvents: HistoricalEvent[];
  startGame: (config: GameConfig) => void;
  placeCard: (insertionIndex: number) => PlacementResult | null;
  cycleHand: () => void;
  resetGame: () => void;
  restartGame: () => void;
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
  pendingPopup: GamePopupData | null;
  showDescriptionPopup: (event: HistoricalEvent) => void;
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

  // Load events on mount
  useEffect(() => {
    loadAllEvents().then((events) => {
      setAllEvents(events);
      setState((prev) => ({ ...prev, phase: 'modeSelect' }));
    });
  }, []);

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
        suddenDeathHandSize = 3,
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
        phase: 'playing',
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
      });
    },
    [allEvents]
  );

  const placeCard = useCallback(
    (insertionIndex: number): PlacementResult | null => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const activeCard = currentPlayer?.hand[0] || null;

      if (state.phase !== 'playing' || !activeCard || state.isAnimating) {
        return null;
      }

      // Skip eliminated players
      if (currentPlayer?.isEliminated) {
        return null;
      }

      const event = activeCard;
      const isCorrect = isPlacementCorrect(state.timeline, event, insertionIndex);
      const correctPosition = findCorrectPosition(state.timeline, event);

      const result: PlacementResult = {
        success: isCorrect,
        event,
        correctPosition,
        attemptedPosition: insertionIndex,
      };

      if (isCorrect) {
        // Correct placement: insert into timeline, show green flash
        const newTimeline = insertIntoTimeline(state.timeline, event, correctPosition);
        const isSinglePlayer = state.players.length === 1;

        // For multiplayer, show popup IMMEDIATELY (T+0ms) - synced with confetti
        if (!isSinglePlayer) {
          const nextPlayerIndex = getNextActivePlayerIndex(state.currentPlayerIndex, state.players);
          const nextPlayer = state.players[nextPlayerIndex];

          setPendingPopupState({
            popup: {
              type: 'correct',
              event,
              nextPlayer,
            },
            pendingStateUpdate: null, // Will be set in T+600ms timeout
          });
        }

        setState((prev) => ({
          ...prev,
          timeline: newTimeline,
          isAnimating: true,
          animationPhase: 'flash',
          placementHistory: [...prev.placementHistory, true],
          lastPlacementResult: result,
        }));

        // After flash animation, finalize
        setTimeout(() => {
          // eslint-disable-next-line complexity
          setState((prev) => {
            const newPlayers = [...prev.players];
            const player = { ...newPlayers[prev.currentPlayerIndex] };
            const isSuddenDeath = prev.gameMode === 'suddenDeath';
            const isSinglePlayer = newPlayers.length === 1;
            let newDeck = prev.deck;

            // Remove card from hand
            player.hand = removeFromHand(player.hand, event.name);

            if (isSuddenDeath) {
              // In sudden death, draw a new card and add to hand
              const { card: newCard, newDeck: updatedDeck } = drawCard(prev.deck);
              if (newCard) {
                player.hand = addToHand(player.hand, newCard);
              }
              newDeck = updatedDeck;
            } else {
              // Check if player won (hand empty) - for non-sudden-death modes
              if (player.hand.length === 0) {
                player.hasWon = true;
                player.winTurn = prev.turnNumber;
              }
            }

            newPlayers[prev.currentPlayerIndex] = player;

            // Advance to next player
            const nextPlayerIndex = getNextActivePlayerIndex(prev.currentPlayerIndex, newPlayers);
            const isRoundEnding = isSinglePlayer || nextPlayerIndex === 0;
            const newRoundNumber = isRoundEnding ? prev.roundNumber + 1 : prev.roundNumber;

            let isGameOver = false;
            let finalWinners = prev.winners;
            let finalPlayers = newPlayers;

            let newActivePlayersAtRoundStart = prev.activePlayersAtRoundStart;

            if (isSuddenDeath && isRoundEnding) {
              // Use simplified end-of-round logic for sudden death
              const result = processEndOfRound(
                newPlayers,
                'suddenDeath',
                prev.activePlayersAtRoundStart
              );
              finalPlayers = result.updatedPlayers;
              isGameOver = result.gameOver;
              if (result.winners.length > 0) {
                finalWinners = result.winners;
              }
              // Update active players count for next round
              if (!isGameOver) {
                newActivePlayersAtRoundStart = finalPlayers.filter((p) => !p.isEliminated).length;
              }
            } else if (!isSuddenDeath) {
              // Non-sudden-death mode: use existing logic
              // Update winners list if player won by emptying hand
              if (player.hasWon && !prev.winners.some((w) => w.id === player.id)) {
                finalWinners = [...prev.winners, player];
              }
              isGameOver = shouldGameEnd(
                newPlayers,
                newRoundNumber,
                nextPlayerIndex,
                prev.gameMode!
              );
            }

            // For multiplayer correct placements, popup was already shown at T+0ms
            // Now set the pending state update
            const shouldShowPopup = !isSinglePlayer && !isGameOver;

            if (shouldShowPopup) {
              // Store pending state update to apply when popup is dismissed
              const pendingUpdate = () => {
                setState((s) => ({
                  ...s,
                  currentPlayerIndex: nextPlayerIndex,
                  turnNumber: s.turnNumber + 1,
                  roundNumber: newRoundNumber,
                  activePlayersAtRoundStart: newActivePlayersAtRoundStart,
                }));
              };

              // Update the pending popup state with the actual pending update
              // (popup is already visible, just adding the callback)
              setPendingPopupState((prevPopup) => ({
                ...prevPopup,
                pendingStateUpdate: pendingUpdate,
              }));

              return {
                ...prev,
                players: finalPlayers,
                deck: newDeck,
                winners: finalWinners,
                phase: isGameOver ? 'gameOver' : 'playing',
                isAnimating: false,
                animationPhase: null,
                // Don't advance turn yet - wait for popup dismiss
              };
            }

            return {
              ...prev,
              players: finalPlayers,
              deck: newDeck,
              currentPlayerIndex: isGameOver ? prev.currentPlayerIndex : nextPlayerIndex,
              turnNumber: prev.turnNumber + 1,
              roundNumber: newRoundNumber,
              winners: finalWinners,
              phase: isGameOver ? 'gameOver' : 'playing',
              isAnimating: false,
              animationPhase: null,
              activePlayersAtRoundStart: newActivePlayersAtRoundStart,
            };
          });
        }, 600);
      } else {
        // Wrong placement: show card at attempted position briefly, then remove
        const tempTimeline = insertIntoTimeline(state.timeline, event, insertionIndex);
        const isSinglePlayer = state.players.length === 1;

        // Show popup IMMEDIATELY (T+0ms) - synced with shake animation
        // Calculate next player info now for the popup
        const nextPlayerIndex = getNextActivePlayerIndex(state.currentPlayerIndex, state.players);
        const nextPlayer = !isSinglePlayer ? state.players[nextPlayerIndex] : undefined;

        // Set popup state immediately - the pending update will be set in the T+800ms timeout
        // when we know the final game state
        setPendingPopupState({
          popup: {
            type: 'incorrect',
            event,
            nextPlayer,
          },
          pendingStateUpdate: null, // Will be set in T+800ms timeout
        });

        setState((prev) => ({
          ...prev,
          timeline: tempTimeline,
          isAnimating: true,
          animationPhase: 'flash',
          placementHistory: [...prev.placementHistory, false],
          lastPlacementResult: result,
        }));

        // After red flash, remove card from timeline (card is discarded)
        setTimeout(() => {
          setState((prev) => {
            const timelineWithoutEvent = prev.timeline.filter((e) => e.name !== event.name);
            return {
              ...prev,
              timeline: timelineWithoutEvent,
              animationPhase: 'moving',
            };
          });
        }, 400);

        // After animation, finalize
        setTimeout(() => {
          setState((prev) => {
            const newPlayers = [...prev.players];
            const player = { ...newPlayers[prev.currentPlayerIndex] };
            const isSuddenDeath = prev.gameMode === 'suddenDeath';
            const isSinglePlayer = newPlayers.length === 1;
            let newDeck = prev.deck;

            // Remove card from hand (discarded)
            player.hand = removeFromHand(player.hand, event.name);

            if (!isSuddenDeath) {
              // Non-sudden death: draw replacement card
              const { card: newCard, newDeck: updatedDeck } = drawCard(prev.deck);
              if (newCard) {
                player.hand = addToHand(player.hand, newCard);
              }
              newDeck = updatedDeck;
            }
            // Sudden death: no replacement card drawn (hand shrinks)

            newPlayers[prev.currentPlayerIndex] = player;

            // Determine if round is ending
            const nextPlayerIndex = getNextActivePlayerIndex(prev.currentPlayerIndex, newPlayers);
            const isRoundEnding = isSinglePlayer || nextPlayerIndex === 0;
            const newRoundNumber = isRoundEnding ? prev.roundNumber + 1 : prev.roundNumber;

            let isGameOver = false;
            let finalWinners = prev.winners;
            let finalPlayers = newPlayers;
            let newActivePlayersAtRoundStart = prev.activePlayersAtRoundStart;

            if (isSuddenDeath && isRoundEnding) {
              // Use simplified end-of-round logic for sudden death
              const result = processEndOfRound(
                newPlayers,
                'suddenDeath',
                prev.activePlayersAtRoundStart
              );
              finalPlayers = result.updatedPlayers;
              isGameOver = result.gameOver;
              if (result.winners.length > 0) {
                finalWinners = result.winners;
              }

              // If reprieve granted, draw 1 new card for each active player
              if (result.grantReprieve) {
                finalPlayers.forEach((p) => {
                  if (!p.isEliminated) {
                    const { card: newCard, newDeck: updatedDeck } = drawCard(newDeck);
                    if (newCard) {
                      p.hand = addToHand(p.hand, newCard);
                    }
                    newDeck = updatedDeck;
                  }
                });
              }

              // Update active players count for next round
              if (!isGameOver) {
                newActivePlayersAtRoundStart = finalPlayers.filter((p) => !p.isEliminated).length;
              }
            } else if (!isSuddenDeath) {
              // Non-sudden-death mode: use existing logic
              isGameOver = shouldGameEnd(
                newPlayers,
                newRoundNumber,
                nextPlayerIndex,
                prev.gameMode!
              );
            }

            // Popup was already shown at T+0ms
            // Now set the pending state update that will be called when popup is dismissed
            const pendingUpdate = () => {
              setState((s) => ({
                ...s,
                currentPlayerIndex: isGameOver ? s.currentPlayerIndex : nextPlayerIndex,
                turnNumber: s.turnNumber + 1,
                roundNumber: newRoundNumber,
                activePlayersAtRoundStart: newActivePlayersAtRoundStart,
                phase: isGameOver ? 'gameOver' : 'playing',
              }));
            };

            // Update the pending popup state with the actual pending update
            // (popup is already visible, just adding the callback)
            setPendingPopupState((prevPopup) => ({
              ...prevPopup,
              pendingStateUpdate: pendingUpdate,
            }));

            return {
              ...prev,
              players: finalPlayers,
              deck: newDeck,
              winners: finalWinners,
              isAnimating: false,
              animationPhase: null,
              // Don't advance turn yet - wait for popup dismiss
            };
          });
        }, 800);
      }

      return result;
    },
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

  const resetGame = useCallback(() => {
    setState({ ...initialState, phase: 'modeSelect' });
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

  return {
    state,
    allEvents,
    startGame,
    placeCard,
    cycleHand,
    resetGame,
    restartGame,
    modalEvent,
    openModal,
    closeModal,
    pendingPopup: pendingPopupState.popup,
    showDescriptionPopup,
    dismissPopup,
  };
}
