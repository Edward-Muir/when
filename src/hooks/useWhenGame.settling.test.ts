import { renderHook, act } from '@testing-library/react';
import { useWhenGame } from './useWhenGame';
import { loadAllEvents } from '../utils/eventLoader';
import { HistoricalEvent } from '../types';
import { ALL_ERAS } from '../utils/eras';
import * as gameLogic from '../utils/gameLogic';

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

const names = (events: HistoricalEvent[]) => events.map((e) => e.name);
const drop = (result: Hook, correct: boolean) => {
  const { timeline, players } = result.current.state;
  const right = gameLogic.findCorrectPosition(timeline, players[0].hand[0]);
  const wrong = right === 0 ? timeline.length : 0;
  act(() => void result.current.placeCard(correct ? right : wrong));
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(gameLogic, 'shuffleArray').mockImplementation(<T>(arr: T[]) => [...arr]);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// The hand bar shows `state.settling` while a placement animates, so the next card arrives
// with the flash. That only works if it is exactly what the turn then commits.
describe('useWhenGame - the hand shown while a placement animates', () => {
  it('has nothing to show ahead before a card is dropped', async () => {
    const result = await start();
    expect(result.current.state.settling).toBeUndefined();
  });

  it('on a correct placement, is the hand with the new card already drawn', async () => {
    const result = await start();
    const before = result.current.state;
    drop(result, true);

    const during = result.current.state;
    expect(during.isAnimating).toBe(true);
    // The real hand has not changed yet: the placed card is still in it.
    expect(names(during.players[0].hand)).toEqual(names(before.players[0].hand));
    expect(names(during.settling!.player.hand)).toEqual([
      before.deck[0].name,
      ...names(before.players[0].hand.slice(1)),
    ]);
    expect(names(during.settling!.deck)).toEqual(names(before.deck.slice(1)));
  });

  it('on a miss, is the hand without the missed card and with nothing drawn', async () => {
    const result = await start();
    const before = result.current.state;
    drop(result, false);

    const { settling } = result.current.state;
    expect(names(settling!.player.hand)).toEqual(names(before.players[0].hand.slice(1)));
    expect(names(settling!.deck)).toEqual(names(before.deck));
  });

  it.each([
    ['a correct placement', true],
    ['a miss', false],
  ])('is exactly what %s then commits, and is gone once it has', async (_label, correct) => {
    const result = await start();
    drop(result, correct);
    const ahead = result.current.state.settling!;

    act(() => jest.runAllTimers());

    const after = result.current.state;
    expect(after.isAnimating).toBe(false);
    expect(after.settling).toBeUndefined();
    expect(names(after.players[0].hand)).toEqual(names(ahead.player.hand));
    expect(names(after.deck)).toEqual(names(ahead.deck));
    expect(after.players[0].placementHistory).toEqual(ahead.player.placementHistory);
  });

  it('holds through a run of placements with misses, where catch-up picks the draw', async () => {
    const result = await start(40);
    for (const correct of [true, false, true, true, false, true, true, true]) {
      if (result.current.state.phase !== 'playing') break;
      drop(result, correct);
      const ahead = result.current.state.settling!;
      act(() => jest.runAllTimers());
      expect(names(result.current.state.players[0].hand)).toEqual(names(ahead.player.hand));
      expect(names(result.current.state.deck)).toEqual(names(ahead.deck));
    }
  });

  it('shows nothing ahead in multiplayer, which keeps its popup flow', async () => {
    const result = await start(30, 2);
    drop(result, true);
    expect(result.current.state.isAnimating).toBe(true);
    expect(result.current.state.settling).toBeUndefined();
    act(() => jest.runAllTimers());
  });
});
