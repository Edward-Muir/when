/**
 * Hand-authored achievement unlock logic, keyed by the same ids as `ACHIEVEMENTS`
 * in `achievements.ts`. Kept SEPARATE from that file (which is nominally CSV-generated)
 * so these tests are never clobbered by a regenerate.
 *
 * Design (see docs/session-2026-06-27-stats-achievements-master-plan.md): every test is a
 * pure predicate over a read-time `StatsSnapshot` plus a name->event map. Per-category and
 * per-difficulty / per-era badges DERIVE their counts from `placedEventIds` resolved against
 * current event data — nothing category-specific is stored, so new/renamed categories need
 * no stored-data change.
 *
 * Type-only imports from statsStorage keep the runtime dependency one-directional
 * (statsStorage value-imports ACHIEVEMENT_TESTS; this file only type-imports back).
 */

import type { LifetimeStats, CollectionState, DailyCadence } from '../utils/statsStorage';
import { ALL_CATEGORIES, Category, Difficulty, HistoricalEvent } from '../types';
import { ACHIEVEMENTS } from './achievements';

export interface StatsSnapshot {
  lifetime: LifetimeStats;
  collection: CollectionState;
  cadence: DailyCadence;
}

export type AchievementTest = (s: StatsSnapshot, byName: Map<string, HistoricalEvent>) => boolean;

/** Threshold for every per-category "Place N <Category> events" badge. */
export const CATEGORY_THRESHOLD = 20;

/** Stable id for a per-category collection badge. */
export const categoryBadgeId = (c: Category): string => `cat-${c}`;

// --- Derivation helpers (resolve placed ids against current event data) ---

/** Resolve placed event ids to their full events, dropping any not in the current catalogue. */
function placedEvents(s: StatsSnapshot, byName: Map<string, HistoricalEvent>): HistoricalEvent[] {
  const out: HistoricalEvent[] = [];
  for (const id of s.collection.placedEventIds) {
    const event = byName.get(id);
    if (event) out.push(event);
  }
  return out;
}

function countByDifficulty(
  s: StatsSnapshot,
  byName: Map<string, HistoricalEvent>,
  difficulty: Difficulty
): number {
  return placedEvents(s, byName).filter((e) => e.difficulty === difficulty).length;
}

function countByCategory(
  s: StatsSnapshot,
  byName: Map<string, HistoricalEvent>,
  category: Category
): number {
  return placedEvents(s, byName).filter((e) => e.category === category).length;
}

/** CE century for a year (1..N); null for year <= 0 (BCE / year 0 not used here). */
function centuryCE(year: number): number | null {
  return year >= 1 ? Math.floor((year - 1) / 100) + 1 : null;
}

/**
 * Bucket events into 5 broad historical eras and return per-band counts, in order:
 * [Prehistory (<-3000), Antiquity (-3000..476), Medieval (476..1500),
 *  Early-Modern (1500..1800), Modern (>=1800)]. Used by the Epoch Hopper badge.
 */
function epochBands(events: HistoricalEvent[]): [number, number, number, number, number] {
  const bands: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const e of events) {
    const y = e.year;
    if (y < -3000) bands[0]++;
    else if (y < 476) bands[1]++;
    else if (y < 1500) bands[2]++;
    else if (y < 1800) bands[3]++;
    else bands[4]++;
  }
  return bands;
}

const totalGames = (s: StatsSnapshot): number =>
  s.lifetime.gamesPlayed.daily +
  s.lifetime.gamesPlayed.suddenDeath +
  s.lifetime.gamesPlayed.freeplay;

// --- The test table ---

