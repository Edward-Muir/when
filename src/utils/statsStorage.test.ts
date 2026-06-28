import {
  HistoricalEvent,
  WhenGameState,
  GameMode,
  Category,
  Difficulty,
  ALL_CATEGORIES,
} from '../types';
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
  reevaluateAchievements,
  detectMilestones,
  LifetimeStats,
  DailyCadence,
} from './statsStorage';
import { findAchievementConfigMismatches } from '../data/achievementLogic';

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
      bestCustomStreakEver: 0,
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
      bestCustomStreakEver: 6,
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
    expect(lifetime.bestInGameStreakEver).toBe(0); // daily streak NOT advanced by non-daily
    expect(lifetime.bestCustomStreakEver).toBe(12); // custom streak record advances instead
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

describe('detectMilestones', () => {
  // Seed a single lifetime field over zero-defaults.
  function seedLifetime(patch: Partial<LifetimeStats>): void {
    saveLifetimeStats({ ...getLifetimeStats(), ...patch });
  }

  // Mirror real usage: snapshot records, record the game, then detect against the snapshot.
  function play(game: WhenGameState) {
    const prev = { lifetime: getLifetimeStats(), cadence: getDailyCadence() };
    recordGameResult(game, NO_EVENTS);
    return detectMilestones(game, prev);
  }

  it('fires nothing on first-ever records (no prior best to beat)', () => {
    const milestones = play(
      makeGameState({
        gameMode: 'daily',
        dailySeed: '2026-06-01',
        placedNames: ['a', 'b'],
        bestStreak: 5,
      })
    );
    expect(milestones).toEqual([]);
  });

  it('fires longest daily timeline when it beats the daily record', () => {
    seedLifetime({ longestTimeline: { daily: 5, suddenDeath: 0, freeplay: 0 } });
    const milestones = play(
      // seed + 6 placements = timeline length 7
      makeGameState({
        gameMode: 'daily',
        dailySeed: '2026-06-01',
        placedNames: ['a', 'b', 'c', 'd', 'e', 'f'],
      })
    );
    expect(milestones).toContainEqual({ kind: 'longestTimelineDaily', value: 7, previous: 5 });
  });

  it('fires longest custom timeline against the max of the non-daily buckets', () => {
    seedLifetime({ longestTimeline: { daily: 99, suddenDeath: 4, freeplay: 3 } });
    const milestones = play(
      // length 6, beats max(suddenDeath 4, freeplay 3) = 4
      makeGameState({ gameMode: 'freeplay', placedNames: ['a', 'b', 'c', 'd', 'e'] })
    );
    expect(milestones).toContainEqual({ kind: 'longestTimelineCustom', value: 6, previous: 4 });
    // The daily record (99) is untouched, so no daily timeline milestone.
    expect(milestones.find((m) => m.kind === 'longestTimelineDaily')).toBeUndefined();
  });

  it('routes streak milestones by mode (daily beats daily, never custom)', () => {
    seedLifetime({ bestInGameStreakEver: 3, bestCustomStreakEver: 2 });
    const milestones = play(
      makeGameState({
        gameMode: 'daily',
        dailySeed: '2026-06-01',
        placedNames: ['a'],
        bestStreak: 5,
      })
    );
    expect(milestones).toContainEqual({ kind: 'longestStreakDaily', value: 5, previous: 3 });
    expect(milestones.find((m) => m.kind === 'longestStreakCustom')).toBeUndefined();
  });

  it('fires custom streak against the custom record on non-daily games', () => {
    seedLifetime({ bestInGameStreakEver: 99, bestCustomStreakEver: 2 });
    const milestones = play(
      makeGameState({ gameMode: 'suddenDeath', placedNames: ['a'], bestStreak: 4 })
    );
    expect(milestones).toContainEqual({ kind: 'longestStreakCustom', value: 4, previous: 2 });
    expect(milestones.find((m) => m.kind === 'longestStreakDaily')).toBeUndefined();
  });

  it('fires longest daily run once an existing consecutive-days record is beaten', () => {
    // Day 1 sets maxDailyStreak 0 -> 1: no milestone (no prior record).
    const day1 = play(
      makeGameState({ gameMode: 'daily', dailySeed: '2026-06-01', placedNames: ['a'] })
    );
    expect(day1.find((m) => m.kind === 'longestDailyRun')).toBeUndefined();

    // Day 2 (consecutive) advances the run to 2, beating the record of 1.
    const day2 = play(
      makeGameState({ gameMode: 'daily', dailySeed: '2026-06-02', placedNames: ['b'] })
    );
    expect(day2).toContainEqual({ kind: 'longestDailyRun', value: 2, previous: 1 });
  });
});

