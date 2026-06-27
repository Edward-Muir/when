import { HistoricalEvent, Category, ALL_CATEGORIES } from '../types';
import { buildEventsByName } from '../utils/statsStorage';
import type { StatsSnapshot } from './achievementLogic';
import {
  ACHIEVEMENT_TESTS,
  categoryBadgeId,
  CATEGORY_THRESHOLD,
  findAchievementConfigMismatches,
} from './achievementLogic';

// --- Fixture builders ---

function makeSnapshot(
  parts: {
    lifetime?: Partial<StatsSnapshot['lifetime']>;
    collection?: Partial<StatsSnapshot['collection']>;
    cadence?: Partial<StatsSnapshot['cadence']>;
  } = {}
): StatsSnapshot {
  return {
    lifetime: {
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
      ...parts.lifetime,
    },
    collection: { placedEventIds: [], ...parts.collection },
    cadence: {
      currentDailyStreak: 0,
      maxDailyStreak: 0,
      lastDailyDate: '',
      playedDates: [],
      bestDailyCorrect: 0,
      dailyCorrectSum: 0,
      dailyCorrectHistogram: [],
      ...parts.cadence,
    },
  };
}

function ev(name: string, over: Partial<HistoricalEvent> = {}): HistoricalEvent {
  return {
    name,
    friendly_name: name,
    year: 2000,
    category: 'science',
    description: '',
    difficulty: 'easy',
    ...over,
  };
}

/** Snapshot whose collection is exactly the given events, plus a matching byName map. */
function withEvents(events: HistoricalEvent[]): [StatsSnapshot, Map<string, HistoricalEvent>] {
  const snapshot = makeSnapshot({ collection: { placedEventIds: events.map((e) => e.name) } });
  return [snapshot, buildEventsByName(events)];
}

const EMPTY = new Map<string, HistoricalEvent>();

// --- Threshold-based families ---

describe('milestone / volume / streak / cadence / single-game thresholds', () => {
  it('milestone reads total games across modes', () => {
    const s = makeSnapshot({
      lifetime: { gamesPlayed: { daily: 5, suddenDeath: 3, freeplay: 2 } },
    });
    expect(ACHIEVEMENT_TESTS['01'](s, EMPTY)).toBe(true); // >= 1
    expect(ACHIEVEMENT_TESTS['02'](s, EMPTY)).toBe(true); // >= 10
    expect(ACHIEVEMENT_TESTS['03'](s, EMPTY)).toBe(false); // >= 50
  });

  it('volume reads lifetime correct placements', () => {
    const s = makeSnapshot({ lifetime: { eventsPlacedCorrect: 500 } });
    expect(ACHIEVEMENT_TESTS['05'](s, EMPTY)).toBe(true);
    expect(ACHIEVEMENT_TESTS['06'](s, EMPTY)).toBe(true);
    expect(ACHIEVEMENT_TESTS['07'](s, EMPTY)).toBe(false);
  });

  it('in-game streak reads bestInGameStreakEver (daily-only stat)', () => {
    const s = makeSnapshot({ lifetime: { bestInGameStreakEver: 20 } });
    expect(ACHIEVEMENT_TESTS['22'](s, EMPTY)).toBe(true); // >= 20
    expect(ACHIEVEMENT_TESTS['23'](s, EMPTY)).toBe(false); // >= 25
  });

  it('daily-cadence streak and Old Faithful', () => {
    expect(ACHIEVEMENT_TESTS['24'](makeSnapshot({ cadence: { maxDailyStreak: 3 } }), EMPTY)).toBe(
      true
    );
    expect(ACHIEVEMENT_TESTS['27'](makeSnapshot({ cadence: { maxDailyStreak: 99 } }), EMPTY)).toBe(
      false
    );
    const playedDates = Array.from({ length: 50 }, (_, i) => `d${i}`);
    expect(ACHIEVEMENT_TESTS['33'](makeSnapshot({ cadence: { playedDates } }), EMPTY)).toBe(true);
  });

  it('single-game reads bestGameCorrectEver', () => {
    const s = makeSnapshot({ lifetime: { bestGameCorrectEver: 20 } });
    expect(ACHIEVEMENT_TESTS['30'](s, EMPTY)).toBe(true); // >= 20
    expect(ACHIEVEMENT_TESTS['31'](s, EMPTY)).toBe(false); // >= 25
  });
});

// --- Collection / difficulty derivations (resolve placed ids against event data) ---