export const ACHIEVEMENT_TESTS: Record<string, AchievementTest> = {
  // Milestone — total games played (custom counts; it folds into the per-mode buckets).
  '01': (s) => totalGames(s) >= 1,
  '02': (s) => totalGames(s) >= 10,
  '03': (s) => totalGames(s) >= 50,
  '04': (s) => totalGames(s) >= 100,

  // Volume — lifetime correct placements.
  '05': (s) => s.lifetime.eventsPlacedCorrect >= 100,
  '06': (s) => s.lifetime.eventsPlacedCorrect >= 500,
  '07': (s) => s.lifetime.eventsPlacedCorrect >= 1000,

  // Polymath — at least one placed event in every category.
  '08': (s, byName) => {
    const seen = new Set<Category>();
    for (const e of placedEvents(s, byName)) seen.add(e.category);
    return seen.size >= ALL_CATEGORIES.length;
  },

  // Ancient Historian — a placed event older than 1000 BCE.
  '16': (s, byName) => placedEvents(s, byName).some((e) => e.year < -1000),

  // Across the Ages — a placed event in every century from the 1st to the 21st (CE).
  '17': (s, byName) => {
    const needed = new Set<number>();
    for (let c = 1; c <= 21; c++) needed.add(c);
    for (const e of placedEvents(s, byName)) {
      const c = centuryCE(e.year);
      if (c !== null && c <= 21) needed.delete(c);
    }
    return needed.size === 0;
  },

  // Difficulty — counts of placed events by difficulty.
  '18': (s, byName) => countByDifficulty(s, byName, 'very-hard') >= 10,
  '34': (s, byName) => countByDifficulty(s, byName, 'easy') >= 80,
  '35': (s, byName) => countByDifficulty(s, byName, 'medium') >= 40,
  '36': (s, byName) => countByDifficulty(s, byName, 'hard') >= 20,

  // In-game streak — DAILY ONLY (bestInGameStreakEver only advances on daily games).
  '19': (s) => s.lifetime.bestInGameStreakEver >= 5,
  '20': (s) => s.lifetime.bestInGameStreakEver >= 10,
  '21': (s) => s.lifetime.bestInGameStreakEver >= 15,
  '22': (s) => s.lifetime.bestInGameStreakEver >= 20,
  '23': (s) => s.lifetime.bestInGameStreakEver >= 25,

  // Daily-cadence streak.
  '24': (s) => s.cadence.maxDailyStreak >= 3,
  '25': (s) => s.cadence.maxDailyStreak >= 7,
  '26': (s) => s.cadence.maxDailyStreak >= 30,
  '27': (s) => s.cadence.maxDailyStreak >= 100,

  // Old Faithful — distinct days played.
  '33': (s) => s.cadence.playedDates.length >= 50,

  // Single-game — best correct placements in one game (any mode that feeds lifetime).
  '28': (s) => s.lifetime.bestGameCorrectEver >= 10,
  '29': (s) => s.lifetime.bestGameCorrectEver >= 15,
  '30': (s) => s.lifetime.bestGameCorrectEver >= 20,
  '31': (s) => s.lifetime.bestGameCorrectEver >= 25,
  '32': (s) => s.lifetime.bestGameCorrectEver >= 30,

  // Collection breadth — distinct unique events collected (any mode).
  'coll-100': (s) => s.collection.placedEventIds.length >= 100,
  'coll-500': (s) => s.collection.placedEventIds.length >= 500,
  'coll-1500': (s) => s.collection.placedEventIds.length >= 1500,
  'coll-3000': (s) => s.collection.placedEventIds.length >= 3000,

  // Era / epoch — derived from placed-event years.
  'era-bce': (s, byName) => placedEvents(s, byName).filter((e) => e.year < 0).length >= 25,
  'era-modern': (s, byName) =>
    placedEvents(s, byName).filter((e) => centuryCE(e.year) === 21).length >= 50,
  'era-epochs': (s, byName) => epochBands(placedEvents(s, byName)).every((n) => n >= 15),

  // Themed multi-category combos — 15 of each named category.
  'theme-renaissance': (s, byName) =>
    countByCategory(s, byName, 'art') >= 15 &&
    countByCategory(s, byName, 'science') >= 15 &&
    countByCategory(s, byName, 'writing') >= 15,
  'theme-statecraft': (s, byName) =>
    countByCategory(s, byName, 'empires') >= 15 &&
    countByCategory(s, byName, 'law') >= 15 &&
    countByCategory(s, byName, 'diplomacy') >= 15,

  // Completionist meta — every category badge earned (i.e. CATEGORY_THRESHOLD of each).
  // Derived from counts (not from `unlocked`) so it can't lag a category unlock by a game.
  'meta-categories': (s, byName) => {
    const counts = new Map<Category, number>();
    for (const e of placedEvents(s, byName))
      counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    return ALL_CATEGORIES.every((c) => (counts.get(c) ?? 0) >= CATEGORY_THRESHOLD);
  },
};

// Category badges, generated from the taxonomy — adding a category needs only a card row.
for (const category of ALL_CATEGORIES) {
  ACHIEVEMENT_TESTS[categoryBadgeId(category)] = (s, byName) =>
    countByCategory(s, byName, category) >= CATEGORY_THRESHOLD;
}

/**
 * Dev-only consistency check: every achievement card should have a test and vice-versa.
 * Returns the symmetric difference between card ids and test ids.
 *
 * As of Phase 3 (20 `cat-*` cards replace the stale 7) this should report empty. Any
 * non-empty result is now a real bug: a card missing logic, or logic missing a card.
 */
export function findAchievementConfigMismatches(): {
  missingTests: string[];
  missingCards: string[];
} {
  const cardIds = new Set(ACHIEVEMENTS.map((a) => a.id));
  const testIds = new Set(Object.keys(ACHIEVEMENT_TESTS));
  return {
    missingTests: Array.from(cardIds).filter((id) => !testIds.has(id)), // cards without logic
    missingCards: Array.from(testIds).filter((id) => !cardIds.has(id)), // logic without a card
  };
}

if (process.env.NODE_ENV !== 'production') {
  const { missingTests, missingCards } = findAchievementConfigMismatches();
  if (missingTests.length || missingCards.length) {
    console.warn('[achievementLogic] config mismatch:', { missingTests, missingCards });
  }
}
