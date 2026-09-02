import { HistoricalEvent, WhenGameState, GameMode, FailedPlacement } from '../types';
import {
  GAME_HISTORY_CAP,
  GameRecord,
  appendGameRecord,
  buildGameRecord,
  getGameHistory,
  patchDailyRank,
} from './gameHistory';
import { getLocalDateString } from './puzzleDate';

const KEY = 'when-game-history';

const event = (name: string): HistoricalEvent => ({ name }) as HistoricalEvent;

// A finished game with only the fields the record reads.
function makeGameState(opts: {
  gameMode?: GameMode | null;
  dailySeed?: string;
  handSize?: number;
  placedNames?: string[];
  placementHistory?: boolean[];
  failedPlacements?: FailedPlacement[];
  bestStreak?: number;
}): WhenGameState {
  const {
    gameMode = 'suddenDeath',
    dailySeed,
    handSize,
    placedNames = [],
    placementHistory = placedNames.map(() => true),
    failedPlacements = [],
    bestStreak = 0,
  } = opts;
  const lastConfig = dailySeed
    ? { dailySeed }
    : { challengeCode: 'abc-def-ghi', suddenDeathHandSize: handSize };
  return {
    phase: 'gameOver',
    gameMode,
    timeline: ['seed-event', ...placedNames].map(event),
    seedEventName: 'seed-event',
    deck: [],
    placementHistory,
    failedPlacements,
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: lastConfig as never,
    players: [],
    currentPlayerIndex: 0,
    turnNumber: 1,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: 0,
    bestStreak,
  };
}

const record = (overrides: Partial<GameRecord> = {}): GameRecord => ({
  date: '2026-08-01',
  mode: 'suddenDeath',
  placements: '10',
  correct: ['a'],
  misses: [],
  bestStreak: 1,
  timelineLength: 2,
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

describe('getGameHistory', () => {
  it('is empty before any game', () => {
    expect(getGameHistory()).toEqual([]);
  });

  it('survives corrupt or wrongly-shaped storage', () => {
    localStorage.setItem(KEY, '{not json');
    expect(getGameHistory()).toEqual([]);
    localStorage.setItem(KEY, JSON.stringify({ records: [] }));
    expect(getGameHistory()).toEqual([]);
  });

  it('drops malformed entries and rebuilds the rest field by field', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { ...record({ rank: 3, totalPlayers: 40 }), retired: 'gone' },
        { date: '2026-08-02', mode: 'freeplay', placements: '1', correct: [], misses: [] },
        { date: '2026-08-03', mode: 'daily', placements: '1', correct: 'a', misses: [] },
        null,
        record({ misses: [{ id: 'x', off: 1, len: 3 }, { id: 'broken' } as never] }),
      ])
    );
    const history = getGameHistory();
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual(record({ rank: 3, totalPlayers: 40 }));
    expect(history[1].misses).toEqual([{ id: 'x', off: 1, len: 3 }]);
  });
});

describe('buildGameRecord', () => {
  it('is null when no game was started', () => {
    expect(buildGameRecord(makeGameState({ gameMode: null }))).toBeNull();
  });

  it('maps a daily game onto its puzzle date with the seed card excluded', () => {
    const state = makeGameState({
      gameMode: 'daily',
      dailySeed: '2026-08-14',
      placedNames: ['a', 'b', 'c'],
      placementHistory: [true, true, false, true, false],
      failedPlacements: [
        { event: event('x'), attemptedPosition: 0, correctPosition: 2, timelineLength: 3, seq: 3 },
        { event: event('y'), attemptedPosition: 4, correctPosition: 3, timelineLength: 4, seq: 5 },
      ],
      bestStreak: 2,
    });
    expect(buildGameRecord(state)).toEqual({
      date: '2026-08-14',
      mode: 'daily',
      placements: '11010',
      correct: ['a', 'b', 'c'],
      misses: [
        { id: 'x', off: 2, len: 3 },
        { id: 'y', off: 1, len: 4 },
      ],
      bestStreak: 2,
      timelineLength: 4,
    });
  });

  it('dates a custom game today and records its hand size', () => {
    const built = buildGameRecord(makeGameState({ handSize: 3, placedNames: ['a'] }));
    expect(built).toMatchObject({ date: getLocalDateString(), mode: 'suddenDeath', handSize: 3 });
    expect(buildGameRecord(makeGameState({ placedNames: ['a'] }))?.handSize).toBe(5);
  });

  it('leaves out misses recorded before the slot was captured', () => {
    const state = makeGameState({
      failedPlacements: [{ event: event('old'), attemptedPosition: 1, seq: 1 }],
    });
    expect(buildGameRecord(state)?.misses).toEqual([]);
  });

  it('keeps the theme outcome only for theme games', () => {
    const state = makeGameState({ placedNames: ['a'] });
    expect(buildGameRecord(state, { cleared: true, perfect: true })).not.toHaveProperty('cleared');
    expect(buildGameRecord(state, { themeId: 'kings', cleared: true })).toMatchObject({
      themeId: 'kings',
      cleared: true,
      perfect: false,
    });
  });
});

describe('appendGameRecord', () => {
  it('appends custom games in order', () => {
    appendGameRecord(record({ date: '2026-08-01' }));
    appendGameRecord(record({ date: '2026-08-01', placements: '0' }));
    expect(getGameHistory().map((r) => r.placements)).toEqual(['10', '0']);
  });

  it('records a daily once per date', () => {
    appendGameRecord(record({ mode: 'daily', date: '2026-08-14', placements: '1' }));
    appendGameRecord(record({ mode: 'daily', date: '2026-08-14', placements: '0' }));
    appendGameRecord(record({ mode: 'daily', date: '2026-08-15', placements: '0' }));
    expect(getGameHistory().map((r) => `${r.date}:${r.placements}`)).toEqual([
      '2026-08-14:1',
      '2026-08-15:0',
    ]);
  });

  it('prunes the oldest custom games first, then the oldest dailies', () => {
    for (let i = 0; i < GAME_HISTORY_CAP; i++) {
      appendGameRecord(record({ mode: i % 2 ? 'daily' : 'suddenDeath', date: `d${i}` }));
    }
    appendGameRecord(record({ date: 'newest-custom' }));
    let history = getGameHistory();
    expect(history).toHaveLength(GAME_HISTORY_CAP);
    expect(history[0].date).toBe('d1');
    expect(history.at(-1)?.date).toBe('newest-custom');

    // Fill with dailies until no custom game is left, then the oldest daily goes.
    localStorage.setItem(
      KEY,
      JSON.stringify(
        Array.from({ length: GAME_HISTORY_CAP }, (_, i) => record({ mode: 'daily', date: `d${i}` }))
      )
    );
    appendGameRecord(record({ mode: 'daily', date: 'newest-daily' }));
    history = getGameHistory();
    expect(history).toHaveLength(GAME_HISTORY_CAP);
    expect(history[0].date).toBe('d1');
    expect(history.at(-1)?.date).toBe('newest-daily');
  });
});

describe('patchDailyRank', () => {
  it("attaches the placing to that date's daily and nothing else", () => {
    appendGameRecord(record({ mode: 'daily', date: '2026-08-14' }));
    appendGameRecord(record({ mode: 'suddenDeath', date: '2026-08-14' }));
    patchDailyRank('2026-08-14', 12, 340);
    const [daily, custom] = getGameHistory();
    expect(daily).toMatchObject({ rank: 12, totalPlayers: 340 });
    expect(custom).not.toHaveProperty('rank');
  });

  it('is a no-op for a date with no daily record', () => {
    patchDailyRank('2026-08-14', 12, 340);
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
