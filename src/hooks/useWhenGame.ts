import { useState, useCallback, useEffect } from 'react';
import { HistoricalEvent, WhenGameState, PlacementResult, GameConfig } from '../types';
import { loadAllEvents, filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import { shuffleArray, sortByYear, isPlacementCorrect, findCorrectPosition, insertIntoTimeline } from '../utils/gameLogic';

const DEFAULT_TOTAL_TURNS = 8;

interface UseWhenGameReturn {
  state: WhenGameState;
  allEvents: HistoricalEvent[];
  startGame: (config: GameConfig) => void;
  placeCard: (insertionIndex: number) => PlacementResult | null;
  resetGame: () => void;
  restartGame: () => void;
  clearLastResult: () => void;
  // Modal state
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
}

const initialState: WhenGameState = {
  phase: 'loading',
  timeline: [],
  activeCard: null,
  deck: [],
  currentTurn: 0,
  totalTurns: DEFAULT_TOTAL_TURNS,
  correctPlacements: 0,
  lastPlacementResult: null,
  isAnimating: false,
  lastConfig: null,
};

export function useWhenGame(): UseWhenGameReturn {
  const [state, setState] = useState<WhenGameState>(initialState);
  const [allEvents, setAllEvents] = useState<HistoricalEvent[]>([]);
  const [modalEvent, setModalEvent] = useState<HistoricalEvent | null>(null);

  // Load events on mount
  useEffect(() => {
    loadAllEvents().then((events) => {
      setAllEvents(events);
      setState((prev) => ({ ...prev, phase: 'ready' }));
    });
  }, []);

  const startGame = useCallback((config: GameConfig) => {
    const { totalTurns, selectedDifficulties, selectedCategories, selectedEras } = config;

    // Apply filters to get available events
    let filteredEvents = filterByDifficulty(allEvents, selectedDifficulties);
    filteredEvents = filterByCategory(filteredEvents, selectedCategories);
    filteredEvents = filterByEra(filteredEvents, selectedEras);

    if (filteredEvents.length < totalTurns + 1) {
      console.error('Not enough events to start the game');
      return;
    }

    const shuffled = shuffleArray(filteredEvents);

    // Pick 1 event for the starting timeline (always 1)
    const timelineEvents = sortByYear([shuffled[0]]);

    // Take totalTurns cards for the deck (cards to play)
    const deckEvents = shuffled.slice(1, totalTurns + 1);

    // First card becomes the active card
    const [firstCard, ...remainingDeck] = deckEvents;

    setState({
      phase: 'playing',
      timeline: timelineEvents,
      activeCard: firstCard,
      deck: remainingDeck,
      currentTurn: 1,
      totalTurns,
      correctPlacements: 0,
      lastPlacementResult: null,
      isAnimating: false,
      lastConfig: config,
    });
  }, [allEvents]);

  const placeCard = useCallback((insertionIndex: number): PlacementResult | null => {
    if (state.phase !== 'playing' || !state.activeCard || state.isAnimating) {
      return null;
    }

    const event = state.activeCard;
    const isCorrect = isPlacementCorrect(state.timeline, event, insertionIndex);
    const correctPosition = findCorrectPosition(state.timeline, event);

    const result: PlacementResult = {
      success: isCorrect,
      event,
      correctPosition,
      attemptedPosition: insertionIndex,
    };

    // Set animating state
    setState((prev) => ({
      ...prev,
      isAnimating: true,
      lastPlacementResult: result,
    }));

    // After animation delay, update the game state
    const animationDelay = isCorrect ? 600 : 1200; // Longer delay for incorrect to show flip animation

    setTimeout(() => {
      setState((prev) => {
        // Insert the card at the correct position
        const newTimeline = insertIntoTimeline(prev.timeline, event, correctPosition);

        // Draw next card
        const [nextCard, ...remainingDeck] = prev.deck;
        const newTurn = prev.currentTurn + 1;
        const isGameOver = newTurn > prev.totalTurns;

        return {
          ...prev,
          timeline: newTimeline,
          activeCard: isGameOver ? null : (nextCard || null),
          deck: remainingDeck,
          currentTurn: newTurn,
          correctPlacements: isCorrect ? prev.correctPlacements + 1 : prev.correctPlacements,
          phase: isGameOver ? 'gameOver' : 'playing',
          isAnimating: false,
        };
      });
    }, animationDelay);

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.activeCard, state.timeline, state.isAnimating]);

  const clearLastResult = useCallback(() => {
    setState((prev) => ({ ...prev, lastPlacementResult: null }));
  }, []);

  const resetGame = useCallback(() => {
    setState({ ...initialState, phase: 'ready' });
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
    clearLastResult,
    modalEvent,
    openModal,
    closeModal,
  };
}
