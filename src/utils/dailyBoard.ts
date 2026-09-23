import { FailedPlacement, HistoricalEvent, WhenGameState } from '../types';
import { buildDailyConfig } from './dailyConfig';
import { getLocalDateString } from './puzzleDate';
import { buildEventsByName } from './statsStorage';
import { readJson, writeJson } from './storage';

/**
 * Today's finished daily board, kept so the player can re-open it and read the cards.
 *
 * One slot, stamped with the puzzle date. `getTodayDailyBoard` returns null unless the stamp
 * is today, so tomorrow's game overwrites yesterday's board and nothing accumulates — the same
 * self-invalidating shape as `when-daily-result` (`playerStorage.ts`), and for the same reason:
 * no cleanup pass, no timer, no second key.
 *
 * Event slugs are stored, never event objects, and resolved against the catalogue on restore
 * (the `statsStorage` / `gameHistory` convention). A slug the catalogue no longer carries —
 * an event dropped by a deploy part-way through the day — is skipped rather than failing the
 * restore.
 *
 * Lives here rather than in `playerStorage` so that module stays free of the catalogue and
 * config imports, which is the same reason `dailyResult.ts` is its own file.
 */
const DAILY_BOARD_KEY = 'when-daily-board';

/** A failed placement with its event reduced to a slug. */
interface StoredFailure {
  name: string;
  attemptedPosition: number;
  correctPosition?: number;
  timelineLength?: number;
  seq: number;
}

export interface DailyBoardSnapshot {
  /** Puzzle date (`lastConfig.dailySeed`), YYYY-MM-DD in the player's local calendar. */
  date: string;
  /** Correctly placed cards in timeline (year) order, including the face-up seed card. */
  timeline: string[];
  seedEventName?: string;
  /** Misplaced cards, shown as tombstones at their true position. */
  failed: StoredFailure[];
  /** One entry per attempt, in turn order — what the share's emoji grid is built from. */
  placementHistory: boolean[];
  bestStreak: number;
}

/**
 * The snapshot for a finished daily, or null for anything else. Mirrors `buildDailyResult`'s
 * contract: `dailySeed` is the load-bearing part, because it is the date the board is stamped
 * with.
 */
export function buildDailyBoardSnapshot(state: WhenGameState): DailyBoardSnapshot | null {
  const { gameMode, lastConfig, timeline, failedPlacements, placementHistory, bestStreak } = state;
  if (gameMode !== 'daily' || !lastConfig?.dailySeed) return null;

  return {
    date: lastConfig.dailySeed,
    timeline: timeline.map((event) => event.name),
    seedEventName: state.seedEventName,
    failed: failedPlacements.map((failure) => ({
      name: failure.event.name,
      attemptedPosition: failure.attemptedPosition,
      correctPosition: failure.correctPosition,
      timelineLength: failure.timelineLength,
      seq: failure.seq,
    })),
    placementHistory: [...placementHistory],
    bestStreak,
  };
}

export function saveDailyBoard(snapshot: DailyBoardSnapshot | null): void {
  if (!snapshot) return;
  writeJson(DAILY_BOARD_KEY, snapshot, 'daily board');
}

/**
 * Today's stored board, or null if there is none or the stored one is from another day.
 *
 * `dateString` (local YYYY-MM-DD) defaults to today; callers pass it explicitly so a memo's
 * rollover dependency stays visible to the linter, which is why `buildDailyDeck` takes one too.
 */
export function getTodayDailyBoard(
  dateString: string = getLocalDateString()
): DailyBoardSnapshot | null {
  return readJson(DAILY_BOARD_KEY, null, (raw) => {
    const snapshot = raw as DailyBoardSnapshot | null;
    if (snapshot?.date !== dateString) return null;
    if (!Array.isArray(snapshot.timeline)) return null;

    return {
      ...snapshot,
      failed: Array.isArray(snapshot.failed) ? snapshot.failed : [],
      placementHistory: Array.isArray(snapshot.placementHistory) ? snapshot.placementHistory : [],
      bestStreak: snapshot.bestStreak ?? 0,
    };
  });
}

/**
 * Rehydrate a snapshot into the game state the board was left in, flagged `isReview` so no
 * game-over effect writes anything (see the flag's comment in `types/index.ts`).
 *
 * Returns null when there is nothing to show: no snapshot, or every slug in it has since left
 * the catalogue. The caller gates the entry point on that null rather than opening an empty
 * board.
 */
export function restoreDailyBoard(
  snapshot: DailyBoardSnapshot | null,
  allEvents: HistoricalEvent[]
): WhenGameState | null {
  if (!snapshot || allEvents.length === 0) return null;

  const eventsByName = buildEventsByName(allEvents);
  const resolve = (name: string) => eventsByName.get(name);

  const timeline = snapshot.timeline
    .map(resolve)
    .filter((event): event is HistoricalEvent => event !== undefined);
  if (timeline.length === 0) return null;

  const failedPlacements: FailedPlacement[] = snapshot.failed.flatMap((failure) => {
    const event = resolve(failure.name);
    if (!event) return [];
    return [
      {
        event,
        attemptedPosition: failure.attemptedPosition,
        correctPosition: failure.correctPosition,
        timelineLength: failure.timelineLength,
        seq: failure.seq,
      },
    ];
  });

  // `lastConfig` carries the daily seed and the single seated player, which is what lets the
  // bottom bar's Share reproduce the message the game ended on (`generateShareText`) and the
  // TopBar name the day's theme. The snapshot only reads back on its own date, so today's
  // config is the config this board was played under.
  const lastConfig = buildDailyConfig();

  return {
    phase: 'gameOver',
    gameMode: 'daily',
    isReview: true,
    timeline,
    seedEventName: snapshot.seedEventName,
    deck: [],
    placementHistory: [...snapshot.placementHistory],
    failedPlacements,
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig,
    players: [
      {
        id: 0,
        name: lastConfig.playerNames?.[0] ?? 'Player 1',
        hand: [],
        hasWon: false,
        placementHistory: [...snapshot.placementHistory],
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: snapshot.placementHistory.length,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: 0,
    bestStreak: snapshot.bestStreak,
  };
}
