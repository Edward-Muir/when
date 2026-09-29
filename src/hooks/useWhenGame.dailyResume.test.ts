import { renderHook, act } from '@testing-library/react';
import { useWhenGame } from './useWhenGame';
import { loadAllEvents } from '../utils/eventLoader';
import { buildDailyConfig, buildDailyDeck } from '../utils/dailyConfig';
import { getTodayDailyProgress } from '../utils/dailyProgress';
import { getTodayResult } from '../utils/playerStorage';
import { HistoricalEvent, WhenGameState } from '../types';

// The catalogue and the calendar are network calls; see useWhenGame.test.ts.
jest.mock('../utils/eventLoader', () => ({
  ...jest.requireActual('../utils/eventLoader'),
  loadAllEvents: jest.fn(),
}));
jest.mock('../utils/curatedThemes', () => ({
  ...jest.requireActual('../utils/curatedThemes'),
  loadCuratedThemes: jest.fn().mockResolvedValue(undefined),
  areCuratedThemesLoaded: jest.fn().mockReturnValue(true),
}));
// The real daily deck needs a real catalogue. What matters here is that the same date deals
// the same deck, and that a changed deck can be simulated.
jest.mock('../utils/dailyConfig', () => ({
  ...jest.requireActual('../utils/dailyConfig'),
  buildDailyDeck: jest.fn(),
}));

const event = (name: string, year: number): HistoricalEvent =>
  ({ name, year, friendly_name: name, category: 'science', difficulty: 'easy' }) as HistoricalEvent;

// Years 1000, 1100, ... in deal order: the seed is the earliest, so index 1 after it is
// always right for the first hand card, and index 0 always wrong.
const DECK = Array.from({ length: 12 }, (_, i) => event(`e${i}`, 1000 + i * 100));

const mockedDeck = buildDailyDeck as jest.MockedFunction<typeof buildDailyDeck>;

async function mount() {
  const utils = renderHook(() => useWhenGame());
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
}

function startDaily(result: { current: ReturnType<typeof useWhenGame> }) {
  act(() => result.current.startGame(buildDailyConfig()));
  if (result.current.state.phase === 'transitioning') {
    act(() => result.current.completeTransition());
  }
}

const names = (events: HistoricalEvent[]) => events.map((e) => e.name);
const view = (s: WhenGameState) => ({
  phase: s.phase,
  timeline: names(s.timeline),
  hand: names(s.players[0].hand),
  deck: names(s.deck),
  failed: s.failedPlacements.map((f) => [f.event.name, f.attemptedPosition, f.seq]),
  history: s.placementHistory,
  streak: [s.currentStreak, s.bestStreak],
  turn: s.turnNumber,
});

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  (loadAllEvents as jest.Mock).mockResolvedValue(DECK);
  mockedDeck.mockReturnValue(DECK);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('resuming the daily', () => {
  it('a relaunch lands on the board that was left, not a fresh deal', async () => {
    const first = await mount();
    startDaily(first.result);
    act(() => first.result.current.cycleHand());
    act(() => void first.result.current.placeCard(1)); // e2 after the seed: right
    act(() => jest.runAllTimers());
    act(() => void first.result.current.placeCard(0)); // before the seed: wrong
    act(() => jest.runAllTimers());
    const left = view(first.result.current.state);
    first.unmount();

    const second = await mount();
    startDaily(second.result);

    expect(view(second.result.current.state)).toEqual(left);
  });

  it('a move is saved the moment the card is dropped, already settled', async () => {
    const first = await mount();
    startDaily(first.result);
    act(() => void first.result.current.placeCard(0)); // wrong: the true slot is now on show

    const second = await mount();
    startDaily(second.result);
    act(() => jest.runAllTimers()); // let the first game's animation finish too

    expect(view(second.result.current.state)).toEqual(view(first.result.current.state));
    expect(second.result.current.state.placementHistory).toEqual([false]);
  });

  it('a deck changed by an update deals the daily fresh', async () => {
    const first = await mount();
    startDaily(first.result);
    act(() => void first.result.current.placeCard(1));
    act(() => jest.runAllTimers());
    first.unmount();

    mockedDeck.mockReturnValue([DECK[0], ...DECK.slice(1).reverse()]);
    const second = await mount();
    startDaily(second.result);

    expect(second.result.current.state.placementHistory).toEqual([]);
    expect(names(second.result.current.state.players[0].hand)).toEqual([
      'e11',
      'e10',
      'e9',
      'e8',
      'e7',
    ]);
  });

  it('finishing the game records the day and drops the save', async () => {
    const { result } = await mount();
    startDaily(result);
    expect(getTodayDailyProgress()).not.toBeNull();

    for (let i = 0; i < 5; i++) {
      act(() => void result.current.placeCard(0));
      act(() => jest.runAllTimers());
    }

    expect(result.current.state.phase).toBe('gameOver');
    expect(getTodayResult()).not.toBeNull();
    expect(getTodayDailyProgress()).toBeNull();
  });

  it('a game that ended mid-animation resumes as over and is recorded', async () => {
    const first = await mount();
    startDaily(first.result);
    for (let i = 0; i < 4; i++) {
      act(() => void first.result.current.placeCard(0));
      act(() => jest.runAllTimers());
    }
    act(() => void first.result.current.placeCard(0)); // the last card, still animating
    first.unmount();

    const second = await mount();
    startDaily(second.result);

    expect(second.result.current.state.phase).toBe('gameOver');
    expect(getTodayResult()?.totalAttempts).toBe(5);
    expect(getTodayDailyProgress()).toBeNull();
  });
});
