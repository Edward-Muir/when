import { FailedPlacement, HistoricalEvent, WhenGameState } from '../types';
import {
  DailyBoardSnapshot,
  buildDailyBoardSnapshot,
  getTodayDailyBoard,
  restoreDailyBoard,
  saveDailyBoard,
} from './dailyBoard';
import { getLocalDateString } from './puzzleDate';

const KEY = 'when-daily-board';

const event = (name: string, year: number): HistoricalEvent =>
  ({ name, year, friendly_name: name }) as HistoricalEvent;

const CATALOGUE = [
  event('seed-event', 1500),
  event('placed-early', 1200),
  event('placed-late', 1800),
  event('missed-card', 1650),
];

const miss: FailedPlacement = {
  event: event('missed-card', 1650),
  attemptedPosition: 0,
  correctPosition: 2,
  timelineLength: 3,
  seq: 4,
};

function makeGameState(overrides: Partial<WhenGameState> = {}): WhenGameState {
  return {
    phase: 'gameOver',
    gameMode: 'daily',
    // Year order, as the board holds it, with the face-up seed card among them.
    timeline: [event('placed-early', 1200), event('seed-event', 1500), event('placed-late', 1800)],
    seedEventName: 'seed-event',
    deck: [],
    placementHistory: [true, false, true],
    failedPlacements: [miss],
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: { dailySeed: getLocalDateString() },
    players: [],
    currentPlayerIndex: 0,
    turnNumber: 3,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: 0,
    bestStreak: 2,
    ...overrides,
  } as unknown as WhenGameState;
}

beforeEach(() => {
  localStorage.clear();
});

describe('buildDailyBoardSnapshot', () => {
  it('reduces the board to slugs, stamped with the puzzle date', () => {
    const snapshot = buildDailyBoardSnapshot(makeGameState());

    expect(snapshot).not.toBeNull();
    expect(snapshot?.date).toBe(getLocalDateString());
    expect(snapshot?.timeline).toEqual(['placed-early', 'seed-event', 'placed-late']);
    expect(snapshot?.seedEventName).toBe('seed-event');
    expect(snapshot?.failed).toEqual([
      {
        name: 'missed-card',
        attemptedPosition: 0,
        correctPosition: 2,
        timelineLength: 3,
        seq: 4,
      },
    ]);
    expect(snapshot?.placementHistory).toEqual([true, false, true]);
    expect(snapshot?.bestStreak).toBe(2);
  });

  it('returns null for anything that is not a dated daily', () => {
    expect(buildDailyBoardSnapshot(makeGameState({ gameMode: 'suddenDeath' }))).toBeNull();
    expect(
      buildDailyBoardSnapshot(makeGameState({ lastConfig: {} } as Partial<WhenGameState>))
    ).toBeNull();
  });
});

describe('getTodayDailyBoard', () => {
  it('reads back a board saved today', () => {
    saveDailyBoard(buildDailyBoardSnapshot(makeGameState()));

    expect(getTodayDailyBoard()?.timeline).toEqual(['placed-early', 'seed-event', 'placed-late']);
  });

  it('ignores a board from another day, which is what makes the slot self-clearing', () => {
    // No cleanup pass and no timer: yesterday's board simply stops reading back, and the next
    // daily overwrites the slot.
    const stale = { ...buildDailyBoardSnapshot(makeGameState()), date: '2020-01-01' };
    localStorage.setItem(KEY, JSON.stringify(stale));

    expect(getTodayDailyBoard()).toBeNull();
  });

  it('returns null when there is nothing stored, or the entry is corrupt', () => {
    expect(getTodayDailyBoard()).toBeNull();

    localStorage.setItem(KEY, 'not json');
    expect(getTodayDailyBoard()).toBeNull();
  });
});

describe('restoreDailyBoard', () => {
  const snapshot = () => buildDailyBoardSnapshot(makeGameState()) as DailyBoardSnapshot;

  it('rebuilds the board the player left, flagged as a review', () => {
    const restored = restoreDailyBoard(snapshot(), CATALOGUE);

    expect(restored).not.toBeNull();
    expect(restored?.phase).toBe('gameOver');
    expect(restored?.gameMode).toBe('daily');
    expect(restored?.isReview).toBe(true);
    expect(restored?.timeline.map((e) => e.name)).toEqual([
      'placed-early',
      'seed-event',
      'placed-late',
    ]);
    expect(restored?.failedPlacements.map((f) => f.event.name)).toEqual(['missed-card']);
    expect(restored?.failedPlacements[0].correctPosition).toBe(2);
    // The share reads these two, so a reviewed board reproduces the message the game ended on.
    expect(restored?.placementHistory).toEqual([true, false, true]);
    expect(restored?.lastConfig?.dailySeed).toBe(getLocalDateString());
    // Nothing is dealt, and `getThemeOutcome` needs exactly one seated player.
    expect(restored?.deck).toEqual([]);
    expect(restored?.players).toHaveLength(1);
    expect(restored?.players[0].hand).toEqual([]);
    expect(restored?.bestStreak).toBe(2);
  });

  it('skips cards the catalogue no longer carries', () => {
    const thinned = CATALOGUE.filter((e) => e.name !== 'placed-late' && e.name !== 'missed-card');
    const restored = restoreDailyBoard(snapshot(), thinned);

    expect(restored?.timeline.map((e) => e.name)).toEqual(['placed-early', 'seed-event']);
    expect(restored?.failedPlacements).toEqual([]);
  });

  it('returns null when there is nothing left to show', () => {
    // The caller gates the entry point on this null rather than opening an empty board.
    expect(restoreDailyBoard(null, CATALOGUE)).toBeNull();
    expect(restoreDailyBoard(snapshot(), [])).toBeNull();
    expect(restoreDailyBoard(snapshot(), [event('unrelated', 1900)])).toBeNull();
  });
});
