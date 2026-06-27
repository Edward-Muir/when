/**
 * localStorage utilities for the stats / achievements foundation.
 *
 * Design principle (see docs/session-2026-06-27-stats-achievements-master-plan.md):
 * store generic primitives, derive every per-category stat at read time. The key
 * primitive is `CollectionState.placedEventIds` — the UNIQUE set of correctly-placed
 * event names, unioned across all modes. Per-category counts are derived later by
 * resolving each id against loaded event data; we never store Record<Category, number>
 * counters, so new/renamed categories need zero stored-data change.
 *
 * Mirrors the patterns in playerStorage.ts: one localStorage key per object, every
 * accessor wrapped in try/catch, fail-silent. Getters return a fully-populated
 * zero-default object (never null) so callers can read nested fields without guards.
 */

import { HistoricalEvent, WhenGameState } from '../types';
import { getTimelineHighScore } from './playerStorage';
import { ACHIEVEMENT_TESTS, StatsSnapshot } from '../data/achievementLogic';

// --- Lifetime Stats (daily / suddenDeath / freeplay, excludes custom games) ---

export interface LifetimeStats {
  gamesPlayed: { daily: number; suddenDeath: number; freeplay: number };
  eventsPlacedCorrect: number;
  eventsPlacedWrong: number;
  timelineLengthSum: { daily: number; suddenDeath: number; freeplay: number };
  longestTimeline: { daily: number; suddenDeath: number; freeplay: number };
  bestInGameStreakEver: number;
  bestGameCorrectEver: number;
  flawlessFreeplayGames: number;
  firstPlayedDate: string;
  lastPlayedDate: string;
}

const LIFETIME_STATS_KEY = 'when-lifetime-stats';

function defaultLifetimeStats(): LifetimeStats {
  return {
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
  };
}

/**
 * Get lifetime stats, merged over zero-defaults so older/partial stored shapes
 * still yield every field.
 *
 * Also performs a one-time, idempotent high-score migration: if the Sudden Death
 * longest-timeline is unset and the legacy `when-timeline-high-score` has a value,
 * seed it. Once seeded, the guard skips on every subsequent read.
 */
export function getLifetimeStats(): LifetimeStats {
  const stats = readLifetimeStats();

  if (!stats.longestTimeline.suddenDeath) {
    const legacyHighScore = getTimelineHighScore();
    if (legacyHighScore > 0) {
      stats.longestTimeline.suddenDeath = legacyHighScore;
      saveLifetimeStats(stats);
    }
  }

  return stats;
}

function readLifetimeStats(): LifetimeStats {
  try {
    const stored = localStorage.getItem(LIFETIME_STATS_KEY);
    if (!stored) return defaultLifetimeStats();

    const parsed = JSON.parse(stored) as Partial<LifetimeStats>;
    const base = defaultLifetimeStats();
    return {
      ...base,
      ...parsed,
      gamesPlayed: { ...base.gamesPlayed, ...parsed.gamesPlayed },
      timelineLengthSum: { ...base.timelineLengthSum, ...parsed.timelineLengthSum },
      longestTimeline: { ...base.longestTimeline, ...parsed.longestTimeline },
    };
  } catch {
    return defaultLifetimeStats();
  }
}

export function saveLifetimeStats(stats: LifetimeStats): void {
  try {
    localStorage.setItem(LIFETIME_STATS_KEY, JSON.stringify(stats));
  } catch {
    console.warn('Failed to save lifetime stats to localStorage');
  }
}

// --- Collection (unique correctly-placed event names, ALL modes incl. custom) ---

export interface CollectionState {
  placedEventIds: string[];
}

const COLLECTION_KEY = 'when-collection';

function defaultCollectionState(): CollectionState {
  return { placedEventIds: [] };
}

export function getCollectionState(): CollectionState {
  try {
    const stored = localStorage.getItem(COLLECTION_KEY);
    if (!stored) return defaultCollectionState();

    const parsed = JSON.parse(stored) as Partial<CollectionState>;
    const ids = Array.isArray(parsed.placedEventIds) ? parsed.placedEventIds : [];
    // De-dupe defensively so a corrupted/duplicated store still reads clean.
    return { placedEventIds: Array.from(new Set(ids)) };
  } catch {
    return defaultCollectionState();
  }
}

