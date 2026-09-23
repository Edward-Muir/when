import { HistoricalEvent, Player, WhenGameState, PlacementResult, GamePopupData } from '../types';
import {
  isPlacementCorrect,
  isPointPlacementCorrect,
  isRangedEvent,
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
 *
 * `closeEnough` marks a success that was won on a window: it passed, but would not have with
 * every interval collapsed to its `year`. The second clause — that the card or one of the two
 * it landed between actually spans a range — is load-bearing rather than decorative. Once a
 * board carries ranges it is no longer sorted by `year`, so the collapsed predicate can go
 * degenerate (a left bound above the right bound) and start reporting every placement as
 * close-enough. It is also the version that can be explained: you get the banner when the card
 * you placed, or one of the two it landed between, spans a range.
 */
export function calculatePlacementResult(
  timeline: HistoricalEvent[],
  event: HistoricalEvent,
  insertionIndex: number
): PlacementResult {
  const isCorrect = isPlacementCorrect(timeline, event, insertionIndex);
  const correctPosition = findCorrectPosition(timeline, event);

  // `.at(-1)` wraps to the last element, so gap 0 must be guarded explicitly.
  const left = insertionIndex > 0 ? timeline.at(insertionIndex - 1) : undefined;
  const right = insertionIndex < timeline.length ? timeline.at(insertionIndex) : undefined;
  const neighbours = [event, left, right];
  const closeEnough =
    isCorrect &&
    !isPointPlacementCorrect(timeline, event, insertionIndex) &&
    neighbours.some((e) => e != null && isRangedEvent(e));

  return {
    success: isCorrect,
    event,
    correctPosition,
    attemptedPosition: insertionIndex,
    closeEnough,
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
 * Process a correct placement and return the state updates. The card leaves the hand and a
 * replacement is drawn, so the hand stays the same size until the deck runs out.
 */
export function processCorrectPlacement(
  state: WhenGameState,
  event: HistoricalEvent
): PlacementStateUpdate {
  const { card, newDeck } = drawCard(state.deck);
  return resolveTurn(state, event, true, (hand) => (card ? addToHand(hand, card) : hand), newDeck);
}

/**
 * Process an incorrect placement and return the state updates. The card is discarded and no
 * replacement is drawn: the hand shrinks, and the game ends once it empties.
 */
export function processIncorrectPlacement(
  state: WhenGameState,
  event: HistoricalEvent
): PlacementStateUpdate {
  return resolveTurn(state, event, false, (hand) => hand, state.deck);
}

/**
 * The turn tail both placements share: record the placement, take the card out of the hand
 * (`refill` then adds whatever the outcome draws), pass the turn, and at the end of a round
 * eliminate empty hands and settle the winners.
 *
 * The reprieve draw (every active player gets one card when all of them emptied together) is
 * applied only after a miss. A correct placement can only empty a hand once the deck is
 * exhausted, and then there is nothing left to draw anyway.
 */
function resolveTurn(
  state: WhenGameState,
  event: HistoricalEvent,
  correct: boolean,
  refill: (hand: HistoricalEvent[]) => HistoricalEvent[],
  deck: HistoricalEvent[]
): PlacementStateUpdate {
  const newPlayers = [...state.players];
  const player = { ...newPlayers[state.currentPlayerIndex] };
  player.placementHistory = [...player.placementHistory, correct];
  player.hand = refill(removeFromHand(player.hand, event.name));
  newPlayers[state.currentPlayerIndex] = player;

  const nextPlayerIndex = getNextActivePlayerIndex(state.currentPlayerIndex, newPlayers);
  const isRoundEnding = newPlayers.length === 1 || nextPlayerIndex === 0;

  let newDeck = deck;
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

    if (!correct && result.grantReprieve) {
      finalPlayers.forEach((p) => {
        if (!p.isEliminated) {
          const { card, newDeck: updatedDeck } = drawCard(newDeck);
          if (card) {
            p.hand = addToHand(p.hand, card);
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
    roundNumber: isRoundEnding ? state.roundNumber + 1 : state.roundNumber,
    activePlayersAtRoundStart: newActivePlayersAtRoundStart,
    winners: finalWinners,
    isGameOver,
  };
}

/**
 * Build popup data for a placement result. Multiplayer only — single player gets the
 * tombstone reveal and the hint strip instead of a blocking popup.
 */
export function buildPopupData(
  result: PlacementResult,
  nextPlayer: Player | undefined
): GamePopupData {
  return {
    type: result.success ? 'correct' : 'incorrect',
    event: result.event,
    nextPlayer,
    closeEnough: result.closeEnough,
  };
}