describe('collection / era / themed / meta achievement tests', () => {
  // Build `count` synthetic events for a category/year/difficulty, registered in a
  // name->event map AND seeded into the stored collection. Returns the cumulative map so
  // multiple specs can be combined before a single reevaluate.
  function seed(
    specs: Array<{
      prefix: string;
      count: number;
      category?: Category;
      year?: number;
      difficulty?: Difficulty;
    }>
  ): Map<string, HistoricalEvent> {
    const byName = new Map<string, HistoricalEvent>();
    const ids: string[] = [];
    for (const sp of specs) {
      for (let i = 0; i < sp.count; i++) {
        const name = `${sp.prefix}-${i}`;
        byName.set(name, {
          name,
          friendly_name: name,
          year: sp.year ?? 1900,
          category: sp.category ?? 'science',
          description: '',
          difficulty: sp.difficulty ?? 'medium',
        });
        ids.push(name);
      }
    }
    addPlacedEventIds(ids);
    return byName;
  }

  // Merge event maps without spreading Map iterators (es5-target safe).
  function mergeMaps(...maps: Map<string, HistoricalEvent>[]): Map<string, HistoricalEvent> {
    const out = new Map<string, HistoricalEvent>();
    for (const m of maps) m.forEach((v, k) => out.set(k, v));
    return out;
  }

  it('coll-100 fires at exactly 100 unique events, not 99', () => {
    const just99 = seed([{ prefix: 'e', count: 99 }]);
    expect(reevaluateAchievements(just99)).not.toContain('coll-100');

    const one = seed([{ prefix: 'extra', count: 1 }]); // now 100 total
    const merged = mergeMaps(just99, one);
    expect(reevaluateAchievements(merged)).toContain('coll-100');
    expect(getAchievements().unlocked['coll-100']).toBeDefined();
  });

  it('coll milestones unlock cumulatively (500 implies 100)', () => {
    const byName = seed([{ prefix: 'e', count: 500 }]);
    const unlocked = reevaluateAchievements(byName);
    expect(unlocked).toEqual(expect.arrayContaining(['coll-100', 'coll-500']));
    expect(unlocked).not.toContain('coll-1500');
  });

  it('era-bce fires at 25 BCE events', () => {
    const byName = seed([{ prefix: 'bce', count: 25, category: 'nature', year: -500 }]);
    expect(reevaluateAchievements(byName)).toContain('era-bce');
  });

  it('era-modern fires at 50 events in the 21st century', () => {
    const byName = seed([{ prefix: 'now', count: 50, category: 'media', year: 2007 }]);
    expect(reevaluateAchievements(byName)).toContain('era-modern');
  });

  it('era-epochs needs 15 in each of the 5 great eras', () => {
    const fourBands = seed([
      { prefix: 'pre', count: 15, year: -4000 },
      { prefix: 'ant', count: 15, year: 100 },
      { prefix: 'med', count: 15, year: 1000 },
      { prefix: 'emo', count: 15, year: 1600 },
      // modern band missing
    ]);
    expect(reevaluateAchievements(fourBands)).not.toContain('era-epochs');

    const modern = seed([{ prefix: 'mod', count: 15, year: 1900 }]);
    const all = mergeMaps(fourBands, modern);
    expect(reevaluateAchievements(all)).toContain('era-epochs');
  });

  it('theme-renaissance needs 15 each of art, science & writing', () => {
    const incomplete = seed([
      { prefix: 'art', count: 15, category: 'art' },
      { prefix: 'sci', count: 15, category: 'science' },
      { prefix: 'wri', count: 14, category: 'writing' }, // one short
    ]);
    expect(reevaluateAchievements(incomplete)).not.toContain('theme-renaissance');

    const lastWriting = seed([{ prefix: 'wri', count: 15, category: 'writing' }]);
    const complete = mergeMaps(incomplete, lastWriting);
    expect(reevaluateAchievements(complete)).toContain('theme-renaissance');
  });

  it('meta-categories fires only when every category has 20+ placed events', () => {
    // 20 of every category but one -> not yet.
    const missingOne = seed(
      ALL_CATEGORIES.slice(0, -1).map((c) => ({ prefix: c, count: 20, category: c }))
    );
    expect(reevaluateAchievements(missingOne)).not.toContain('meta-categories');

    const lastCat = ALL_CATEGORIES[ALL_CATEGORIES.length - 1];
    const rest = seed([{ prefix: lastCat, count: 20, category: lastCat }]);
    const full = mergeMaps(missingOne, rest);
    expect(reevaluateAchievements(full)).toContain('meta-categories');
  });
});

describe('achievement config consistency', () => {
  it('every card has a test and every test has a card', () => {
    expect(findAchievementConfigMismatches()).toEqual({ missingTests: [], missingCards: [] });
  });
});