export function saveCollectionState(state: CollectionState): void {
  try {
    const deduped = { placedEventIds: Array.from(new Set(state.placedEventIds)) };
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(deduped));
  } catch {
    console.warn('Failed to save collection state to localStorage');
  }
}

/**
 * Union new event names into the stored collection, de-duplicating. Returns the
 * resulting (saved) collection state.
 */
export function addPlacedEventIds(names: string[]): CollectionState {
  const current = getCollectionState();
  const merged = { placedEventIds: Array.from(new Set([...current.placedEventIds, ...names])) };
  saveCollectionState(merged);
  return merged;
}

// --- Daily Cadence (daily-mode streaks & per-day history) ---

export interface DailyCadence {
  currentDailyStreak: number;
  maxDailyStreak: number;
  lastDailyDate: string;
  playedDates: string[];
  bestDailyCorrect: number;
  dailyCorrectSum: number;
  dailyCorrectHistogram: number[];
}

const DAILY_CADENCE_KEY = 'when-daily-cadence';

function defaultDailyCadence(): DailyCadence {
  return {
    currentDailyStreak: 0,
    maxDailyStreak: 0,
    lastDailyDate: '',
    playedDates: [],
    bestDailyCorrect: 0,
    dailyCorrectSum: 0,
    dailyCorrectHistogram: [],
  };
}

export function getDailyCadence(): DailyCadence {
  try {
    const stored = localStorage.getItem(DAILY_CADENCE_KEY);
    if (!stored) return defaultDailyCadence();

    const parsed = JSON.parse(stored) as Partial<DailyCadence>;
    const base = defaultDailyCadence();
    return {
      ...base,
      ...parsed,
      playedDates: Array.isArray(parsed.playedDates) ? parsed.playedDates : base.playedDates,
      dailyCorrectHistogram: Array.isArray(parsed.dailyCorrectHistogram)
        ? parsed.dailyCorrectHistogram
        : base.dailyCorrectHistogram,
    };
  } catch {
    return defaultDailyCadence();
  }
}

export function saveDailyCadence(cadence: DailyCadence): void {
  try {
    localStorage.setItem(DAILY_CADENCE_KEY, JSON.stringify(cadence));
  } catch {
    console.warn('Failed to save daily cadence to localStorage');
  }
}

// --- Achievements (unlocked id -> ISO date) ---

export interface Achievements {
  unlocked: { [achievementId: string]: string };
}

const ACHIEVEMENTS_KEY = 'when-achievements';

function defaultAchievements(): Achievements {
  return { unlocked: {} };
}

export function getAchievements(): Achievements {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!stored) return defaultAchievements();

    const parsed = JSON.parse(stored) as Partial<Achievements>;
    const unlocked = parsed.unlocked && typeof parsed.unlocked === 'object' ? parsed.unlocked : {};
    return { unlocked };
  } catch {
    return defaultAchievements();
  }
}

export function saveAchievements(achievements: Achievements): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  } catch {
    console.warn('Failed to save achievements to localStorage');
  }
}

// --- Event lookup (pure, no storage) ---

/**
 * Build a name -> full-event lookup from the loaded catalogue. Keyed by the stable
 * `name` id; stores the whole event so later phases can derive category / era /
 * difficulty without storing those derivations.
 */
export function buildEventsByName(events: HistoricalEvent[]): Map<string, HistoricalEvent> {
  const map = new Map<string, HistoricalEvent>();
  for (const event of events) {
    map.set(event.name, event);
  }
  return map;
}

// --- Recording + achievement evaluation ---

/** Today in YYYY-MM-DD (local), matching playerStorage's convention. */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/** Whole-day difference between two YYYY-MM-DD strings (b - a). */
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/**
 * Record a finished game into the stats primitives and unlock any newly-earned achievements.
 *
 * Daily vs non-daily (via `lastConfig.dailySeed`) is the only split. Non-daily play —
 * Sudden Death, Freeplay, and shared challenge games alike — feeds the per-mode LifetimeStats
 * buckets and the collection, but NOT the daily-only families: `bestInGameStreakEver` and the
 * daily-cadence streak advance on daily games only (so the in-game-streak and daily badges are
 * daily-only).
 *
 * Multiplayer v1: `state.timeline` / `state.placementHistory` are game-level (all players
 * combined); we union the whole final timeline as one personal collection — acceptable for now.
 *
 * NOT idempotent (it increments) — callers must record each finished game exactly once.
 *
 * @returns ids unlocked by THIS call (for the unlock-moment UI).
 */
