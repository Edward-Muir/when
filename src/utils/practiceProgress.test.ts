import { GameConfig, HistoricalEvent, WhenGameState } from '../types';
import {
  buildPracticeProgressSnapshot,
  clearPracticeProgress,
  getPracticeProgress,
  resumePracticeProgress,
  savePracticePlacement,
  savePracticeProgress,
} from './practiceProgress';
import { getTodayDailyProgress } from './dailyProgress';
import { calculatePlacementResult } from './placementLogic';
import { buildDailyConfig } from './dailyConfig';
import { buildDifficultyIndex } from './difficultyScore';
import { buildCustomGameConfig, DEFAULT_DECK_SETTINGS } from './customDeck';

const KEY = 'when-practice-progress';
const CUSTOM: GameConfig = {
  ...buildCustomGameConfig(DEFAULT_DECK_SETTINGS),
  suddenDeathHandSize: 3,
};
const ARCHIVE: GameConfig = { ...CUSTOM, challengeCode: undefined, dailyReplayDate: '2026-10-20' };

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
const INDEX = buildDifficultyIndex(DECK);

/** The state `startGame` deals from DECK. */
function dealt(overrides: Partial<WhenGameState> = {}): WhenGameState {
  return {
    phase: 'playing',
    gameMode: 'suddenDeath',
    timeline: [DECK[0]],
    seedEventName: 'seed',
    deck: DECK.slice(4),
    placementHistory: [],
    failedPlacements: [],
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: CUSTOM,
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

const drop = (state: WhenGameState, index: number) => {
  const card = state.players[0].hand[0];
  savePracticePlacement(
    state,
    card,
    index,
    calculatePlacementResult(state.timeline, card, index),
    INDEX
  );
};

beforeEach(() => {
  localStorage.clear();
});

describe('the practice snapshot', () => {
  it('round-trips with the whole config, Archive date included', () => {
    const snapshot = buildPracticeProgressSnapshot(dealt({ lastConfig: ARCHIVE }));
    savePracticeProgress(snapshot);
    expect(getPracticeProgress()).toEqual(snapshot);
    expect(getPracticeProgress()?.config.dailyReplayDate).toBe('2026-10-20');
  });

  it('builds nothing for a daily, a review, a multiplayer game or the intro', () => {
    const daily = { ...buildDailyConfig(), cardsPerHand: 3 };
    expect(
      buildPracticeProgressSnapshot(dealt({ gameMode: 'daily', lastConfig: daily }))
    ).toBeNull();
    expect(buildPracticeProgressSnapshot(dealt({ isReview: true }))).toBeNull();
    expect(buildPracticeProgressSnapshot(dealt({ phase: 'transitioning' }))).toBeNull();
    const two = dealt();
    two.players = [two.players[0], { ...two.players[0], id: 1 }];
    expect(buildPracticeProgressSnapshot(two)).toBeNull();
  });

  it('ignores corrupt data and a save that is not a practice game', () => {
    localStorage.setItem(KEY, '{not json');
    expect(getPracticeProgress()).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ config: CUSTOM, seedEventName: 'seed' }));
    expect(getPracticeProgress()).toBeNull();
    const board = buildPracticeProgressSnapshot(dealt());
    localStorage.setItem(KEY, JSON.stringify({ ...board, config: { ...CUSTOM, mode: 'daily' } }));
    expect(getPracticeProgress()).toBeNull();
  });

  it('clears', () => {
    savePracticeProgress(buildPracticeProgressSnapshot(dealt()));
    clearPracticeProgress();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe('savePracticePlacement', () => {
  it('saves the settled move straight away, and leaves the daily slot alone', () => {
    drop(dealt(), 0); // h1 (1200) before the seed (1500): right
    const saved = getPracticeProgress();
    expect(saved?.timeline).toEqual(['h1', 'seed']);
    expect(saved?.placementHistory).toEqual([true]);
    expect(getTodayDailyProgress()).toBeNull();
  });

  it('ignores a daily and a multiplayer game', () => {
    drop(dealt({ gameMode: 'daily', lastConfig: buildDailyConfig() }), 0);
    const two = dealt();
    two.players = [two.players[0], { ...two.players[0], id: 1 }];
    drop(two, 0);
    expect(getPracticeProgress()).toBeNull();
  });
});

describe('resumePracticeProgress', () => {
  it('rebuilds the game on the deck its own config deals', () => {
    drop(dealt({ lastConfig: ARCHIVE }), 1); // h1 after the seed: wrong
    const compose = jest.fn().mockReturnValue(DECK);
    const resumed = resumePracticeProgress(compose);

    expect(compose).toHaveBeenCalledWith(ARCHIVE);
    expect(resumed?.gameMode).toBe('suddenDeath');
    expect(resumed?.lastConfig).toEqual(ARCHIVE);
    expect(resumed?.failedPlacements.map((f) => f.event.name)).toEqual(['h1']);
    expect(resumed?.players[0].hand.map((e) => e.name)).toEqual(['h2', 'h3']);
    expect(resumed?.deck.map((e) => e.name)).toEqual(['d1', 'd2', 'd3']);
  });

  it('drops a save whose cards have left the catalogue', () => {
    drop(dealt(), 0);
    const resumed = resumePracticeProgress(() => [DECK[0], DECK[4], DECK[5], DECK[6]]);
    expect(resumed).toBeNull();
    expect(getPracticeProgress()).toBeNull();
  });

  it('from a challenge link, resumes only that link and keeps any other save', () => {
    drop(dealt(), 0);
    expect(resumePracticeProgress(() => DECK, 'another-code')).toBeNull();
    expect(getPracticeProgress()).not.toBeNull();
    expect(resumePracticeProgress(() => DECK, CUSTOM.challengeCode)).not.toBeNull();
  });

  it('is null with nothing saved', () => {
    expect(resumePracticeProgress(() => DECK)).toBeNull();
  });
});
