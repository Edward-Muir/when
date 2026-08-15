import { HistoricalEvent, Player, WhenGameState, PlacementResult, GamePopupData } from '../types';
import {
  isPlacementCorrect,
  findCorrectPosition,
  removeFromHand,
  addToHand,
  drawCard,
  getNextActivePlayerIndex,
  processEndOfRound,
} from './gameLogic';

/**
 * Validation result for a placement attempt
 */
export interface PlacementValidation {
  activeCard: HistoricalEvent;
  currentPlayer: Player;
}

/**
 * Validate that a placement can be attempted
 * Returns null if placement should be rejected
 */
export function validatePlacement(
  state: WhenGameState,
  currentPlayer: Player | undefined
): PlacementValidation | null {
  if (state.phase !== 'playing' || state.isAnimating) {
    return null;
  }

  if (!currentPlayer || currentPlayer.isEliminated) {
    return null;
  }

  const activeCard = currentPlayer.hand[0];
  if (!activeCard) {
    return null;
  }

  return { activeCard, currentPlayer };
}

/**
 * Calculate the result of a placement attempt
 */
export function calculatePlacementResult(
  timeline: HistoricalEvent[],
  event: HistoricalEvent,
  insertionIndex: number
): PlacementResult {
  const isCorrect = isPlacementCorrect(timeline, event, insertionIndex);
  const correctPosition = findCorrectPosition(timeline, event);

  return {
    success: isCorrect,
    event,
    correctPosition,
    attemptedPosition: insertionIndex,
  };
}

/**
 * State update data returned by placement processing functions
 */
export interface PlacementStateUpdate {
  players: Player[];
  deck: HistoricalEvent[];
  currentPlayerIndex: number;
  turnNumber: number;
  roundNumber: number;
  activePlayersAtRoundStart: number;
  winners: Player[];
  isGameOver: boolean;
}

/**
 * Process a correct placement and return the state updates
 */
export function processCorrectPlacement(
  state: WhenGameState,
  event: HistoricalEvent
): PlacementStateUpdate {
  const newPlayers = [...state.players];
  const player = { ...newPlayers[state.currentPlayerIndex] };
  const isSinglePlayer = newPlayers.length === 1;
  let newDeck = state.deck;

  // Track per-player placement
  player.placementHistory = [...player.placementHistory, true];

  // Remove card from hand
  player.hand = removeFromHand(player.hand, event.name);

  // Correct placement draws a replacement, so the hand stays the same size
  const { card: newCard, newDeck: updatedDeck } = drawCard(state.deck);
  if (newCard) {
    player.hand = addToHand(player.hand, newCard);
  }
  newDeck = updatedDeck;

  newPlayers[state.currentPlayerIndex] = player;

  // Advance to next player
  const nextPlayerIndex = getNextActivePlayerIndex(state.currentPlayerIndex, newPlayers);
  const isRoundEnding = isSinglePlayer || nextPlayerIndex === 0;
  const newRoundNumber = isRoundEnding ? state.roundNumber + 1 : state.roundNumber;

  let isGameOver = false;
  let finalWinners = state.winners;
  let finalPlayers = newPlayers;
  let newActivePlayersAtRoundStart = state.activePlayersAtRoundStart;

  if (isRoundEnding) {
    const result = processEndOfRound(newPlayers, state.activePlayersAtRoundStart);
    finalPlayers = result.updatedPlayers;
    isGameOver = result.gameOver;
    if (result.winners.length > 0) {
      finalWinners = result.winners;
    }
    // Update active players count for next round
    if (!isGameOver) {
      newActivePlayersAtRoundStart = finalPlayers.filter((p) => !p.isEliminated).length;
    }
  }

  return {
    players: finalPlayers,
    deck: newDeck,
    currentPlayerIndex: isGameOver ? state.currentPlayerIndex : nextPlayerIndex,
    turnNumber: state.turnNumber + 1,
    roundNumber: newRoundNumber,
    activePlayersAtRoundStart: newActivePlayersAtRoundStart,
    winners: finalWinners,
    isGameOver,
  };
}

/**
 * Process an incorrect placement and return the state updates
 */
export function processIncorrectPlacement(
  state: WhenGameState,
  event: HistoricalEvent
): PlacementStateUpdate {
  const newPlayers = [...state.players];
  const player = { ...newPlayers[state.currentPlayerIndex] };
  const isSinglePlayer = newPlayers.length === 1;
  let newDeck = state.deck;

  // Track per-player placement
  player.placementHistory = [...player.placementHistory, false];

  // Remove card from hand (discarded). No replacement is drawn — the hand shrinks,
  // and the game ends once it empties.
  player.hand = removeFromHand(player.hand, event.name);

  newPlayers[state.currentPlayerIndex] = player;

  // Determine if round is ending
  const nextPlayerIndex = getNextActivePlayerIndex(state.currentPlayerIndex, newPlayers);
  const isRoundEnding = isSinglePlayer || nextPlayerIndex === 0;
  const newRoundNumber = isRoundEnding ? state.roundNumber + 1 : state.roundNumber;

  let isGameOver = false;
  let finalWinners = state.winners;
  let finalPlayers = newPlayers;
  let newActivePlayersAtRoundStart = state.activePlayersAtRoundStart;

  if (isRoundEnding) {
    const result = processEndOfRound(newPlayers, state.activePlayersAtRoundStart);
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
  }

  return {
    players: finalPlayers,
    deck: newDeck,
    currentPlayerIndex: isGameOver ? state.currentPlayerIndex : nextPlayerIndex,
    turnNumber: state.turnNumber + 1,
    roundNumber: newRoundNumber,
    activePlayersAtRoundStart: newActivePlayersAtRoundStart,
    winners: finalWinners,
    isGameOver,
  };
}

/**
 * Build popup data for placement result
 */
export function buildPopupData(
  type: 'correct' | 'incorrect',
  event: HistoricalEvent,
  nextPlayer: Player | undefined
): GamePopupData {
  return {
    type,
    event,
    nextPlayer,
  };
}
