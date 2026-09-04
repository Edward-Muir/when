import { useCallback, useEffect, useRef, useState } from 'react';
import { GamePhase, PlacementResult } from '../types';
import {
  GameHintKey,
  hasSeenHint,
  markHintSeen,
  subscribeHintsReset,
} from '../utils/playerStorage';

/** Idle time on the first game before the drag nudge appears. */
export const DRAG_NUDGE_MS = 4000;
/** How long the wrong/correct strips stay up: a statement about what just happened. */
export const OUTCOME_HINT_MS = 4000;
/** How long the tap-a-card, stats and swap strips stay up: each asks for a tap. */
export const ACTION_HINT_MS = 6000;

/** Every hint except the idle drag nudge. These are chosen at a placement's settle. */
export type SettleHintKey = Exclude<GameHintKey, 'drag'>;

/**
 * The ladder, in the order it is walked. One rung per placement: the outcome of what they
 * just did, then the three things nothing else in the UI explains.
 */
export const SETTLE_PRIORITY: SettleHintKey[] = ['wrong', 'correct', 'tapCard', 'stats', 'swap'];

/** When several hints are eligible at once, this is the order that wins. */
export const HINT_PRIORITY: GameHintKey[] = ['drag', ...SETTLE_PRIORITY];

export function pickHint(candidates: GameHintKey[]): GameHintKey | null {
  return HINT_PRIORITY.find((key) => candidates.includes(key)) ?? null;
}

interface SeenState {
  drag: boolean;
  wrong: boolean;
  correct: boolean;
  tapCard: boolean;
  stats: boolean;
  swap: boolean;
}

interface PendingOutcome {
  success: boolean;
  /** Whether a replacement will be drawn: read before the draw, so "deck not empty". */
  drewCard: boolean;
}

/** Everything a settle decision needs beyond the outcome and what has been seen. */
interface SettleContext {
  handLength: number;
  timelineLength: number;
  statsOpen: boolean;
  cardOpen: boolean;
}

export interface UseOnboardingHintsArgs {
  phase: GamePhase;
  isAnimating: boolean;
  /** `dragState.isDragging` from `useDragAndDrop`. */
  isDragging: boolean;
  lastPlacementResult: PlacementResult | null;
  handLength: number;
  deckLength: number;
  timelineLength: number;
  /** The top hand card's name; a change while the swap hint shows means they used it. */
  activeCardName: string | undefined;
  /** Multiplayer keeps its popup flow; the strips stay off. */
  isMultiplayer: boolean;
  /** The in-game stats popup is open, so the counter hint has nothing left to ask for. */
  statsOpen: boolean;
  /** A card-description popup is open, so the tap-a-card hint has been answered. */
  cardOpen: boolean;
}

export interface OnboardingHints {
  /** The one strip on screen, if any. */
  active: GameHintKey | null;
  /** The strip was tapped. */
  dismiss: () => void;
}

function readSeen(): SeenState {
  return {
    drag: hasSeenHint('drag'),
    wrong: hasSeenHint('wrong'),
    correct: hasSeenHint('correct'),
    tapCard: hasSeenHint('tapCard'),
    stats: hasSeenHint('stats'),
    swap: hasSeenHint('swap'),
  };
}

// Switch-based update to avoid dynamic key indexing (security/detect-object-injection).
function withSeen(prev: SeenState, key: GameHintKey): SeenState {
  switch (key) {
    case 'drag':
      return { ...prev, drag: true };
    case 'wrong':
      return { ...prev, wrong: true };
    case 'correct':
      return { ...prev, correct: true };
    case 'tapCard':
      return { ...prev, tapCard: true };
    case 'stats':
      return { ...prev, stats: true };
    case 'swap':
      return { ...prev, swap: true };
  }
}

// One predicate per rung rather than one function with a branch per rung: the combined
// version measures 16 against ESLint's `complexity` ceiling of 15, which is an error rule.
// The `!cardOpen` / `!statsOpen` terms stop a hint being *spent* (it is marked on show) on a
// settle where the thing it points at is already open; the effects below handle a popup that
// opens after the strip is already up.

function isWrongEligible(pending: PendingOutcome, seen: SeenState): boolean {
  return !pending.success && !seen.wrong;
}

function isCorrectEligible(pending: PendingOutcome, seen: SeenState): boolean {
  return pending.success && pending.drewCard && !seen.correct;
}

function isTapCardEligible(seen: SeenState, ctx: SettleContext): boolean {
  return !seen.tapCard && !ctx.cardOpen && (seen.wrong || seen.correct);
}

function isStatsEligible(seen: SeenState, ctx: SettleContext): boolean {
  return !seen.stats && !ctx.statsOpen && seen.tapCard;
}

// Last, and the only rung with a gate beyond the previous one: it needs a hand worth cycling,
// and it waits for a miss or four placements so a perfect run still reaches it.
function isSwapEligible(seen: SeenState, ctx: SettleContext): boolean {
  return !seen.swap && seen.stats && ctx.handLength >= 2 && (seen.wrong || ctx.timelineLength >= 4);
}

