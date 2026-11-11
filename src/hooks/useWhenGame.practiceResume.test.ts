import { renderHook, act } from '@testing-library/react';
import { useWhenGame } from './useWhenGame';
import { loadAllEvents } from '../utils/eventLoader';
import { buildDailyConfig, buildDailyDeck } from '../utils/dailyConfig';
import { getTodayDailyProgress } from '../utils/dailyProgress';
import { getPracticeProgress, clearPracticeProgress } from '../utils/practiceProgress';
import { buildCustomGameConfig, DEFAULT_DECK_SETTINGS } from '../utils/customDeck';
import { buildThemeReplayDeck } from '../utils/themeReplay';
import { getCuratedThemeById, CuratedTheme } from '../utils/curatedThemes';
import { getLifetimeStats } from '../utils/statsStorage';
import { GameConfig, HistoricalEvent, WhenGameState } from '../types';

// The catalogue and the calendar are network calls; see useWhenGame.test.ts.
jest.mock('../utils/eventLoader', () => ({
  ...jest.requireActual('../utils/eventLoader'),
  loadAllEvents: jest.fn(),
}));
jest.mock('../utils/curatedThemes', () => ({
  ...jest.requireActual('../utils/curatedThemes'),
  loadCuratedThemes: jest.fn().mockResolvedValue(undefined),
  areCuratedThemesLoaded: jest.fn().mockReturnValue(true),
  getCuratedThemeById: jest.fn(),
}));
// An Archive day deals that date's daily deck, and a theme replay its theme's pool. What
// matters is that one config deals one deck, and that a changed deck can be simulated.
jest.mock('../utils/dailyConfig', () => ({
  ...jest.requireActual('../utils/dailyConfig'),
  buildDailyDeck: jest.fn(),
}));
jest.mock('../utils/themeReplay', () => ({
  ...jest.requireActual('../utils/themeReplay'),
  buildThemeReplayDeck: jest.fn(),
}));

const event = (name: string, year: number): HistoricalEvent =>
  ({
    name,
    year,
    friendly_name: name,
    category: 'science',
    difficulty: 'easy',
    regions: ['Global'],
  }) as HistoricalEvent;

// Years 1000, 1100, ... in deal order, as in the daily's resume test.
const DECK = Array.from({ length: 40 }, (_, i) => event(`e${i}`, 1000 + i * 10));

const mockedDailyDeck = buildDailyDeck as jest.MockedFunction<typeof buildDailyDeck>;
const mockedThemeDeck = buildThemeReplayDeck as jest.MockedFunction<typeof buildThemeReplayDeck>;

type Hook = { current: ReturnType<typeof useWhenGame> };

async function mount() {
  const utils = renderHook(() => useWhenGame());
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
}

function start(result: Hook, config: GameConfig) {
  act(() => result.current.startGame(config));
  if (result.current.state.phase === 'transitioning') {
    act(() => result.current.completeTransition());
  }
}

/** The slot the top card belongs in, and one it does not. Every year in DECK is distinct. */
const rightSlot = (s: WhenGameState) =>
  s.timeline.filter((e) => e.year < s.players[0].hand[0].year).length;
const wrongSlot = (s: WhenGameState) => (rightSlot(s) === 0 ? s.timeline.length : 0);

/** One card right, the next wrong, each animation run out. */
function placeRightThenWrong(result: Hook) {
  act(() => void result.current.placeCard(rightSlot(result.current.state)));
  act(() => jest.runAllTimers());
  act(() => void result.current.placeCard(wrongSlot(result.current.state)));
  act(() => jest.runAllTimers());
}

/** Miss until the hand is empty. */
function finish(result: Hook) {
  for (let i = 0; i < 50 && result.current.state.phase === 'playing'; i++) {
    act(() => void result.current.placeCard(wrongSlot(result.current.state)));
    act(() => jest.runAllTimers());
  }
}

