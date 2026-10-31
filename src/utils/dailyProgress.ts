import { GameConfig, HistoricalEvent, PlacementResult, WhenGameState } from '../types';
import { StoredFailure } from './dailyBoard';
import { insertIntoTimeline, settledPosition } from './gameLogic';
import { processCorrectPlacement, processIncorrectPlacement } from './placementLogic';
import { CATCH_UP_REACH } from './catchUp';
import { DifficultyIndex } from './difficultyScore';
import { getLocalDateString } from './puzzleDate';

/**
 * Today's unfinished daily, saved after every move so closing the app cannot re-deal it.
 *
 * Without this the daily lived only in React memory and was marked played only at game over.
 * The deck is seeded from the date, so quitting part-way and pressing Play again dealt the
 * identical deck to a player who now knew where the first cards went.
 *
 * One slot stamped with the puzzle date, the `dailyBoard.ts` shape: a slot from another day
 * reads back as null, so nothing needs cleaning up at rollover. Slugs only, never event
 * objects, and no copy of the remaining deck: see `restoreDailyProgress` for why it is not
 * needed.
 */
const DAILY_PROGRESS_KEY = 'when-daily-progress';

export interface DailyProgressSnapshot {
  /** Puzzle date (`lastConfig.dailySeed`), YYYY-MM-DD in the player's local calendar. */
  date: string;
  /**
   * `gameOver` when the final card was played but the app closed before its animation ended.
   * Resuming then lands on the finished game, and the normal game-over writes run.
   */
  phase: 'playing' | 'gameOver';
  seedEventName: string;
  /** The board in year order, seed card included. */
  timeline: string[];
  /** The hand in order, so a cycled hand comes back the way it was left. */
  hand: string[];
  failed: StoredFailure[];
  placementHistory: boolean[];
  currentStreak: number;
  bestStreak: number;
  turnNumber: number;
  roundNumber: number;
}

/** The snapshot for a single-player daily in play, or null for anything else. */
export function buildDailyProgressSnapshot(state: WhenGameState): DailyProgressSnapshot | null {
  const { gameMode, lastConfig, phase, seedEventName, players } = state;
  if (gameMode !== 'daily' || !lastConfig?.dailySeed || state.isReview) return null;
  if (phase !== 'playing' && phase !== 'gameOver') return null;
  if (!seedEventName || players.length !== 1) return null;

  return {
    date: lastConfig.dailySeed,
    phase,
    seedEventName,
    timeline: state.timeline.map((event) => event.name),
    hand: players[0].hand.map((event) => event.name),
    failed: state.failedPlacements.map((failure) => ({
      name: failure.event.name,
      attemptedPosition: failure.attemptedPosition,
      correctPosition: failure.correctPosition,
      timelineLength: failure.timelineLength,
      seq: failure.seq,
    })),
    placementHistory: [...state.placementHistory],
    currentStreak: state.currentStreak,
    bestStreak: state.bestStreak,
    turnNumber: state.turnNumber,
    roundNumber: state.roundNumber,
  };
}

export function saveDailyProgress(snapshot: DailyProgressSnapshot | null): void {
  if (!snapshot) return;
  try {
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage may be disabled or full - fail silently
    console.warn('Failed to save daily progress to localStorage');
  }
}

export function clearDailyProgress(): void {
  try {
    localStorage.removeItem(DAILY_PROGRESS_KEY);
  } catch {
    // localStorage may be disabled - nothing to clear
  }
}

/** Today's saved game, or null if there is none or it is from another day. */
export function getTodayDailyProgress(
  dateString: string = getLocalDateString()
): DailyProgressSnapshot | null {
  try {
    const stored = localStorage.getItem(DAILY_PROGRESS_KEY);
    if (!stored) return null;

    const snapshot: DailyProgressSnapshot = JSON.parse(stored);
    if (snapshot?.date !== dateString) return null;
    const arrays = [snapshot.timeline, snapshot.hand, snapshot.failed, snapshot.placementHistory];
    if (!arrays.every(Array.isArray) || typeof snapshot.seedEventName !== 'string') return null;
    return snapshot;
  } catch {
    // localStorage may be disabled or data corrupted - fail silently
    return null;
  }
}