function isSettleEligible(
  key: SettleHintKey,
  pending: PendingOutcome,
  seen: SeenState,
  ctx: SettleContext
): boolean {
  switch (key) {
    case 'wrong':
      return isWrongEligible(pending, seen);
    case 'correct':
      return isCorrectEligible(pending, seen);
    case 'tapCard':
      return isTapCardEligible(seen, ctx);
    case 'stats':
      return isStatsEligible(seen, ctx);
    case 'swap':
      return isSwapEligible(seen, ctx);
  }
}

function pickSettleHint(
  pending: PendingOutcome,
  seen: SeenState,
  ctx: SettleContext
): SettleHintKey | null {
  return SETTLE_PRIORITY.find((key) => isSettleEligible(key, pending, seen, ctx)) ?? null;
}

// Takes `SettleHintKey`, not `GameHintKey`, on purpose: that is what structurally keeps the
// idle drag nudge out of `show()`. It has no auto-hide — it stays up until a drag or a tap.
function hintDurationMs(key: SettleHintKey): number {
  switch (key) {
    case 'wrong':
    case 'correct':
      return OUTCOME_HINT_MS;
    case 'tapCard':
    case 'stats':
    case 'swap':
      return ACTION_HINT_MS;
  }
}

/**
 * The in-game one-shot hints, as a small state machine: at most one strip on screen, each
 * shown once per install, each tied to the moment it is about to matter.
 *
 * **Settle-driven, one hint per placement.** Every time a placement settles (`isAnimating`
 * goes false with an outcome pending) the highest-priority unseen, eligible rung of
 * `SETTLE_PRIORITY` is shown, replacing whatever is up. So each hint gets a player action of
 * its own and nothing stacks: a miss teaches `wrong`, the next hit `correct`, then `tapCard`,
 * then `stats`, then `swap`. The idle drag nudge is the only timer-driven hint left. There is
 * deliberately no rules modal first: it was an essay nobody read, and the strips teach the
 * same loop at the moment each part matters.
 *
 * `drag` is marked seen on the first drag whether or not the strip was ever shown, so a
 * player who never idles skips it entirely. The settle hints are marked when shown. An
 * outcome that lands on the game-ending placement is discarded unmarked, so it returns next
 * game.
 *
 * Lives here rather than in Game.tsx because Game sits on ESLint's complexity ceiling.
 *
 * Four hazards, all load-bearing:
 *
 * 1. **Re-entrancy through `setSeen`.** `show()` marks the key, which re-renders. Because
 *    each rung's gate is the previous rung being seen, a version that consumed the pending
 *    outcome *after* showing would walk the whole ladder in one render pass and mark every
 *    key seen on a single placement. Two independent defences, keep both: consume
 *    `pendingRef` before any state write, and read `seenRef.current` rather than putting
 *    `seen` in the settle effect's deps.
 * 2. **Stale `seen` inside a commit.** The drag effect can mark `drag` in the same commit the
 *    settle effect runs; render-scope `seen` would be stale there. `seenRef`, written
 *    synchronously by `markSeen`, is not.
 * 3. **The top card changes in the settle commit.** `useWhenGame` flips `isAnimating` to
 *    false and swaps in the newly drawn card in one `setState`, so `activeCardName` has
 *    already changed by the time `swap` is shown. The "they swapped, hide it" effect
 *    therefore compares against `swapCardRef`, baselined at the instant `swap` is shown — not
 *    against last render's value, which would kill the hint the moment it appeared.
 * 4. **The bug this replaces.** `swap` used to hang off a `swapEligible` boolean feeding a
 *    1.5 s cooldown timer, whose effect cleanup cancelled and restarted the timer every time
 *    that boolean flipped — which it did on every drag frame and animation transition, so the
 *    quiet gap essentially never arrived and the hint never fired in real play. Only two
 *    `setTimeout`s remain: the idle nudge's (its gate flips at most once per install) and the
 *    hide timer inside `show()`. Don't reintroduce a timer gated on a churning boolean.
 */