export function recordGameResult(
  state: WhenGameState,
  eventsByName: Map<string, HistoricalEvent>
): string[] {
  const modeKey = state.gameMode;
  if (modeKey === null) return [];

  const isDaily = !!state.lastConfig?.dailySeed;
  const correct = state.placementHistory.filter((p) => p).length;
  const wrong = state.placementHistory.filter((p) => !p).length;
  const len = state.timeline.length;
  const today = getTodayDateString();

  // Collection — union this game's correctly-placed events (all modes).
  const placedNames = state.timeline
    .map((e) => e.name)
    .filter((name) => name !== state.seedEventName);
  addPlacedEventIds(placedNames);

  // Lifetime — advanced by every game (daily + custom), per mode.
  const lifetime = getLifetimeStats();
  /* eslint-disable security/detect-object-injection -- modeKey is a typed GameMode union */
  lifetime.gamesPlayed[modeKey] += 1;
  lifetime.eventsPlacedCorrect += correct;
  lifetime.eventsPlacedWrong += wrong;
  lifetime.timelineLengthSum[modeKey] += len;
  lifetime.longestTimeline[modeKey] = Math.max(lifetime.longestTimeline[modeKey], len);
  /* eslint-enable security/detect-object-injection */
  lifetime.bestGameCorrectEver = Math.max(lifetime.bestGameCorrectEver, correct);
  if (modeKey === 'freeplay' && wrong === 0 && correct > 0) {
    lifetime.flawlessFreeplayGames += 1;
  }
  if (!lifetime.firstPlayedDate) lifetime.firstPlayedDate = today;
  lifetime.lastPlayedDate = today;
  // In-game streak is daily-only.
  if (isDaily) {
    lifetime.bestInGameStreakEver = Math.max(lifetime.bestInGameStreakEver, state.bestStreak);
  }
  saveLifetimeStats(lifetime);

  // Daily cadence — daily games only, idempotent per date.
  if (isDaily) {
    const date = state.lastConfig!.dailySeed!;
    const cadence = getDailyCadence();
    if (!cadence.playedDates.includes(date)) {
      if (cadence.lastDailyDate && dayDiff(cadence.lastDailyDate, date) === 1) {
        cadence.currentDailyStreak += 1;
      } else {
        cadence.currentDailyStreak = 1;
      }
      cadence.maxDailyStreak = Math.max(cadence.maxDailyStreak, cadence.currentDailyStreak);
      cadence.lastDailyDate = date;
      cadence.playedDates.push(date);
      cadence.bestDailyCorrect = Math.max(cadence.bestDailyCorrect, correct);
      cadence.dailyCorrectSum += correct;
      // eslint-disable-next-line security/detect-object-injection -- correct is a numeric count
      cadence.dailyCorrectHistogram[correct] = (cadence.dailyCorrectHistogram[correct] ?? 0) + 1;
      saveDailyCadence(cadence);
    }
  }

  return reevaluateAchievements(eventsByName);
}

/**
 * Run every achievement test against the current stats; unlock newly-passing ones with
 * today's date. Idempotent — already-unlocked ids are never re-dated or un-set.
 *
 * @returns ids unlocked by THIS call.
 */
export function reevaluateAchievements(eventsByName: Map<string, HistoricalEvent>): string[] {
  const snapshot: StatsSnapshot = {
    lifetime: getLifetimeStats(),
    collection: getCollectionState(),
    cadence: getDailyCadence(),
  };

  const achievements = getAchievements();
  const today = getTodayDateString();
  const newlyUnlocked: string[] = [];

  for (const [id, test] of Object.entries(ACHIEVEMENT_TESTS)) {
    /* eslint-disable security/detect-object-injection -- id is a config key from our own table */
    if (achievements.unlocked[id]) continue;
    if (test(snapshot, eventsByName)) {
      achievements.unlocked[id] = today;
      newlyUnlocked.push(id);
    }
    /* eslint-enable security/detect-object-injection */
  }

  if (newlyUnlocked.length > 0) saveAchievements(achievements);
  return newlyUnlocked;
}