describe('category badges', () => {
  it('fires at exactly the threshold, not one below', () => {
    const at19 = Array.from({ length: 19 }, (_, i) => ev(`e${i}`, { category: 'empires' }));
    const at20 = Array.from({ length: 20 }, (_, i) => ev(`e${i}`, { category: 'empires' }));
    expect(ACHIEVEMENT_TESTS[categoryBadgeId('empires')](...withEvents(at19))).toBe(false);
    expect(ACHIEVEMENT_TESTS[categoryBadgeId('empires')](...withEvents(at20))).toBe(true);
    expect(CATEGORY_THRESHOLD).toBe(20);
  });

  it('only counts the matching category', () => {
    const mixed = [
      ...Array.from({ length: 20 }, (_, i) => ev(`emp${i}`, { category: 'empires' })),
      ...Array.from({ length: 20 }, (_, i) => ev(`sci${i}`, { category: 'science' })),
    ];
    const [s, byName] = withEvents(mixed);
    expect(ACHIEVEMENT_TESTS[categoryBadgeId('empires')](s, byName)).toBe(true);
    expect(ACHIEVEMENT_TESTS[categoryBadgeId('art')](s, byName)).toBe(false);
  });

  it('rename test: same placedEventIds, reclassified byName moves derived counts', () => {
    const names = Array.from({ length: 20 }, (_, i) => `e${i}`);
    const snapshot = makeSnapshot({ collection: { placedEventIds: names } });
    const asEmpires = buildEventsByName(names.map((n) => ev(n, { category: 'empires' })));
    const asScience = buildEventsByName(names.map((n) => ev(n, { category: 'science' })));
    expect(ACHIEVEMENT_TESTS[categoryBadgeId('empires')](snapshot, asEmpires)).toBe(true);
    expect(ACHIEVEMENT_TESTS[categoryBadgeId('empires')](snapshot, asScience)).toBe(false);
    expect(ACHIEVEMENT_TESTS[categoryBadgeId('science')](snapshot, asScience)).toBe(true);
  });
});

describe('Polymath (08)', () => {
  it('fires only when every category is represented', () => {
    const oneShort = ALL_CATEGORIES.slice(0, ALL_CATEGORIES.length - 1).map((c, i) =>
      ev(`e${i}`, { category: c })
    );
    const allCats = ALL_CATEGORIES.map((c: Category, i) => ev(`e${i}`, { category: c }));
    expect(ACHIEVEMENT_TESTS['08'](...withEvents(oneShort))).toBe(false);
    expect(ACHIEVEMENT_TESTS['08'](...withEvents(allCats))).toBe(true);
  });
});

describe('year-derived badges', () => {
  it('Ancient Historian (16) needs a placed event older than 1000 BCE', () => {
    expect(ACHIEVEMENT_TESTS['16'](...withEvents([ev('a', { year: -1000 })]))).toBe(false);
    expect(ACHIEVEMENT_TESTS['16'](...withEvents([ev('a', { year: -1001 })]))).toBe(true);
  });

  it('Across the Ages (17) needs every century from the 1st to the 21st', () => {
    const allCenturies = Array.from({ length: 21 }, (_, i) => ev(`c${i}`, { year: i * 100 + 50 }));
    expect(ACHIEVEMENT_TESTS['17'](...withEvents(allCenturies))).toBe(true);
    const missingOne = allCenturies.slice(1); // drop the 1st century
    expect(ACHIEVEMENT_TESTS['17'](...withEvents(missingOne))).toBe(false);
  });
});

describe('difficulty badges', () => {
  it('count placed events by difficulty', () => {
    const veryHard = Array.from({ length: 10 }, (_, i) => ev(`v${i}`, { difficulty: 'very-hard' }));
    expect(ACHIEVEMENT_TESTS['18'](...withEvents(veryHard))).toBe(true);
    expect(ACHIEVEMENT_TESTS['18'](...withEvents(veryHard.slice(1)))).toBe(false);

    const hard = Array.from({ length: 20 }, (_, i) => ev(`h${i}`, { difficulty: 'hard' }));
    expect(ACHIEVEMENT_TESTS['36'](...withEvents(hard))).toBe(true);
  });
});

// --- Config consistency ---

describe('findAchievementConfigMismatches', () => {
  it('reports no gaps once category cards exist (Phase 3)', () => {
    const { missingTests, missingCards } = findAchievementConfigMismatches();
    expect(missingTests).toEqual([]);
    expect(missingCards).toEqual([]);
  });
});
