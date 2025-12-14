import { useState, useCallback, useEffect } from 'react';
import { HistoricalEvent, WhenGameState, PlacementResult, GameConfig } from '../types';
import { loadAllEvents, filterByDifficulty, filterByCategory, filterByEra } from '../utils/eventLoader';
import { shuffleArray, shuffleArraySeeded, sortByYear, isPlacementCorrect, findCorrectPosition, insertIntoTimeline } from '../utils/gameLogic';

const DEFAULT_TOTAL_TURNS = 8;

interface UseWhenGameReturn {
  state: WhenGameState;
  allEvents: HistoricalEvent[];
  startGame: (config: GameConfig) => void;
  placeCard: (insertionIndex: number) => PlacementResult | null;
  resetGame: () => void;
  restartGame: () => void;
  // Modal state
  modalEvent: HistoricalEvent | null;
  openModal: (event: HistoricalEvent) => void;
  closeModal: () => void;
}

const initialState: WhenGameState = {
  phase: 'loading',
  gameMode: null,
  timeline: [],
  activeCard: null,
  deck: [],
  currentTurn: 0,
  totalTurns: DEFAULT_TOTAL_TURNS,
  correctPlacements: 0,
  lastPlacementResult: null,
  isAnimating: false,
  animationPhase: null,
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
      setState((prev) => ({ ...prev, phase: 'modeSelect' }));
    });
  }, []);

  const startGame = useCallback((config: GameConfig) => {
    const { mode, totalTurns, selectedDifficulties, selectedCategories, selectedEras, dailySeed } = config;

    // Apply filters to get available events
    let filteredEvents = filterByDifficulty(allEvents, selectedDifficulties);
    filteredEvents = filterByCategory(filteredEvents, selectedCategories);
    filteredEvents = filterByEra(filteredEvents, selectedEras);

    // For sudden death, we need at least 2 cards
    const minRequired = mode === 'suddenDeath' ? 2 : totalTurns + 1;
    if (filteredEvents.length < minRequired) {
      console.error('Not enough events to start the game');
      return;
    }

    // Use seeded shuffle for daily mode, regular shuffle otherwise
    const shuffled = mode === 'daily' && dailySeed
      ? shuffleArraySeeded(filteredEvents, dailySeed)
      : shuffleArray(filteredEvents);

    // Pick 1 event for the starting timeline (always 1)
    const timelineEvents = sortByYear([shuffled[0]]);

    // For sudden death, use all remaining cards; otherwise use totalTurns
    const deckSize = mode === 'suddenDeath' ? shuffled.length - 1 : totalTurns;
    const deckEvents = shuffled.slice(1, deckSize + 1);

    // First card becomes the active card
    const [firstCard, ...remainingDeck] = deckEvents;

    // For sudden death, totalTurns is effectively the deck size (for display purposes)
    const effectiveTotalTurns = mode === 'suddenDeath' ? deckEvents.length : totalTurns;

    setState({
      phase: 'playing',
      gameMode: mode,
      timeline: timelineEvents,
      activeCard: firstCard,
      deck: remainingDeck,
      currentTurn: 1,
      totalTurns: effectiveTotalTurns,
      correctPlacements: 0,
      lastPlacementResult: null,
      isAnimating: false,
      animationPhase: null,
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

    if (isCorrect) {
      // Correct placement: insert immediately at correct position, show green flash
      const newTimeline = insertIntoTimeline(state.timeline, event, correctPosition);

      setState((prev) => ({
        ...prev,
        timeline: newTimeline,
        activeCard: null, // Remove from hand immediately
        isAnimating: true,
        animationPhase: 'flash',
        lastPlacementResult: result,
      }));

      // After flash animation, finalize
      setTimeout(() => {
        setState((prev) => {
          const [nextCard, ...remainingDeck] = prev.deck;
          const newTurn = prev.currentTurn + 1;
          const isSuddenDeath = prev.gameMode === 'suddenDeath';
          const noMoreCards = !nextCard && remainingDeck.length === 0;
          const turnsExhausted = newTurn > prev.totalTurns;
          const isGameOver = noMoreCards || (!isSuddenDeath && turnsExhausted);

          return {
            ...prev,
            activeCard: isGameOver ? null : (nextCard || null),
            deck: remainingDeck,
            currentTurn: newTurn,
            correctPlacements: prev.correctPlacements + 1,
            phase: isGameOver ? 'gameOver' : 'playing',
            isAnimating: false,
            animationPhase: null,
          };
        });
      }, 600);
    } else {
      // Incorrect placement: insert at attempted position first, show red flash
      const tempTimeline = insertIntoTimeline(state.timeline, event, insertionIndex);

      setState((prev) => ({
        ...prev,
        timeline: tempTimeline,
        activeCard: null, // Remove from hand immediately
        isAnimating: true,
        animationPhase: 'flash',
        lastPlacementResult: result,
      }));

      // After red flash, move to correct position
      setTimeout(() => {
        setState((prev) => {
          // Remove from attempted position and insert at correct position
          const timelineWithoutEvent = prev.timeline.filter(e => e.name !== event.name);
          const newTimeline = insertIntoTimeline(timelineWithoutEvent, event, correctPosition);

          return {
            ...prev,
            timeline: newTimeline,
            animationPhase: 'moving',
          };
        });
      }, 400);

      // After move animation, finalize
      setTimeout(() => {
        setState((prev) => {
          const [nextCard, ...remainingDeck] = prev.deck;
          const newTurn = prev.currentTurn + 1;
          const isSuddenDeath = prev.gameMode === 'suddenDeath';
          const suddenDeathLoss = isSuddenDeath;
          const noMoreCards = !nextCard && remainingDeck.length === 0;
          const turnsExhausted = newTurn > prev.totalTurns;
          const isGameOver = suddenDeathLoss || noMoreCards || (!isSuddenDeath && turnsExhausted);

          return {
            ...prev,
            activeCard: isGameOver ? null : (nextCard || null),
            deck: remainingDeck,
            currentTurn: newTurn,
            phase: isGameOver ? 'gameOver' : 'playing',
            isAnimating: false,
            animationPhase: null,
          };
        });
      }, 800);
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.activeCard, state.timeline, state.isAnimating]);

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
