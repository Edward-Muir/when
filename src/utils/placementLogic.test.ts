import {
  calculatePlacementResult,
  processCorrectPlacement,
  processIncorrectPlacement,
  processPass,
} from './placementLogic';
import { HistoricalEvent, Player, WhenGameState } from '../types';
import { buildDifficultyIndex } from './difficultyScore';
import { STARTING_PASSES, passesLeft, seededRandom } from './gameLogic';

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

    // The drawn card lands on top of the hand, ahead of the card that was second.
    expect(names(update.players[0].hand)).toEqual(['d1', 'h2']);
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

  it('after a miss, draws the card with the most room on the board, not the top card', () => {
    // A board of 1200 | 1500 with the placed card on it already, as the hook passes it.
    const catalogue = Array.from({ length: 101 }, (_, i) => ev(`cat${i}`, 1000 + i * 10));
    const index = buildDifficultyIndex(catalogue);
    const wedged = ev('wedged', 1495);
    const open = ev('open', 1850);
    const missed = { ...player(0, [h1, h2]), placementHistory: [false] };
    const state = stateWith([missed], [wedged, open], {
      timeline: [ev('seed', 1200), ev('placed', 1500)],
    });

    expect(names(processCorrectPlacement(state, h1).players[0].hand)).toEqual(['wedged', 'h2']);
    const update = processCorrectPlacement(state, h1, index);
    expect(names(update.players[0].hand)).toEqual(['open', 'h2']);
    expect(names(update.deck)).toEqual(['wedged']);
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

describe('processPass', () => {
  const playing = (
    players: Player[],
    deck: HistoricalEvent[],
    extra: Partial<WhenGameState> = {}
  ) => stateWith(players, deck, { phase: 'playing', isAnimating: false, timeline: [], ...extra });

  it('discards the active card and draws the new one onto the top of the hand', () => {
    const update = processPass(playing([player(0, [h1, h2, h3])], [d1, d2]));

    expect(names(update!.players[0].hand)).toEqual(['d1', 'h2', 'h3']);
    expect(names(update!.deck)).toEqual(['d2']);
    expect(names(update!.passedCards)).toEqual(['h1']);
    expect(update!.players[0].passesUsed).toBe(1);
  });

  it('is not a placement: no history, and the update carries no turn', () => {
    const update = processPass(playing([player(0, [h1, h2])], [d1]));

    expect(update!.players[0].placementHistory).toEqual([]);
    expect(Object.keys(update!).sort()).toEqual(['deck', 'passedCards', 'players']);
  });

  it('replaces the only card of a one-card hand', () => {
    const update = processPass(playing([player(0, [h1])], [d1]));
    expect(names(update!.players[0].hand)).toEqual(['d1']);
  });

  it('adds to the cards already passed, in order', () => {
    const update = processPass(
      playing([player(0, [h2, h3], { passesUsed: 1 })], [d1], { passedCards: [h1] })
    );
    expect(names(update!.passedCards)).toEqual(['h1', 'h2']);
    expect(update!.players[0].passesUsed).toBe(2);
  });

  it('is refused with no pass left, and granted again once a streak earns one', () => {
    const spent = { passesUsed: STARTING_PASSES };
    expect(processPass(playing([player(0, [h1, h2], spent)], [d1]))).toBeNull();

    const earned = { ...spent, placementHistory: [true, true, true] };
    expect(processPass(playing([player(0, [h1, h2], earned)], [d1]))).not.toBeNull();
  });

  // Load-bearing: a pass that discarded without drawing would shrink the hand, which only a
  // miss or a dry-deck hit may do (themeOutcome.ts, the leaderboard's red-square cap).
  it('is refused on an empty deck', () => {
    expect(processPass(playing([player(0, [h1, h2])], []))).toBeNull();
  });

  it('is refused mid-animation, outside play, and for an eliminated player', () => {
    const seat = () => [player(0, [h1, h2])];
    expect(processPass(playing(seat(), [d1], { isAnimating: true }))).toBeNull();
    expect(processPass(playing(seat(), [d1], { phase: 'gameOver' }))).toBeNull();
    expect(processPass(playing([player(0, [h1], { isEliminated: true })], [d1]))).toBeNull();
  });

  it('spends only the current player’s pass, and leaves the other seat alone', () => {
    const other = player(0, [h1]);
    const state = playing([other, player(1, [h2, h3])], [d1], { currentPlayerIndex: 1 });
    const update = processPass(state);

    expect(update!.players[0]).toBe(other);
    expect(names(update!.players[1].hand)).toEqual(['d1', 'h3']);
    expect(passesLeft(update!.players[1])).toBe(STARTING_PASSES - 1);
    expect(passesLeft(update!.players[0])).toBe(STARTING_PASSES);
  });

  /**
   * The invariant daily resume is built on: at every moment the board, the hand, the misses,
   * the passed cards and the undealt deck are exactly the composed deck, and the undealt part
   * is still in composed order. A random mix of hits, misses, passes and swaps must keep it.
   */
  it('keeps every card accounted for through any mix of moves', () => {
    const HAND = 5;
    for (let trial = 0; trial < 60; trial++) {
      const random = seededRandom(9000 + trial);
      const composed = Array.from({ length: 40 }, (_, i) => ev(`c${i}`, 1000 + i * 7));
      const index = buildDifficultyIndex(composed);
      let state = playing([player(0, composed.slice(1, 1 + HAND))], composed.slice(1 + HAND), {
        timeline: [composed[0]],
        passedCards: [],
      });
      const missed: HistoricalEvent[] = [];

      for (let move = 0; move < 80 && state.players[0].hand.length > 0; move++) {
        const hand = state.players[0].hand;
        const dry = state.deck.length === 0;
        const roll = random();
        // What the move should do to the hand: only a miss or a dry-deck hit shrinks it.
        let shrinks = false;
        if (roll < 0.25) {
          state = { ...state, ...(processPass(state) ?? {}) };
        } else if (roll < 0.4) {
          const [first, ...rest] = hand;
          state = { ...state, players: [{ ...state.players[0], hand: [...rest, first] }] };
        } else if (roll < 0.8) {
          const placed = { ...state, timeline: [...state.timeline, hand[0]] };
          state = { ...placed, ...processCorrectPlacement(placed, hand[0], index) };
          shrinks = dry;
        } else {
          missed.push(hand[0]);
          state = { ...state, ...processIncorrectPlacement(state, hand[0]) };
          shrinks = true;
        }
        expect(state.players[0].hand).toHaveLength(hand.length - (shrinks ? 1 : 0));

        const seen = [
          ...state.timeline,
          ...state.players[0].hand,
          ...missed,
          ...(state.passedCards ?? []),
        ];
        const seenNames = new Set(names(seen));
        expect(seenNames.size).toBe(seen.length);
        expect(names(state.deck)).toEqual(names(composed.filter((c) => !seenNames.has(c.name))));
      }
    }
  });
});