/**
 * The cards the saved game has already dealt, keyed by slug, or null when `composedDeck` has
 * changed under them and the daily should be dealt fresh.
 *
 * Two things hold for any honest save. The opening deal comes straight off the front: the seed
 * card and the first hand are the first 1 + H cards, where H, the hand size, is the hand plus the
 * misses (a hit draws a replacement, a miss does not). And every later draw is either the top
 * card or a catch-up draw (`catchUp.ts`) at most CATCH_UP_REACH cards further, which takes one
 * card and leaves the rest in order. So every card a player has seen (the board, the hand and
 * the misses) lies within the first N + CATCH_UP_REACH - 1 of the composed deck, and the rest
 * of the deck is the composed deck minus those N in order, which is why it never needs storing.
 *
 * A deploy that changed the catalogue, the difficulty index or today's theme almost always
 * reshuffles the opening or moves a seen card out of reach, and fails the check. A change that
 * only touches cards not yet drawn passes, which is safe because nothing about those cards has
 * been revealed; so does one that only swaps drawn cards within reach, which still resumes a
 * board made of today's cards.
 */
function matchDealtCards(
  snapshot: DailyProgressSnapshot,
  composedDeck: HistoricalEvent[]
): Map<string, HistoricalEvent> | null {
  const seen = [...snapshot.timeline, ...snapshot.hand, ...snapshot.failed.map((f) => f.name)];
  if (composedDeck.length < seen.length || composedDeck[0]?.name !== snapshot.seedEventName) {
    return null;
  }

  const reachable = composedDeck.slice(0, seen.length + CATCH_UP_REACH - 1);
  const byName = new Map(reachable.map((event) => [event.name, event]));
  const dealt = new Map<string, HistoricalEvent>();
  for (const name of seen) {
    const event = byName.get(name);
    if (!event || dealt.has(name)) return null;
    dealt.set(name, event);
  }

  // Once the deck runs dry a hit stops replacing, so H here can undercount; a shorter opening
  // is still a sound check.
  const opening = composedDeck.slice(0, 1 + snapshot.hand.length + snapshot.failed.length);
  if (!opening.every((event) => dealt.has(event.name))) return null;
  return dealt;
}

/**
 * Whether today's save would resume on `dailyDeck` (today's `buildDailyDeck`). The Daily card
 * asks this so it offers Resume only when a tap will actually resume: a save an update has
 * invalidated still exists until `startGame` drops it, and would otherwise label a fresh deal.
 */
export function canResumeDailyProgress(
  snapshot: DailyProgressSnapshot | null,
  dailyDeck: HistoricalEvent[]
): boolean {
  return snapshot !== null && matchDealtCards(snapshot, dailyDeck) !== null;
}

/**
 * Rebuild the saved game on top of the deck `startGame` just composed for the same date, or
 * return null when the deck has changed under it (see `matchDealtCards`).
 */