const names = (events: HistoricalEvent[]) => events.map((e) => e.name);
const view = (s: WhenGameState) => ({
  phase: s.phase,
  mode: s.gameMode,
  timeline: names(s.timeline),
  hand: names(s.players[0].hand),
  deck: names(s.deck),
  failed: s.failedPlacements.map((f) => [f.event.name, f.attemptedPosition, f.seq]),
  history: s.placementHistory,
  streak: [s.currentStreak, s.bestStreak],
  turn: s.turnNumber,
  config: s.lastConfig,
});

const customConfig = () => buildCustomGameConfig(DEFAULT_DECK_SETTINGS);
const archiveConfig = (): GameConfig => ({
  ...buildCustomGameConfig(DEFAULT_DECK_SETTINGS),
  challengeCode: undefined,
  dailyReplayDate: '2026-11-01',
  challengeSeed: undefined,
});
const replayConfig = (): GameConfig => ({
  ...buildCustomGameConfig(DEFAULT_DECK_SETTINGS),
  challengeCode: undefined,
  curatedThemeId: 'some-theme',
  challengeSeed: 'archive:some-theme:abc',
});

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  (loadAllEvents as jest.Mock).mockResolvedValue(DECK);
  mockedDailyDeck.mockReturnValue(DECK);
  mockedThemeDeck.mockReturnValue(DECK.slice(0, 20));
  (getCuratedThemeById as jest.Mock).mockImplementation(
    (id: string) => ({ id, name: 'Theme' }) as unknown as CuratedTheme
  );
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('resuming a practice game', () => {
  it.each([
    ['a Custom game', customConfig],
    ['an Archive day', archiveConfig],
    ['a curated theme replay', replayConfig],
  ])('a reload lands %s back on the board that was left', async (_label, makeConfig) => {
    const first = await mount();
    const config = makeConfig();
    start(first.result, config);
    act(() => first.result.current.cycleHand());
    placeRightThenWrong(first.result);
    const left = view(first.result.current.state);
    first.unmount();

    const second = await mount();
    let resumed = false;
    act(() => {
      resumed = second.result.current.resumePracticeGame();
    });

    expect(resumed).toBe(true);
    expect(view(second.result.current.state)).toEqual(left);
    expect(second.result.current.state.lastConfig).toEqual(config);
  });

  it('saves a move the moment the card is dropped, already settled', async () => {
    const first = await mount();
    start(first.result, customConfig());
    act(() => void first.result.current.placeCard(wrongSlot(first.result.current.state)));

    const second = await mount();
    act(() => void second.result.current.resumePracticeGame());
    act(() => jest.runAllTimers());

    expect(view(second.result.current.state)).toEqual(view(first.result.current.state));
    expect(second.result.current.state.placementHistory).toEqual([false]);
  });

  it('a resumed game finished records exactly one game and drops the save', async () => {
    const first = await mount();
    start(first.result, customConfig());
    placeRightThenWrong(first.result);
    first.unmount();

    const second = await mount();
    act(() => void second.result.current.resumePracticeGame());
    finish(second.result);

    expect(second.result.current.state.phase).toBe('gameOver');
    expect(getLifetimeStats().gamesPlayed).toEqual({ daily: 0, suddenDeath: 1 });
    expect(getPracticeProgress()).toBeNull();
  });

  it('a missed Archive day resumed still records as that day', async () => {
    const first = await mount();
    start(first.result, archiveConfig());
    placeRightThenWrong(first.result);
    first.unmount();

    const second = await mount();
    act(() => void second.result.current.resumePracticeGame());
    finish(second.result);

    expect(getLifetimeStats().gamesPlayed).toEqual({ daily: 1, suddenDeath: 0 });
  });

  it('a deck changed by an update drops the save and stays home', async () => {
    const first = await mount();
    start(first.result, archiveConfig());
    placeRightThenWrong(first.result);
    first.unmount();

    mockedDailyDeck.mockReturnValue([DECK[0], ...DECK.slice(1).reverse()]);
    const second = await mount();
    let resumed = true;
    act(() => {
      resumed = second.result.current.resumePracticeGame();
    });

    expect(resumed).toBe(false);
    expect(second.result.current.state.phase).toBe('modeSelect');
    expect(getPracticeProgress()).toBeNull();
  });

  it('only a save of the same link resumes from a challenge link', async () => {
    const first = await mount();
    const config = customConfig();
    start(first.result, config);
    placeRightThenWrong(first.result);
    first.unmount();

    const second = await mount();
    let resumed = true;
    act(() => {
      resumed = second.result.current.resumePracticeGame('some-other-code');
    });
    expect(resumed).toBe(false);
    expect(getPracticeProgress()).not.toBeNull();

    act(() => {
      resumed = second.result.current.resumePracticeGame(config.challengeCode);
    });
    expect(resumed).toBe(true);
  });
});

