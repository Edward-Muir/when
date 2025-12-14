import { useState, useCallback, useEffect } from 'react';
import { HistoricalEvent, WhenGameState, PlacementResult, GameConfig } from '../types';
import { loadAllEvents, filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
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
} from '../utils/gameLogic';

interface UseWhenGameReturn {
  state: WhenGameState;
  allEvents: HistoricalEvent[];
  startGame: (config: GameConfig) => void;
  placeCard: (insertionIndex: number) => PlacementResult | null;
  resetGame: () => void;
  restartGame: () => void;
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
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
};

export function useWhenGame(): UseWhenGameReturn {
  const [state, setState] = useState<WhenGameState>(initialState);
  const [allEvents, setAllEvents] = useState<HistoricalEvent[]>([]);
  const [modalEvent, setModalEvent] = useState<HistoricalEvent | null>(null);

  // Load events on mount
  useEffect(() => {
    loadAllEvents().then((events) => {
      setAllEvents(events);
      setState((prev) => ({ ...prev, phase: 'modeSelect' }));
    });
  }, []);

  const startGame = useCallback((config: GameConfig) => {
    const {
      mode,
      selectedDifficulties,
      selectedCategories,
      selectedEras,
      dailySeed,
      playerCount = 1,
      playerNames = [],
      cardsPerHand = 5,
    } = config;

    // Apply filters to get available events
    let filteredEvents = filterByDifficulty(allEvents, selectedDifficulties);
    filteredEvents = filterByCategory(filteredEvents, selectedCategories);
    filteredEvents = filterByEra(filteredEvents, selectedEras);

    // Calculate minimum required cards
    const minRequired = (playerCount * cardsPerHand) + 1 + (playerCount * 2);

    if (filteredEvents.length < minRequired) {
      console.error('Not enough events to start the game');
      return;
    }

    // Use seeded shuffle for daily mode, regular shuffle otherwise
    const shuffled = mode === 'daily' && dailySeed
      ? shuffleArraySeeded(filteredEvents, dailySeed)
      : shuffleArray(filteredEvents);

    // Pick 1 event for the starting timeline
    const timelineEvents = sortByYear([shuffled[0]]);
    const deckForGame = shuffled.slice(1);

    // Initialize players with hands (even for single player)
    const { players, remainingDeck } = initializePlayers(
      playerCount,
      playerNames,
      cardsPerHand,
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
    });
  }, [allEvents]);

  const placeCard = useCallback((insertionIndex: number): PlacementResult | null => {
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
        setState((prev) => {
          const newPlayers = [...prev.players];
          const player = { ...newPlayers[prev.currentPlayerIndex] };

          // Remove card from hand
          player.hand = removeFromHand(player.hand, event.name);

          // Check if player won (hand empty)
          if (player.hand.length === 0) {
            player.hasWon = true;
            player.winTurn = prev.turnNumber;
          }

          newPlayers[prev.currentPlayerIndex] = player;

          // Advance to next player
          const nextPlayerIndex = getNextActivePlayerIndex(prev.currentPlayerIndex, newPlayers);
          const newRoundNumber = nextPlayerIndex === 0 ? prev.roundNumber + 1 : prev.roundNumber;

          // Update winners list
          const newWinners = player.hasWon && !prev.winners.some(w => w.id === player.id)
            ? [...prev.winners, player]
            : prev.winners;

          // Check if game should end
          const isGameOver = shouldGameEnd(newPlayers, newRoundNumber, nextPlayerIndex, prev.gameMode!);

          return {
            ...prev,
            players: newPlayers,
            currentPlayerIndex: nextPlayerIndex,
            turnNumber: prev.turnNumber + 1,
            roundNumber: newRoundNumber,
            winners: newWinners,
            phase: isGameOver ? 'gameOver' : 'playing',
            isAnimating: false,
            animationPhase: null,
          };
        });
      }, 600);
    } else {
      // Wrong placement: show card at attempted position briefly, then remove
      const tempTimeline = insertIntoTimeline(state.timeline, event, insertionIndex);

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
          const timelineWithoutEvent = prev.timeline.filter(e => e.name !== event.name);
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

          // Remove card from hand (discarded)
          player.hand = removeFromHand(player.hand, event.name);

          if (isSuddenDeath) {
            // Sudden death: player is eliminated
            player.isEliminated = true;
          } else {
            // Draw replacement card
            const { card: newCard, newDeck } = drawCard(prev.deck);
            if (newCard) {
              player.hand = addToHand(player.hand, newCard);
            }
            prev.deck = newDeck;
          }

          newPlayers[prev.currentPlayerIndex] = player;

          // Advance to next player
          const nextPlayerIndex = getNextActivePlayerIndex(prev.currentPlayerIndex, newPlayers);
          const newRoundNumber = nextPlayerIndex === 0 ? prev.roundNumber + 1 : prev.roundNumber;

          // Check if game should end
          const isGameOver = shouldGameEnd(newPlayers, newRoundNumber, nextPlayerIndex, prev.gameMode!);

          return {
            ...prev,
            players: newPlayers,
            deck: isSuddenDeath ? prev.deck : prev.deck,
            currentPlayerIndex: nextPlayerIndex,
            turnNumber: prev.turnNumber + 1,
            roundNumber: newRoundNumber,
            phase: isGameOver ? 'gameOver' : 'playing',
            isAnimating: false,
            animationPhase: null,
          };
        });
      }, 800);
    }

    return result;
  }, [state.phase, state.players, state.currentPlayerIndex, state.timeline, state.isAnimating]);

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

  return {
    state,
    allEvents,
    startGame,
    placeCard,
    resetGame,
    restartGame,
    modalEvent,
    openModal,
    closeModal,
  };
}