export function useOnboardingHints(args: UseOnboardingHintsArgs): OnboardingHints {
  const {
    phase,
    isAnimating,
    isDragging,
    lastPlacementResult,
    handLength,
    deckLength,
    timelineLength,
    activeCardName,
    isMultiplayer,
    statsOpen,
    cardOpen,
  } = args;
  const playing = phase === 'playing';

  // Read once per mount (Game remounts for every new game), plus on an explicit reset.
  const [seen, setSeen] = useState<SeenState>(readSeen);
  const [active, setActive] = useState<GameHintKey | null>(null);

  const activeRef = useRef(active);
  activeRef.current = active;
  // The value every *decision* reads. `markSeen` is its only writer, so it cannot drift from
  // `seen`: the ref is written first and the state converges on the same object next commit.
  const seenRef = useRef(seen);
  const pendingRef = useRef<PendingOutcome | null>(null);
  const lastResultRef = useRef(lastPlacementResult);
  /** The top card at the instant `swap` was shown. See hazard 3. */
  const swapCardRef = useRef<string | undefined>(undefined);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearHideTimer();
    setActive(null);
  }, [clearHideTimer]);

  const markSeen = useCallback((key: GameHintKey) => {
    markHintSeen(key);
    const next = withSeen(seenRef.current, key);
    seenRef.current = next; // synchronous: the next decision this commit sees it
    setSeen(next); // re-render only
  }, []);

  const show = useCallback(
    (key: SettleHintKey) => {
      clearHideTimer();
      setActive(key);
      markSeen(key);
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        setActive(null);
      }, hintDurationMs(key));
    },
    [clearHideTimer, markSeen]
  );

  // 1. The idle drag nudge, `DRAG_NUDGE_MS` after play starts with no drag. Reads `seen.drag`
  //    (state, not ref) because it must re-run when drag is marked — the only reason `seen` is
  //    state at all. `active` churns more now that every placement shows something, but every
  //    placement needs a drag and the first drag marks `drag`, so this effect is already dead
  //    by the time any settle can restart its timer.
  useEffect(() => {
    if (!playing || isMultiplayer || seen.drag || active !== null) return;
    const timer = window.setTimeout(() => setActive('drag'), DRAG_NUDGE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, isMultiplayer, seen.drag, active]);

  // 2. A drag clears whatever is showing and settles `drag` for good.
  useEffect(() => {
    if (!isDragging) return;
    clearHideTimer();
    setActive(null);
    if (!seen.drag) markSeen('drag');
  }, [isDragging, seen.drag, clearHideTimer, markSeen]);

  // 3. A placement lands (with the animation starting): remember its outcome. The deck is
  //    read now, before a correct placement draws from it. Must stay declared before the
  //    settle effect so a result and a settle arriving in one commit are ordered correctly.
  useEffect(() => {
    if (lastPlacementResult && lastPlacementResult !== lastResultRef.current) {
      pendingRef.current = { success: lastPlacementResult.success, drewCard: deckLength > 0 };
    }
    lastResultRef.current = lastPlacementResult;
  }, [lastPlacementResult, deckLength]);

  // 4. The animation settles: show this placement's rung of the ladder, replacing whatever is
  //    up. Nothing here is suppressed by an existing strip — that guard was half the bug.
  //    The extra deps are inert: a re-run with nothing pending returns on the first line, and
  //    this effect has no cleanup and starts no timer of its own.
  useEffect(() => {
    if (isAnimating || !pendingRef.current) return;
    const pending = pendingRef.current;
    pendingRef.current = null; // consume first — hazard 1
    // The game just ended: discard it unmarked so it returns next game.
    if (!playing || isMultiplayer) return;
    const key = pickSettleHint(pending, seenRef.current, {
      handLength,
      timelineLength,
      statsOpen,
      cardOpen,
    });
    if (!key) return;
    swapCardRef.current = activeCardName; // baseline for effect 6 — hazard 3
    show(key);
  }, [
    isAnimating,
    playing,
    isMultiplayer,
    handLength,
    timelineLength,
    statsOpen,
    cardOpen,
    activeCardName,
    show,
  ]);

  // 5. Opening the thing a hint points at answers it. These only ever clear, never schedule,
  //    so no cleanup-and-rerun cycle has a timer to restart.
  useEffect(() => {
    if (active === 'tapCard' && cardOpen) hide();
  }, [active, cardOpen, hide]);
  useEffect(() => {
    if (active === 'stats' && statsOpen) hide();
  }, [active, statsOpen, hide]);

  // 6. Using the swap button (the top card changes) is the dismissal it was asking for.
  //    Compared against the baseline written when the hint was shown, never against last
  //    render — see hazard 3.
  useEffect(() => {
    if (active === 'swap' && activeCardName !== swapCardRef.current) hide();
  }, [active, activeCardName, hide]);

  // 7. An explicit reset (the menu's "Reset Hints") re-arms the ladder without a remount.
  useEffect(
    () =>
      subscribeHintsReset(() => {
        clearHideTimer();
        setActive(null);
        const next = readSeen();
        seenRef.current = next;
        setSeen(next);
      }),
    [clearHideTimer]
  );

  // 8. Leaving play (game over, or the screen unmounting) clears everything.
  useEffect(() => {
    if (playing) return;
    clearHideTimer();
    setActive(null);
  }, [playing, clearHideTimer]);
  useEffect(() => clearHideTimer, [clearHideTimer]);

  const dismiss = useCallback(() => {
    clearHideTimer();
    // The drag nudge is the one hint marked on dismissal rather than on show, so a tap on
    // it does not let the timer bring it straight back.
    if (activeRef.current === 'drag') markSeen('drag');
    setActive(null);
  }, [clearHideTimer, markSeen]);

  return { active, dismiss };
}
