import { renderHook, act } from '@testing-library/react';
import { useWhenGame } from './useWhenGame';
import { loadAllEvents } from '../utils/eventLoader';
import { HistoricalEvent } from '../types';
import { ALL_ERAS } from '../utils/eras';
import * as gameLogic from '../utils/gameLogic';
import { STARTING_PASSES, passesLeft } from '../utils/gameLogic';

// Mock only loadAllEvents (the network call), keep filter functions real
jest.mock('../utils/eventLoader', () => {
  const actual = jest.requireActual('../utils/eventLoader');
  return {
    ...actual,
    loadAllEvents: jest.fn(),
  };
});

// Same reasoning as above: the theme calendar is a network call, and these tests are about
// `suddenDeath` games, which never consult it. Left real, the unresolvable fetch would keep the hook
// in `loading` past the single microtask flush setupGame does.
jest.mock('../utils/curatedThemes', () => {
  const actual = jest.requireActual('../utils/curatedThemes');
  return {
    ...actual,
    loadCuratedThemes: jest.fn().mockResolvedValue(undefined),
    areCuratedThemesLoaded: jest.fn().mockReturnValue(true),
  };
});

// Mock playerStorage to prevent auto-starting daily mode in tests
jest.mock('../utils/playerStorage', () => ({
  saveDailyResult: jest.fn(),
  getTimelineHighScore: jest.fn().mockReturnValue(0),
  getTodayResult: jest.fn().mockReturnValue(null),
  hasPlayedToday: jest.fn().mockReturnValue(true), // Pretend daily was already played
  hasSeenHint: jest.fn().mockReturnValue(true),
  markHintSeen: jest.fn(),
  markNavUnseen: jest.fn(), // Re-armed by the stats recorder when achievements unlock
}));

const mockedLoadAllEvents = loadAllEvents as jest.MockedFunction<typeof loadAllEvents>;

// Years 1800, 1810, ... in deal order with the shuffle stubbed out, so hands are predictable.
const deckOf = (count: number): HistoricalEvent[] =>
  Array.from({ length: count }, (_, i) => ({
    name: `event-${1800 + i * 10}`,
    friendly_name: `event-${1800 + i * 10}`,
    year: 1800 + i * 10,
    category: 'empires',
    description: 'Test event',
    difficulty: 'medium',
  }));

type Hook = { current: ReturnType<typeof useWhenGame> };

async function start(deckSize = 30, playerCount = 1): Promise<Hook> {
  mockedLoadAllEvents.mockResolvedValue(deckOf(deckSize));
  const { result } = renderHook(() => useWhenGame());
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    result.current.startGame({
      mode: 'suddenDeath',
      selectedDifficulties: ['easy', 'medium', 'hard'],
      selectedCategories: ['empires'],
      selectedEras: [...ALL_ERAS],
      playerCount,
      playerNames: [],
      suddenDeathHandSize: 3,
    });
  });
  act(() => result.current.completeTransition());
  return result;
}

const pass = (result: Hook) => act(() => result.current.passCard());
function place(result: Hook, correct: boolean) {
  const { timeline, players, currentPlayerIndex } = result.current.state;
  const right = gameLogic.findCorrectPosition(timeline, players.at(currentPlayerIndex)!.hand[0]);
  const wrong = right === 0 ? timeline.length : 0;
  act(() => void result.current.placeCard(correct ? right : wrong));
  act(() => jest.runAllTimers());
  act(() => result.current.dismissPopup());
}
const hand = (result: Hook, seat = 0) =>
  result.current.state.players.at(seat)!.hand.map((e) => e.name);
const left = (result: Hook, seat = 0) => passesLeft(result.current.state.players.at(seat));

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(gameLogic, 'shuffleArray').mockImplementation(<T>(arr: T[]) => [...arr]);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useWhenGame - the pass', () => {
  it('deals every player the starting passes', async () => {
    const result = await start(30, 2);
    expect(left(result, 0)).toBe(STARTING_PASSES);
    expect(left(result, 1)).toBe(STARTING_PASSES);
    expect(result.current.state.passedCards).toEqual([]);
  });

  it('discards the active card and draws the top of the deck in its place', async () => {
    const result = await start();
    expect(hand(result)).toEqual(['event-1810', 'event-1820', 'event-1830']);

    pass(result);

    expect(hand(result)).toEqual(['event-1840', 'event-1820', 'event-1830']);
    expect(result.current.state.deck[0].name).toBe('event-1850');
    expect(result.current.state.passedCards!.map((e) => e.name)).toEqual(['event-1810']);
    expect(left(result)).toBe(STARTING_PASSES - 1);
  });

  it('is not a move: the score, the streak and the turn stay where they were', async () => {
    const result = await start();
    place(result, true);
    const before = result.current.state;

    pass(result);

    const after = result.current.state;
    expect(after.placementHistory).toEqual(before.placementHistory);
    expect(after.players[0].placementHistory).toEqual(before.players[0].placementHistory);
    expect(after.currentStreak).toBe(before.currentStreak);
    expect(after.bestStreak).toBe(before.bestStreak);
    expect(after.turnNumber).toBe(before.turnNumber);
    expect(after.timeline).toBe(before.timeline);
    expect(after.isAnimating).toBe(false);
  });

  it('refuses a pass once they are spent', async () => {
    const result = await start();
    for (let i = 0; i < STARTING_PASSES; i++) pass(result);
    expect(left(result)).toBe(0);
    const spent = result.current.state;

    pass(result);

    expect(result.current.state).toBe(spent);
  });

  it('earns a pass at three in a row and another at six, and none for a broken run', async () => {
    const result = await start(40);
    for (let i = 0; i < STARTING_PASSES; i++) pass(result);

    place(result, true);
    place(result, true);
    expect(left(result)).toBe(0);
    place(result, true);
    expect(left(result)).toBe(1);

    place(result, true);
    place(result, true);
    place(result, true);
    expect(left(result)).toBe(2);

    place(result, false);
    place(result, true);
    place(result, true);
    expect(left(result)).toBe(2);
    place(result, true);
    expect(left(result)).toBe(3);
  });

  it('refuses a pass while a placement is animating', async () => {
    const result = await start();
    act(() => void result.current.placeCard(result.current.state.timeline.length));
    expect(result.current.state.isAnimating).toBe(true);
    const during = result.current.state;

    pass(result);

    expect(result.current.state).toBe(during);
    act(() => jest.runAllTimers());
  });

  it('refuses a pass when there is nothing left to draw', async () => {
    // The smallest deck a three-card hand can be dealt from: seed, hand and two draws.
    const result = await start(6);
    pass(result);
    pass(result);
    expect(result.current.state.deck).toHaveLength(0);
    const dry = result.current.state;

    pass(result);

    expect(result.current.state).toBe(dry);
    expect(hand(result)).toHaveLength(3);
  });

  it('in a two-player game, passes and earns for the player whose turn it is', async () => {
    const result = await start(40, 2);
    const second = hand(result, 1);

    pass(result);

    expect(left(result, 0)).toBe(STARTING_PASSES - 1);
    expect(left(result, 1)).toBe(STARTING_PASSES);
    expect(hand(result, 1)).toEqual(second);
    expect(result.current.state.currentPlayerIndex).toBe(0);

    // Three rounds, both right every time: each earns from their own run of three, not from
    // the shared streak, which reaches three after a round and a half.
    for (let i = 0; i < 3; i++) {
      place(result, true);
      place(result, true);
    }
    expect(left(result, 0)).toBe(STARTING_PASSES);
    expect(left(result, 1)).toBe(STARTING_PASSES + 1);
  });
});