describe('the practice slot', () => {
  it('is written at the deal and cleared at game over', async () => {
    const { result } = await mount();
    start(result, customConfig());
    expect(getPracticeProgress()?.placementHistory).toEqual([]);

    finish(result);
    expect(result.current.state.phase).toBe('gameOver');
    expect(getPracticeProgress()).toBeNull();
  });

  it('a Restart overwrites it with the new deal, and clears it while the intro plays', async () => {
    const { result } = await mount();
    start(result, replayConfig());
    placeRightThenWrong(result);
    expect(getPracticeProgress()?.placementHistory).toHaveLength(2);

    act(() => result.current.restartGame());
    expect(result.current.state.phase).toBe('transitioning');
    expect(getPracticeProgress()).toBeNull();
    act(() => result.current.completeTransition());
    expect(getPracticeProgress()?.placementHistory).toEqual([]);

    placeRightThenWrong(result);
    act(() => result.current.restartGame({ skipIntro: true }));
    expect(getPracticeProgress()?.placementHistory).toEqual([]);
  });

  it('is never written for a multiplayer game, and a multiplayer deal drops it', async () => {
    const { result } = await mount();
    start(result, customConfig());
    expect(getPracticeProgress()).not.toBeNull();

    start(result, {
      ...buildCustomGameConfig({ ...DEFAULT_DECK_SETTINGS, playerCount: 2 }),
    });
    expect(result.current.state.players).toHaveLength(2);
    act(() => void result.current.placeCard(0));
    act(() => jest.runAllTimers());
    expect(getPracticeProgress()).toBeNull();
  });

  it('a Daily dealt drops it, and the Daily keeps its own save', async () => {
    const { result } = await mount();
    start(result, customConfig());
    expect(getPracticeProgress()).not.toBeNull();

    start(result, buildDailyConfig());
    expect(getPracticeProgress()).toBeNull();
    expect(getTodayDailyProgress()).not.toBeNull();
  });

  it('a Daily in progress and a practice save each resume as their own game', async () => {
    const first = await mount();
    start(first.result, buildDailyConfig());
    placeRightThenWrong(first.result);
    const daily = view(first.result.current.state);
    // Home with the Daily saved, then a Custom game left mid-way by a reload.
    act(() => first.result.current.resetGame());
    start(first.result, customConfig());
    placeRightThenWrong(first.result);
    const practice = view(first.result.current.state);
    first.unmount();

    const second = await mount();
    act(() => void second.result.current.resumePracticeGame());
    expect(view(second.result.current.state)).toEqual(practice);

    // Left with Leave (App clears the slot), then the Daily card resumes the Daily.
    clearPracticeProgress();
    act(() => second.result.current.resetGame());
    start(second.result, buildDailyConfig());
    expect(view(second.result.current.state)).toEqual(daily);
  });

  it('nothing to resume leaves Home as it was', async () => {
    const { result } = await mount();
    let resumed = true;
    act(() => {
      resumed = result.current.resumePracticeGame();
    });
    expect(resumed).toBe(false);
    expect(result.current.state.phase).toBe('modeSelect');
  });
});
