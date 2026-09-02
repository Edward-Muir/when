import { WhenGameState } from '../types';
import { getLocalDateString } from './puzzleDate';
import { DAILY_HAND_SIZE } from './dailyConfig';

/**
 * One compact record per finished game — the history behind the stats page's calendar and,
 * once enough has accumulated, its "are you getting better" views.
 *
 * Nothing else keeps per-game detail: the cadence stores dates without scores, the daily
 * result is overwritten every day, and the lifetime totals are sums. This is the first place
 * a score can be tied to a date, or a miss to how far off it was. Written once per finished
 * game by `useGameStatsRecorder`, which owns the once-per-game guard (this module is not
 * idempotent for custom games; a daily is skipped when its date is already recorded, the
 * same guard the cadence uses).
 *
 * Same discipline as the rest of the stats storage: store primitives, derive at read time.
 * A record holds event ids and booleans — never a category, era or difficulty — so every
 * per-category view is resolved against the catalogue when it is read, and a retaxonomy
 * needs no migration. One key, fail-silent accessors, a full default rather than null.
 *
 * Kept to `GAME_HISTORY_CAP` records, pruning custom games before dailies so a year of
 * dailies survives any amount of custom play (~700 bytes a record; the cap is ~300 KB).
 */
export interface GameMiss {
  /** Event `name` of the card that was misplaced. */
  id: string;
  /** Slots between where it was dropped and where it belonged. */
  off: number;
  /** Timeline length at the time, so `off` can be normalised. */
  len: number;
}

export interface GameRecord {
  /** Local `YYYY-MM-DD`. A daily's puzzle date; the day it was played for anything else. */
  date: string;
  mode: 'daily' | 'suddenDeath';
  /** Placement correctness in turn order, e.g. `"1110100"`. */
  placements: string;
  /** Event `name`s placed correctly, in timeline (year) order. The seed card is excluded. */
  correct: string[];
  misses: GameMiss[];
  bestStreak: number;
  /** Final timeline length, seed card included. */
  timelineLength: number;
  /** The curated theme the game ran, if any: the daily on its day or an Archive replay. */
  themeId?: string;
  /** Theme games only: the deck ran dry / ran dry without a mistake. */
  cleared?: boolean;
  perfect?: boolean;
  /** Custom games only: the hand size, so scores group by comparable rules. */
  handSize?: number;
  /** Daily only, patched in once the leaderboard answers. */
  rank?: number;
  totalPlayers?: number;
  /** Reserved for timing instrumentation. */
  durationMs?: number;
}

export const GAME_HISTORY_CAP = 400;

const GAME_HISTORY_KEY = 'when-game-history';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

function readMiss(value: unknown): GameMiss | null {
  if (!value || typeof value !== 'object') return null;
  const miss = value as Partial<GameMiss>;
  if (typeof miss.id !== 'string' || !Number.isFinite(miss.off) || !Number.isFinite(miss.len)) {
    return null;
  }
  return { id: miss.id, off: miss.off as number, len: miss.len as number };
}

/** Rebuild a stored record field by field, so junk and retired keys never survive a save. */
function readRecord(value: unknown): GameRecord | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<GameRecord>;
  if (typeof raw.date !== 'string' || typeof raw.placements !== 'string') return null;
  if (raw.mode !== 'daily' && raw.mode !== 'suddenDeath') return null;
  if (!isStringArray(raw.correct) || !Array.isArray(raw.misses)) return null;

  const record: GameRecord = {
    date: raw.date,
    mode: raw.mode,
    placements: raw.placements,
    correct: raw.correct,
    misses: raw.misses.map(readMiss).filter((miss): miss is GameMiss => miss !== null),
    bestStreak: Number.isFinite(raw.bestStreak) ? (raw.bestStreak as number) : 0,
    timelineLength: Number.isFinite(raw.timelineLength) ? (raw.timelineLength as number) : 0,
  };
  readOptionalFields(raw, record);
  return record;
}

const OPTIONAL_FLAGS = ['cleared', 'perfect'] as const;
const OPTIONAL_NUMBERS = ['handSize', 'rank', 'totalPlayers', 'durationMs'] as const;

