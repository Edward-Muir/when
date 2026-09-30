import {
  calculatePlacementResult,
  processCorrectPlacement,
  processIncorrectPlacement,
} from './placementLogic';
import { HistoricalEvent, Player, WhenGameState } from '../types';

function ev(name: string, year: number, yearEnd?: number): HistoricalEvent {
  return {
    name,
    friendly_name: name,
    year,
    ...(yearEnd === undefined ? {} : { year_end: yearEnd }),
    category: 'empires',
    description: 'Test event',
    difficulty: 'medium',
  };
}

const board = [ev('a', 1100), ev('b', 1366), ev('c', 1500)];

describe('calculatePlacementResult closeEnough', () => {
  it('is false for a strict hit', () => {
    const result = calculatePlacementResult(board, ev('x', 1200), 1);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(false);
  });

  it('is true when only the card’s own range made it pass', () => {
    // 1354 belongs before 1366; the window reaching 1400 is what allows gap 2.
    const result = calculatePlacementResult(board, ev('x', 1354, 1400), 2);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(true);
  });

  it('is false when the same ranged card is placed at its point-year slot', () => {
    const result = calculatePlacementResult(board, ev('x', 1354, 1400), 1);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(false);
  });

  it('is true when a ranged neighbour widened the band for an exact card', () => {
    const ranged = [ev('a', 1100), ev('b', 1200, 1400), ev('c', 1500)];
    const result = calculatePlacementResult(ranged, ev('x', 1366), 1);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(true);
  });

  it('is false on a failure', () => {
    const result = calculatePlacementResult(board, ev('x', 1200, 1250), 3);
    expect(result.success).toBe(false);
    expect(result.closeEnough).toBe(false);
  });

  it('does not wrap to the last card when placing at gap 0', () => {
    // `.at(-1)` would pick up the 1500 card and wrongly mark this close-enough.
    const result = calculatePlacementResult(board, ev('x', 900), 0);
    expect(result.success).toBe(true);
    expect(result.closeEnough).toBe(false);
  });

  it('reports the attempted position alongside the canonical one', () => {
    const result = calculatePlacementResult(board, ev('x', 1354, 1400), 2);
    expect(result.attemptedPosition).toBe(2);
    expect(result.correctPosition).toBe(1);
  });
});

// --- Turn resolution -----------------------------------------------------------------------
// processCorrectPlacement / processIncorrectPlacement share the whole end-of-turn tail (round
// end, elimination, winners, the active-player recount). These pin every branch of it.

function player(id: number, hand: HistoricalEvent[], extra: Partial<Player> = {}): Player {
  return { id, name: `P${id}`, hand, hasWon: false, placementHistory: [], ...extra };
}

function stateWith(
  players: Player[],
  deck: HistoricalEvent[],
  extra: Partial<WhenGameState> = {}
): WhenGameState {
  return {
    players,
    deck,
    currentPlayerIndex: 0,
    turnNumber: 1,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: players.length,
    ...extra,
  } as WhenGameState;
}

const [h1, h2, h3, d1, d2, d3] = ['h1', 'h2', 'h3', 'd1', 'd2', 'd3'].map((n, i) =>
  ev(n, 1000 + i)
);
const names = (cards: HistoricalEvent[]) => cards.map((c) => c.name);

