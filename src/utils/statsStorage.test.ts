import { HistoricalEvent, WhenGameState, GameMode } from '../types';
import {
  getLifetimeStats,
  saveLifetimeStats,
  getCollectionState,
  saveCollectionState,
  addPlacedEventIds,
  getDailyCadence,
  saveDailyCadence,
  getAchievements,
  saveAchievements,
  buildEventsByName,
  recordGameResult,
  LifetimeStats,
  DailyCadence,
} from './statsStorage';

// Build a minimal finished-game state for the recorder (only the fields it reads).
function makeGameState(opts: {
  gameMode?: GameMode;
  dailySeed?: string;
  placedNames?: string[];
  seedEventName?: string;
  placementHistory?: boolean[];
  bestStreak?: number;
}): WhenGameState {
  const {
    gameMode = 'freeplay',
    dailySeed,
    placedNames = [],
    seedEventName = 'seed-event',
    placementHistory = placedNames.map(() => true),
    bestStreak = 0,
  } = opts;
  const timeline = [seedEventName, ...placedNames].map((name) => ({ name }) as HistoricalEvent);
  return {
    phase: 'gameOver',
    gameMode,
    timeline,
    seedEventName,
    deck: [],
    placementHistory,
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: (dailySeed ? { dailySeed } : { challengeCode: 'abc-def-ghi' }) as never,
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

const NO_EVENTS = new Map<string, HistoricalEvent>();

// jsdom provides a real localStorage; clear it between tests.
beforeEach(() => {
  localStorage.clear();
});

describe('zero-default getters (empty storage)', () => {
  it('getLifetimeStats returns fully-populated zero defaults', () => {
    expect(getLifetimeStats()).toEqual({
      gamesPlayed: { daily: 0, suddenDeath: 0, freeplay: 0 },
      eventsPlacedCorrect: 0,
      eventsPlacedWrong: 0,
      timelineLengthSum: { daily: 0, suddenDeath: 0, freeplay: 0 },
      longestTimeline: { daily: 0, suddenDeath: 0, freeplay: 0 },
      bestInGameStreakEver: 0,
      bestGameCorrectEver: 0,
      flawlessFreeplayGames: 0,
      firstPlayedDate: '',
      lastPlayedDate: '',
    });
  });

  it('getCollectionState returns empty list', () => {
    expect(getCollectionState()).toEqual({ placedEventIds: [] });
  });

  it('getDailyCadence returns zero defaults', () => {
    expect(getDailyCadence()).toEqual({
      currentDailyStreak: 0,
      maxDailyStreak: 0,
      lastDailyDate: '',
      playedDates: [],
      bestDailyCorrect: 0,
      dailyCorrectSum: 0,
      dailyCorrectHistogram: [],
    });
  });

  it('getAchievements returns empty map', () => {
    expect(getAchievements()).toEqual({ unlocked: {} });
  });

  it('returns zero defaults on corrupted JSON', () => {
    localStorage.setItem('when-lifetime-stats', 'not-json{');
    localStorage.setItem('when-collection', 'not-json{');
    expect(getLifetimeStats().eventsPlacedCorrect).toBe(0);
    expect(getCollectionState()).toEqual({ placedEventIds: [] });
  });
});

describe('save/get round-trips', () => {
  it('LifetimeStats round-trips every field', () => {
    const stats: LifetimeStats = {
      gamesPlayed: { daily: 3, suddenDeath: 5, freeplay: 7 },
      eventsPlacedCorrect: 42,
      eventsPlacedWrong: 9,
      timelineLengthSum: { daily: 30, suddenDeath: 55, freeplay: 70 },
      longestTimeline: { daily: 10, suddenDeath: 12, freeplay: 14 },
      bestInGameStreakEver: 8,
      bestGameCorrectEver: 13,
      flawlessFreeplayGames: 2,
      firstPlayedDate: '2026-01-01',
      lastPlayedDate: '2026-06-27',
    };
    saveLifetimeStats(stats);
    expect(getLifetimeStats()).toEqual(stats);
  });

  it('DailyCadence round-trips every field', () => {
    const cadence: DailyCadence = {
      currentDailyStreak: 4,
      maxDailyStreak: 9,
      lastDailyDate: '2026-06-27',
      playedDates: ['2026-06-25', '2026-06-26', '2026-06-27'],
      bestDailyCorrect: 11,
      dailyCorrectSum: 33,
      dailyCorrectHistogram: [0, 1, 2, 3],
    };
    saveDailyCadence(cadence);
    expect(getDailyCadence()).toEqual(cadence);
  });

  it('Achievements round-trips id -> date map', () => {
    const achievements = { unlocked: { '08': '2026-06-27', 'cat-empires': '2026-06-26' } };
    saveAchievements(achievements);
    expect(getAchievements()).toEqual(achievements);
  });

  it('merges partial/older stored shapes over defaults', () => {
    // Older shape missing freeplay sub-key and several top-level fields.
    localStorage.setItem(
      'when-lifetime-stats',
      JSON.stringify({ gamesPlayed: { daily: 2, suddenDeath: 1 }, eventsPlacedCorrect: 5 })
    );
    const stats = getLifetimeStats();
    expect(stats.gamesPlayed).toEqual({ daily: 2, suddenDeath: 1, freeplay: 0 });
    expect(stats.eventsPlacedCorrect).toBe(5);
    expect(stats.flawlessFreeplayGames).toBe(0);
    expect(stats.longestTimeline).toEqual({ daily: 0, suddenDeath: 0, freeplay: 0 });
  });
});

describe('CollectionState union / de-dupe', () => {
  it('addPlacedEventIds unions without duplicates', () => {
    addPlacedEventIds(['a', 'b']);
    addPlacedEventIds(['b', 'c', 'a']);
    expect(getCollectionState().placedEventIds.sort()).toEqual(['a', 'b', 'c']);
  });

  it('saveCollectionState de-dupes within a single write', () => {
    saveCollectionState({ placedEventIds: ['x', 'x', 'y'] });
    expect(getCollectionState().placedEventIds.sort()).toEqual(['x', 'y']);
  });
});

describe('high-score migration', () => {
  it('seeds longestTimeline.suddenDeath from legacy high score', () => {
    localStorage.setItem('when-timeline-high-score', '13');
    expect(getLifetimeStats().longestTimeline.suddenDeath).toBe(13);
    // Persisted, so subsequent reads stay seeded.
    expect(getLifetimeStats().longestTimeline.suddenDeath).toBe(13);
  });

  it('does not double-apply once seeded (idempotent)', () => {
    localStorage.setItem('when-timeline-high-score', '13');
    getLifetimeStats(); // seeds 13
    // Legacy value changes upward, but stored stat already seeded -> unchanged.
    localStorage.setItem('when-timeline-high-score', '99');
    expect(getLifetimeStats().longestTimeline.suddenDeath).toBe(13);
  });

  it('does not seed when no legacy high score exists', () => {
    expect(getLifetimeStats().longestTimeline.suddenDeath).toBe(0);
  });

  it('does not overwrite an existing suddenDeath value', () => {
    const stats = getLifetimeStats();
    stats.longestTimeline.suddenDeath = 20;
    saveLifetimeStats(stats);
    localStorage.setItem('when-timeline-high-score', '99');
    expect(getLifetimeStats().longestTimeline.suddenDeath).toBe(20);
  });
});

describe('key independence', () => {
  it('each object uses its own key — writing one does not clobber another', () => {
    saveLifetimeStats({ ...getLifetimeStats(), eventsPlacedCorrect: 1 });
    saveCollectionState({ placedEventIds: ['a'] });
    saveDailyCadence({ ...getDailyCadence(), currentDailyStreak: 2 });
    saveAchievements({ unlocked: { x: '2026-06-27' } });

    expect(getLifetimeStats().eventsPlacedCorrect).toBe(1);
    expect(getCollectionState().placedEventIds).toEqual(['a']);
    expect(getDailyCadence().currentDailyStreak).toBe(2);
    expect(getAchievements().unlocked).toEqual({ x: '2026-06-27' });
  });
});

describe('buildEventsByName', () => {
  it('keys by name and stores the full event', () => {
    const events: HistoricalEvent[] = [
      {
        name: 'wwi-end',
        friendly_name: 'World War I Ends',
        year: 1918,
        category: 'warfare',
        description: '',
        difficulty: 'medium',
      },
      {
        name: 'moon-landing',
        friendly_name: 'Moon Landing',
        year: 1969,
        category: 'science',
        description: '',
        difficulty: 'easy',
      },
    ];
    const map = buildEventsByName(events);
    expect(map.size).toBe(2);
    expect(map.get('wwi-end')).toBe(events[0]);
    expect(map.get('moon-landing')?.category).toBe('science');
    expect(map.get('missing')).toBeUndefined();
  });
});

describe('recordGameResult', () => {
  it('excludes the seed event from the collection and counts placements', () => {
    recordGameResult(
      makeGameState({ gameMode: 'freeplay', placedNames: ['a', 'b', 'c'] }),
      NO_EVENTS
    );
    expect(getCollectionState().placedEventIds.sort()).toEqual(['a', 'b', 'c']);
    const lifetime = getLifetimeStats();
    expect(lifetime.eventsPlacedCorrect).toBe(3);
    expect(lifetime.gamesPlayed.freeplay).toBe(1);
    expect(lifetime.timelineLengthSum.freeplay).toBe(4); // seed + 3 placements
    expect(lifetime.longestTimeline.freeplay).toBe(4);
    expect(lifetime.bestGameCorrectEver).toBe(3);
  });

  it('increments the correct per-mode bucket for each mode', () => {
    recordGameResult(makeGameState({ gameMode: 'daily', dailySeed: '2026-06-01', placedNames: ['a'] }), NO_EVENTS); // prettier-ignore
    recordGameResult(makeGameState({ gameMode: 'suddenDeath', placedNames: ['b'] }), NO_EVENTS);
    recordGameResult(makeGameState({ gameMode: 'freeplay', placedNames: ['c'] }), NO_EVENTS);
    const { gamesPlayed } = getLifetimeStats();
    expect(gamesPlayed).toEqual({ daily: 1, suddenDeath: 1, freeplay: 1 });
  });

  it('counts wrong placements and flawless freeplay games', () => {
    recordGameResult(
      makeGameState({
        gameMode: 'freeplay',
        placedNames: ['a', 'b'],
        placementHistory: [true, false, true],
      }),
      NO_EVENTS
    );
    expect(getLifetimeStats().eventsPlacedWrong).toBe(1);
    expect(getLifetimeStats().flawlessFreeplayGames).toBe(0); // had a wrong placement

    recordGameResult(makeGameState({ gameMode: 'freeplay', placedNames: ['c', 'd'] }), NO_EVENTS);
    expect(getLifetimeStats().flawlessFreeplayGames).toBe(1); // all correct
  });

  it('custom (non-daily) games count for everything EXCEPT in-game streak', () => {
    recordGameResult(
      makeGameState({ gameMode: 'suddenDeath', placedNames: ['a', 'b'], bestStreak: 12 }),
      NO_EVENTS
    );
    const lifetime = getLifetimeStats();
    expect(lifetime.eventsPlacedCorrect).toBe(2);
    expect(lifetime.gamesPlayed.suddenDeath).toBe(1);
    expect(lifetime.bestGameCorrectEver).toBe(2);
    expect(lifetime.bestInGameStreakEver).toBe(0); // streak NOT advanced by non-daily
  });

  it('daily games advance the in-game streak', () => {
    recordGameResult(
      makeGameState({
        gameMode: 'daily',
        dailySeed: '2026-06-01',
        placedNames: ['a'],
        bestStreak: 7,
      }),
      NO_EVENTS
    );
    expect(getLifetimeStats().bestInGameStreakEver).toBe(7);
  });

  it('updates daily cadence (best/sum/histogram) for daily games only', () => {
    recordGameResult(
      makeGameState({ gameMode: 'daily', dailySeed: '2026-06-01', placedNames: ['a', 'b'] }),
      NO_EVENTS
    );
    const cadence = getDailyCadence();
    expect(cadence.playedDates).toEqual(['2026-06-01']);
    expect(cadence.bestDailyCorrect).toBe(2);
    expect(cadence.dailyCorrectSum).toBe(2);
    expect(cadence.dailyCorrectHistogram[2]).toBe(1);
  });

  it('cadence is idempotent for the same daily date (ref guard handles lifetime)', () => {
    const game = makeGameState({ gameMode: 'daily', dailySeed: '2026-06-01', placedNames: ['a'] });
    recordGameResult(game, NO_EVENTS);
    recordGameResult(game, NO_EVENTS); // simulate a re-fire
    const cadence = getDailyCadence();
    expect(cadence.playedDates).toEqual(['2026-06-01']);
    expect(cadence.currentDailyStreak).toBe(1);
  });

  it('daily streak advances on consecutive dates, holds on same, resets on a gap', () => {
    recordGameResult(
      makeGameState({ gameMode: 'daily', dailySeed: '2026-06-01', placedNames: ['a'] }),
      NO_EVENTS
    );
    expect(getDailyCadence().currentDailyStreak).toBe(1);

    recordGameResult(
      makeGameState({ gameMode: 'daily', dailySeed: '2026-06-02', placedNames: ['b'] }),
      NO_EVENTS
    );
    expect(getDailyCadence().currentDailyStreak).toBe(2);
    expect(getDailyCadence().maxDailyStreak).toBe(2);

    // Gap (skips 06-03) -> reset to 1.
    recordGameResult(
      makeGameState({ gameMode: 'daily', dailySeed: '2026-06-04', placedNames: ['c'] }),
      NO_EVENTS
    );
    expect(getDailyCadence().currentDailyStreak).toBe(1);
    expect(getDailyCadence().maxDailyStreak).toBe(2);
  });

  it('unlocks First Steps (id 01) on the first recorded game and is idempotent', () => {
    const first = recordGameResult(
      makeGameState({ gameMode: 'freeplay', placedNames: ['a'] }),
      NO_EVENTS
    );
    expect(first).toContain('01');
    const second = recordGameResult(
      makeGameState({ gameMode: 'freeplay', placedNames: ['b'] }),
      NO_EVENTS
    );
    expect(second).not.toContain('01'); // already unlocked, not re-returned
    expect(getAchievements().unlocked['01']).toBeDefined();
  });
});