function readOptionalFields(raw: Partial<GameRecord>, record: GameRecord): void {
  if (typeof raw.themeId === 'string') record.themeId = raw.themeId;
  /* eslint-disable security/detect-object-injection -- keys come from the const lists above */
  for (const key of OPTIONAL_FLAGS) {
    if (typeof raw[key] === 'boolean') record[key] = raw[key];
  }
  for (const key of OPTIONAL_NUMBERS) {
    if (Number.isFinite(raw[key])) record[key] = raw[key];
  }
  /* eslint-enable security/detect-object-injection */
}

/** Every recorded game, oldest first. Empty on missing, corrupt or disabled storage. */
export function getGameHistory(): GameRecord[] {
  try {
    const stored = localStorage.getItem(GAME_HISTORY_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(readRecord).filter((record): record is GameRecord => record !== null);
  } catch {
    return [];
  }
}

function saveGameHistory(records: GameRecord[]): void {
  try {
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(records));
  } catch {
    console.warn('Failed to save game history to localStorage');
  }
}

/** Drop the oldest custom game while over the cap; only once none remain, the oldest daily. */
function prune(records: GameRecord[]): GameRecord[] {
  const kept = [...records];
  while (kept.length > GAME_HISTORY_CAP) {
    const oldestCustom = kept.findIndex((record) => record.mode !== 'daily');
    kept.splice(oldestCustom === -1 ? 0 : oldestCustom, 1);
  }
  return kept;
}

export interface GameRecordExtras {
  themeId?: string;
  cleared?: boolean;
  perfect?: boolean;
}

/**
 * The record for a finished game. Pure: reads the state, touches no storage. Misses that
 * predate `correctPosition` on `FailedPlacement` are left out rather than guessed.
 *
 * @returns null when the state never started a game.
 */
export function buildGameRecord(
  state: WhenGameState,
  extras: GameRecordExtras = {}
): GameRecord | null {
  const mode = state.gameMode;
  if (mode === null) return null;
  const dailySeed = state.lastConfig?.dailySeed;

  const record: GameRecord = {
    date: dailySeed ?? getLocalDateString(),
    mode,
    placements: state.placementHistory.map((correct) => (correct ? '1' : '0')).join(''),
    correct: state.timeline.map((e) => e.name).filter((name) => name !== state.seedEventName),
    misses: state.failedPlacements.flatMap((miss) =>
      miss.correctPosition === undefined || miss.timelineLength === undefined
        ? []
        : [
            {
              id: miss.event.name,
              off: Math.abs(miss.attemptedPosition - miss.correctPosition),
              len: miss.timelineLength,
            },
          ]
    ),
    bestStreak: state.bestStreak,
    timelineLength: state.timeline.length,
  };
  if (extras.themeId) {
    record.themeId = extras.themeId;
    record.cleared = extras.cleared === true;
    record.perfect = extras.perfect === true;
  }
  if (!dailySeed) {
    record.handSize = state.lastConfig?.suddenDeathHandSize ?? DAILY_HAND_SIZE;
  }
  return record;
}

/**
 * Append one finished game. A daily whose date is already recorded is skipped — the same
 * per-date guard the cadence uses — so a re-fired effect cannot double-count a day. Custom
 * games always append; the caller records each exactly once.
 */
export function appendGameRecord(record: GameRecord): void {
  const records = getGameHistory();
  if (
    record.mode === 'daily' &&
    records.some((existing) => existing.mode === 'daily' && existing.date === record.date)
  ) {
    return;
  }
  saveGameHistory(prune([...records, record]));
}

/** Attach the leaderboard placing to that day's daily record, once the board has answered. */
export function patchDailyRank(date: string, rank: number, totalPlayers: number): void {
  const records = getGameHistory();
  const target = records.find((record) => record.mode === 'daily' && record.date === date);
  if (!target) return;
  if (target.rank === rank && target.totalPlayers === totalPlayers) return;
  target.rank = rank;
  target.totalPlayers = totalPlayers;
  saveGameHistory(records);
}