describe('processCorrectPlacement', () => {
  it('single player: draws a replacement and ends the round', () => {
    const update = processCorrectPlacement(stateWith([player(0, [h1, h2])], [d1, d2]), h1);

    expect(names(update.players[0].hand)).toEqual(['h2', 'd1']);
    expect(names(update.deck)).toEqual(['d2']);
    expect(update.players[0].placementHistory).toEqual([true]);
    expect(update).toMatchObject({
      currentPlayerIndex: 0,
      turnNumber: 2,
      roundNumber: 2,
      activePlayersAtRoundStart: 1,
      winners: [],
      isGameOver: false,
    });
  });

  it('single player: an empty deck shrinks the hand, and the last card ends the game', () => {
    const update = processCorrectPlacement(stateWith([player(0, [h1])], []), h1);

    expect(update.players[0].hand).toEqual([]);
    expect(update.players[0].isEliminated).toBe(true);
    expect(update).toMatchObject({ isGameOver: true, winners: [], currentPlayerIndex: 0 });
  });

  it('multiplayer mid-round: passes the turn without ending the round', () => {
    const state = stateWith([player(0, [h1]), player(1, [h2])], [d1]);
    const update = processCorrectPlacement(state, h1);

    expect(names(update.players[0].hand)).toEqual(['d1']);
    expect(update).toMatchObject({
      currentPlayerIndex: 1,
      roundNumber: 1,
      activePlayersAtRoundStart: 2,
      isGameOver: false,
    });
  });

  it('multiplayer round end: eliminates empty hands and crowns the last player standing', () => {
    // P0 emptied their hand earlier this round; P1 places correctly and keeps a card.
    const state = stateWith([player(0, []), player(1, [h2, h3])], [], { currentPlayerIndex: 1 });
    const update = processCorrectPlacement(state, h2);

    expect(update.players[0].isEliminated).toBe(true);
    expect(update.winners.map((p) => p.id)).toEqual([1]);
    expect(update).toMatchObject({ isGameOver: true, currentPlayerIndex: 1, roundNumber: 2 });
  });
});

describe('processIncorrectPlacement', () => {
  it('single player: discards without drawing', () => {
    const update = processIncorrectPlacement(stateWith([player(0, [h1, h2])], [d1]), h1);

    expect(names(update.players[0].hand)).toEqual(['h2']);
    expect(names(update.deck)).toEqual(['d1']);
    expect(update.players[0].placementHistory).toEqual([false]);
    expect(update).toMatchObject({ roundNumber: 2, turnNumber: 2, isGameOver: false });
  });

  it('single player: losing the last card ends the game with no winner', () => {
    const update = processIncorrectPlacement(stateWith([player(0, [h1])], [d1]), h1);

    expect(update).toMatchObject({ isGameOver: true, winners: [], currentPlayerIndex: 0 });
    expect(names(update.deck)).toEqual(['d1']);
  });

  it('multiplayer mid-round: passes the turn', () => {
    const state = stateWith([player(0, [h1, h2]), player(1, [h3])], [d1]);
    const update = processIncorrectPlacement(state, h1);

    expect(names(update.players[0].hand)).toEqual(['h2']);
    expect(update).toMatchObject({ currentPlayerIndex: 1, roundNumber: 1, isGameOver: false });
  });

  it('multiplayer round end: eliminates the emptied hand and recounts active players', () => {
    const state = stateWith([player(0, [h1]), player(1, [h2]), player(2, [h3, d3])], [d1], {
      currentPlayerIndex: 2,
    });
    // P2 misses but keeps a card; nobody is empty, so all three continue.
    const cont = processIncorrectPlacement(state, h3);
    expect(cont).toMatchObject({ isGameOver: false, currentPlayerIndex: 0, roundNumber: 2 });
    expect(cont.activePlayersAtRoundStart).toBe(3);

    // P1 already emptied this round; P2's miss ends it and eliminates P1 only.
    const state2 = stateWith([player(0, [h1]), player(1, []), player(2, [h3, d3])], [d1], {
      currentPlayerIndex: 2,
    });
    const elim = processIncorrectPlacement(state2, h3);
    expect(elim.players.map((p) => !!p.isEliminated)).toEqual([false, true, false]);
    expect(elim).toMatchObject({ isGameOver: false, activePlayersAtRoundStart: 2 });
  });

  it('multiplayer reprieve: when everyone empties together, each active player draws one', () => {
    const state = stateWith([player(0, []), player(1, [h2])], [d1, d2, d3], {
      currentPlayerIndex: 1,
    });
    const update = processIncorrectPlacement(state, h2);

    expect(update.players.map((p) => names(p.hand))).toEqual([['d1'], ['d2']]);
    expect(names(update.deck)).toEqual(['d3']);
    expect(update.players.some((p) => p.isEliminated)).toBe(false);
    expect(update).toMatchObject({
      isGameOver: false,
      winners: [],
      activePlayersAtRoundStart: 2,
      currentPlayerIndex: 0,
    });
  });
});