export function restoreDailyProgress(
  snapshot: DailyProgressSnapshot | null,
  composedDeck: HistoricalEvent[],
  config: GameConfig
): WhenGameState | null {
  if (!snapshot || snapshot.date !== config.dailySeed) return null;

  const byName = matchDealtCards(snapshot, composedDeck);
  if (!byName) return null;
  const resolve = (name: string) => byName.get(name) as HistoricalEvent;

  const isGameOver = snapshot.phase === 'gameOver';
  return {
    phase: snapshot.phase,
    gameMode: 'daily',
    timeline: snapshot.timeline.map(resolve),
    seedEventName: snapshot.seedEventName,
    deck: composedDeck.filter((event) => !byName.has(event.name)),
    placementHistory: [...snapshot.placementHistory],
    failedPlacements: snapshot.failed.map((failure) => ({
      event: resolve(failure.name),
      attemptedPosition: failure.attemptedPosition,
      correctPosition: failure.correctPosition,
      timelineLength: failure.timelineLength,
      seq: failure.seq,
    })),
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: config,
    players: [
      {
        id: 0,
        name: config.playerNames?.[0] || 'Player 1',
        hand: snapshot.hand.map(resolve),
        hasWon: false,
        isEliminated: isGameOver,
        placementHistory: [...snapshot.placementHistory],
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: snapshot.turnNumber,
    roundNumber: snapshot.roundNumber,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: snapshot.currentStreak,
    bestStreak: snapshot.bestStreak,
  };
}

/**
 * `startGame`'s entry point: today's saved daily rebuilt on the freshly composed deck, or null
 * to deal as normal. A save that no longer matches the deck is dropped so it is not retried.
 */
export function resumeDailyProgress(
  composedDeck: HistoricalEvent[],
  config: GameConfig
): WhenGameState | null {
  const resumed = restoreDailyProgress(
    getTodayDailyProgress(config.dailySeed),
    composedDeck,
    config
  );
  if (!resumed) clearDailyProgress();
  return resumed;
}

/**
 * `placeCard`'s entry point: save where a daily placement will settle, at the moment the card
 * is dropped. A no-op for any other game.
 */
export function saveDailyPlacement(
  state: WhenGameState,
  activeCard: HistoricalEvent,
  insertionIndex: number,
  result: PlacementResult,
  index: DifficultyIndex
): void {
  if (state.gameMode !== 'daily' || state.players.length !== 1) return;
  const settled = settleDailyPlacement(state, activeCard, insertionIndex, result, index);
  saveDailyProgress(buildDailyProgressSnapshot(settled));
}

/**
 * The state a single-player placement's animation will settle into, worked out up front.
 *
 * `placeCard` reaches the same state through timers, but a miss shows the card's true position
 * about a second before it settles. Saving only the settled state would let a player who sees
 * that and closes the app take the move back, so `placeCard` saves this the moment the card is
 * dropped. Mirrors the single-player steps of both timer paths in `useWhenGame.placeCard`; a
 * change to either belongs in both.
 */
export function settleDailyPlacement(
  state: WhenGameState,
  activeCard: HistoricalEvent,
  insertionIndex: number,
  result: PlacementResult,
  index: DifficultyIndex
): WhenGameState {
  const placed: WhenGameState = result.success
    ? {
        ...state,
        timeline: insertIntoTimeline(
          state.timeline,
          activeCard,
          settledPosition(state.timeline, activeCard, insertionIndex)
        ),
        placementHistory: [...state.placementHistory, true],
        currentStreak: state.currentStreak + 1,
        bestStreak: Math.max(state.bestStreak, state.currentStreak + 1),
      }
    : {
        ...state,
        failedPlacements: [
          ...state.failedPlacements,
          {
            event: activeCard,
            attemptedPosition: insertionIndex,
            correctPosition: result.correctPosition,
            timelineLength: state.timeline.length,
            seq: state.turnNumber,
          },
        ],
        placementHistory: [...state.placementHistory, false],
        currentStreak: 0,
      };

  const update = result.success
    ? processCorrectPlacement(placed, activeCard, index)
    : processIncorrectPlacement(placed, activeCard);

  return {
    ...placed,
    players: update.players,
    deck: update.deck,
    currentPlayerIndex: update.currentPlayerIndex,
    turnNumber: update.turnNumber,
    roundNumber: update.roundNumber,
    winners: update.winners,
    activePlayersAtRoundStart: update.activePlayersAtRoundStart,
    phase: update.isGameOver ? 'gameOver' : 'playing',
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
  };
}
