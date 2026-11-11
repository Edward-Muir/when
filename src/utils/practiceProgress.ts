import { GameConfig, HistoricalEvent, PlacementResult, WhenGameState } from '../types';
import {
  BoardProgress,
  buildBoardProgress,
  isBoardProgress,
  restoreBoardProgress,
  settleDailyPlacement,
} from './dailyProgress';
import { DifficultyIndex } from './difficultyScore';
import { readJson, removeKeys, writeJson } from './storage';

/**
 * The practice game in progress (a Custom game, a Quick deck, an Archive day, a theme replay or
 * a challenge link: every `suddenDeath` game), saved after every move so a reload or an evicted
 * app lands back on the board instead of losing it.
 *
 * One slot, the daily's board shape (`BoardProgress` in `dailyProgress.ts`) stamped with the
 * game's whole config rather than a date. The config is what re-composes the deck: every
 * practice deck is seeded (a Custom game's challenge code, a replay's fresh seed, an Archive
 * day's date), so the same config deals the same deck and only the seen cards need storing.
 *
 * Single player only, as the daily's is. A multiplayer game is never saved, and starting one
 * drops whatever was. Cleared at game over, by every way home from a game, and by any other
 * game starting; a Restart overwrites it with the new deal. See `usePracticeProgress`.
 */
const PRACTICE_PROGRESS_KEY = 'when-practice-progress';

export interface PracticeProgressSnapshot extends BoardProgress {
  /** `lastConfig` as dealt: the deck's seed, its filters, and the Archive date or theme. */
  config: GameConfig;
}

/** Whether a game is one the practice slot holds: a single-player `suddenDeath` game in play. */
export function isPracticeGame(state: WhenGameState): boolean {
  return state.gameMode === 'suddenDeath' && !state.isReview && state.players.length === 1;
}

/** The snapshot for a single-player practice game in play, or null for anything else. */
export function buildPracticeProgressSnapshot(
  state: WhenGameState
): PracticeProgressSnapshot | null {
  if (!isPracticeGame(state) || !state.lastConfig) return null;
  const board = buildBoardProgress(state);
  return board && { config: state.lastConfig, ...board };
}

export function savePracticeProgress(snapshot: PracticeProgressSnapshot | null): void {
  if (snapshot) writeJson(PRACTICE_PROGRESS_KEY, snapshot, 'practice progress');
}

export function clearPracticeProgress(): void {
  removeKeys([PRACTICE_PROGRESS_KEY], 'practice progress');
}

function normalizeSnapshot(raw: unknown): PracticeProgressSnapshot | null {
  const snapshot = raw as PracticeProgressSnapshot | null;
  if (!isBoardProgress(snapshot) || snapshot.config?.mode !== 'suddenDeath') return null;
  return snapshot;
}

/** The saved practice game, or null if there is none or it does not read back whole. */
export function getPracticeProgress(): PracticeProgressSnapshot | null {
  return readJson(PRACTICE_PROGRESS_KEY, null, normalizeSnapshot);
}

/**
 * The saved practice game rebuilt on the deck its config deals (`compose`, `useWhenGame`'s
 * own composer), or null to stay on Home. `challengeCode`, when given, is the link being
 * opened: only a save of that same link resumes. A save the deck no longer matches (an update
 * changed the catalogue under it) is dropped, as the daily's is.
 */
export function resumePracticeProgress(
  compose: (config: GameConfig) => HistoricalEvent[],
  challengeCode?: string
): WhenGameState | null {
  const snapshot = getPracticeProgress();
  if (!snapshot) return null;
  if (challengeCode !== undefined && snapshot.config.challengeCode !== challengeCode) return null;
  const resumed = restoreBoardProgress(snapshot, compose(snapshot.config), snapshot.config);
  if (!resumed) clearPracticeProgress();
  return resumed;
}

/**
 * `placeCard`'s entry point: save where a practice placement will settle, the moment the card
 * is dropped, for the reason the daily does (`settleDailyPlacement`). A no-op for other games.
 */
export function savePracticePlacement(
  state: WhenGameState,
  activeCard: HistoricalEvent,
  insertionIndex: number,
  result: PlacementResult,
  index: DifficultyIndex
): void {
  if (!isPracticeGame(state)) return;
  const settled = settleDailyPlacement(state, activeCard, insertionIndex, result, index);
  savePracticeProgress(buildPracticeProgressSnapshot(settled));
}
