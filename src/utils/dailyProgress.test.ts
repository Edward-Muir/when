import { GameConfig, HistoricalEvent, WhenGameState } from '../types';
import {
  buildDailyProgressSnapshot,
  canResumeDailyProgress,
  clearDailyProgress,
  getTodayDailyProgress,
  restoreDailyProgress,
  resumeDailyProgress,
  saveDailyPlacement,
  saveDailyProgress,
  settleDailyPlacement,
} from './dailyProgress';
import { calculatePlacementResult } from './placementLogic';
import { buildDailyConfig } from './dailyConfig';
import { getLocalDateString } from './puzzleDate';

const KEY = 'when-daily-progress';
const TODAY = getLocalDateString();
const CONFIG: GameConfig = { ...buildDailyConfig(), dailySeed: TODAY, cardsPerHand: 3 };

const event = (name: string, year: number): HistoricalEvent =>
  ({ name, year, friendly_name: name }) as HistoricalEvent;

/** The composed deck, in deal order: seed, then a hand of three, then the draw pile. */
const DECK = [
  event('seed', 1500),
  event('h1', 1200),
  event('h2', 1800),
  event('h3', 1650),
  event('d1', 1900),
  event('d2', 1100),
  event('d3', 1400),
];

/** The state `startGame` deals from DECK. */
function dealt(overrides: Partial<WhenGameState> = {}): WhenGameState {
  return {
    phase: 'playing',
    gameMode: 'daily',
    timeline: [DECK[0]],
    seedEventName: 'seed',
    deck: DECK.slice(4),
    placementHistory: [],
    failedPlacements: [],
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: CONFIG,
    players: [
      {
        id: 0,
        name: 'Player 1',
        hand: DECK.slice(1, 4),
        hasWon: false,
        isEliminated: false,
        placementHistory: [],
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: 1,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: 0,
    bestStreak: 0,
    ...overrides,
  };
}

/** Drop the hand's first card at `index`, settled the way the animation would leave it. */
function play(state: WhenGameState, index: number): WhenGameState {
  const card = state.players[0].hand[0];
  return settleDailyPlacement(
    state,
    card,
    index,
    calculatePlacementResult(state.timeline, card, index)
  );
}

const names = (events: HistoricalEvent[]) => events.map((e) => e.name);

beforeEach(() => {
  localStorage.clear();
});

describe('settleDailyPlacement', () => {
  it('a correct placement settles on the board and draws a replacement', () => {
    const after = play(dealt(), 0); // h1 (1200) before the seed (1500)

    expect(names(after.timeline)).toEqual(['h1', 'seed']);
    expect(names(after.players[0].hand)).toEqual(['h2', 'h3', 'd1']);
    expect(names(after.deck)).toEqual(['d2', 'd3']);
    expect(after.placementHistory).toEqual([true]);
    expect(after.currentStreak).toBe(1);
    expect(after.bestStreak).toBe(1);
    expect(after.turnNumber).toBe(2);
    expect(after.phase).toBe('playing');
    expect(after.isAnimating).toBe(false);
  });

  it('a miss leaves the board alone, records a tombstone and shrinks the hand', () => {
    const after = play(dealt({ currentStreak: 2, bestStreak: 2 }), 1); // h1 after the seed

    expect(names(after.timeline)).toEqual(['seed']);
    expect(names(after.players[0].hand)).toEqual(['h2', 'h3']);
    expect(names(after.deck)).toEqual(['d1', 'd2', 'd3']);
    expect(after.failedPlacements).toEqual([
      { event: DECK[1], attemptedPosition: 1, correctPosition: 0, timelineLength: 1, seq: 1 },
    ]);
    expect(after.placementHistory).toEqual([false]);
    expect(after.currentStreak).toBe(0);
    expect(after.bestStreak).toBe(2);
  });

  it('the miss that empties the hand ends the game', () => {
    let state = dealt();
    state = play(state, 1); // h1 wrong
    state = play(state, 0); // h2 (1800) wrong, before the seed
    state = play(state, 0); // h3 (1650) wrong

    expect(state.phase).toBe('gameOver');
    expect(state.players[0].hand).toEqual([]);
    expect(state.placementHistory).toEqual([false, false, false]);
  });
});

describe('snapshot storage', () => {
  it('round-trips today and reads another day as nothing', () => {
    const snapshot = buildDailyProgressSnapshot(dealt());
    saveDailyProgress(snapshot);

    expect(getTodayDailyProgress(TODAY)).toEqual(snapshot);
    expect(getTodayDailyProgress('1999-01-01')).toBeNull();
  });

  it('ignores corrupt data', () => {
    localStorage.setItem(KEY, '{not json');
    expect(getTodayDailyProgress(TODAY)).toBeNull();

    localStorage.setItem(KEY, JSON.stringify({ date: TODAY, seedEventName: 'seed' }));
    expect(getTodayDailyProgress(TODAY)).toBeNull();
  });

  it('builds nothing for a review, a custom game or the intro', () => {
    expect(buildDailyProgressSnapshot(dealt({ isReview: true }))).toBeNull();
    expect(buildDailyProgressSnapshot(dealt({ gameMode: 'suddenDeath' }))).toBeNull();
    expect(buildDailyProgressSnapshot(dealt({ phase: 'transitioning' }))).toBeNull();
  });

  it('clears', () => {
    saveDailyProgress(buildDailyProgressSnapshot(dealt()));
    clearDailyProgress();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe('canResumeDailyProgress (the Daily card label)', () => {
  const snapshot = buildDailyProgressSnapshot(play(dealt(), 0));

  it('is true while the save still fits today’s deck', () => {
    expect(canResumeDailyProgress(snapshot, DECK)).toBe(true);
  });

  it('is false once an update has moved a card the player has seen', () => {
    expect(canResumeDailyProgress(snapshot, [DECK[0], ...DECK.slice(1).reverse()])).toBe(false);
  });

  it('is false with no save', () => {
    expect(canResumeDailyProgress(null, DECK)).toBe(false);
  });
});

describe('restoreDailyProgress', () => {
  // A cycled hand, one hit and one miss: every part of the state a resume has to carry.
  const cycled = dealt({
    players: [{ ...dealt().players[0], hand: [DECK[2], DECK[3], DECK[1]] }],
  });
  const played = play(play(cycled, 0), 2); // h2 wrong (before seed), h3 right (after seed)

  it('rebuilds the game the player left, deck included', () => {
    const restored = restoreDailyProgress(buildDailyProgressSnapshot(played), DECK, CONFIG);

    expect(restored).not.toBeNull();
    expect(names(restored!.timeline)).toEqual(names(played.timeline));
    expect(names(restored!.players[0].hand)).toEqual(names(played.players[0].hand));
    expect(names(restored!.deck)).toEqual(names(played.deck));
    expect(restored!.failedPlacements).toEqual(played.failedPlacements);
    expect(restored!.placementHistory).toEqual(played.placementHistory);
    expect(restored!.players[0].placementHistory).toEqual(played.placementHistory);
    expect(restored!.currentStreak).toBe(played.currentStreak);
    expect(restored!.bestStreak).toBe(played.bestStreak);
    expect(restored!.turnNumber).toBe(played.turnNumber);
    expect(restored!.phase).toBe('playing');
    expect(restored!.lastPlacementResult).toBeNull();
  });

  it('refuses when a card the player has seen moved in the rebuilt deck', () => {
    const snapshot = buildDailyProgressSnapshot(played);
    const reordered = [DECK[0], DECK[1], DECK[2], DECK[5], DECK[4], DECK[3], DECK[6]];

    expect(restoreDailyProgress(snapshot, reordered, CONFIG)).toBeNull();
  });

  it('refuses a different seed card', () => {
    const snapshot = buildDailyProgressSnapshot(played);
    expect(restoreDailyProgress(snapshot, [DECK[1], DECK[0], ...DECK.slice(2)], CONFIG)).toBeNull();
  });

  it('still resumes when only cards not yet drawn changed', () => {
    const snapshot = buildDailyProgressSnapshot(played);
    const newTail = [...DECK.slice(0, 5), event('new-card', 1000)];

    const restored = restoreDailyProgress(snapshot, newTail, CONFIG);
    expect(names(restored!.deck)).toEqual(['new-card']);
  });

  it('refuses a save from another date', () => {
    const snapshot = buildDailyProgressSnapshot(played);
    expect(restoreDailyProgress(snapshot, DECK, { ...CONFIG, dailySeed: '1999-01-01' })).toBeNull();
  });

  it('brings a game that ended mid-animation back as over', () => {
    let over = dealt();
    over = play(over, 1);
    over = play(over, 0);
    over = play(over, 0);
    const restored = restoreDailyProgress(buildDailyProgressSnapshot(over), DECK, CONFIG);

    expect(restored!.phase).toBe('gameOver');
    expect(restored!.players[0].isEliminated).toBe(true);
    expect(restored!.winners).toEqual([]);
  });
});

describe('the entry points', () => {
  it('saveDailyPlacement saves the settled move straight away', () => {
    const state = dealt();
    const card = state.players[0].hand[0];
    saveDailyPlacement(state, card, 1, calculatePlacementResult(state.timeline, card, 1));

    const saved = getTodayDailyProgress(TODAY);
    expect(saved?.placementHistory).toEqual([false]);
    expect(saved?.failed.map((f) => f.name)).toEqual(['h1']);
  });

  it('saveDailyPlacement ignores a custom game', () => {
    const state = dealt({ gameMode: 'suddenDeath' });
    const card = state.players[0].hand[0];
    saveDailyPlacement(state, card, 0, calculatePlacementResult(state.timeline, card, 0));

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('resumeDailyProgress drops a save the deck no longer matches', () => {
    saveDailyProgress(buildDailyProgressSnapshot(play(dealt(), 0)));

    expect(resumeDailyProgress([DECK[1], DECK[0], ...DECK.slice(2)], CONFIG)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
