import { useCallback, useEffect, useRef, useState } from 'react';
import { GamePhase, PlacementResult } from '../types';
import { GameHintKey, hasSeenHint, markHintSeen } from '../utils/playerStorage';

/** Idle time on the first game before the drag nudge appears. */
export const DRAG_NUDGE_MS = 4000;
/** How long the first-wrong and first-correct strips stay up. */
export const OUTCOME_HINT_MS = 4000;
/** How long the swap-button strip stays up. */
export const SWAP_HINT_MS = 6000;
/** Quiet gap after the previous strip before the swap hint may appear. */
export const SWAP_COOLDOWN_MS = 1500;

/** When several hints are eligible at once, this is the order that wins. */
export const HINT_PRIORITY: GameHintKey[] = ['drag', 'wrong', 'correct', 'swap'];

export function pickHint(candidates: GameHintKey[]): GameHintKey | null {
  return HINT_PRIORITY.find((key) => candidates.includes(key)) ?? null;
}

interface SeenState {
  drag: boolean;
  wrong: boolean;
  correct: boolean;
  swap: boolean;
}

interface PendingOutcome {
  success: boolean;
  /** Whether a replacement will be drawn: read before the draw, so "deck not empty". */
  drewCard: boolean;
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
}

export interface OnboardingHints {
  /** The How-to-Play modal, opened on a player's first game. */
  rulesOpen: boolean;
  dismissRules: () => void;
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
    case 'swap':
      return { ...prev, swap: true };
  }
}

function pickOutcomeHint(pending: PendingOutcome, seen: SeenState): GameHintKey | null {
  const candidates: GameHintKey[] = [];
  if (!pending.success && !seen.wrong) candidates.push('wrong');
  if (pending.success && pending.drewCard && !seen.correct) candidates.push('correct');
  return pickHint(candidates);
}

/**
 * The in-game one-shot hints, as a small state machine: at most one strip on screen, each
 * shown once per install, each tied to the moment it is about to matter.
 *
 * Order: the How-to-Play modal (first game ever) → the idle drag nudge (no drag within
 * `DRAG_NUDGE_MS`, and never while the modal is open) → the first-wrong / first-correct
 * strips, once the placement animation has settled → the swap-button hint, which is the
 * advanced one and waits until the others have had their turn (drag and correct seen, and
 * either wrong seen or four cards placed, so a perfect run still gets it).
 *
 * `drag` is marked seen on the first drag whether or not the strip was ever shown, so a
 * player who never idles skips it entirely and the swap gate still opens. The outcome and
 * swap hints are marked when shown. An outcome that lands on the game-ending placement is
 * discarded unmarked, so it returns next game.
 *
 * Lives here rather than in Game.tsx because Game sits on ESLint's complexity ceiling.
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
  } = args;
  const playing = phase === 'playing';

  // Read once per mount: Game remounts for every new game.
  const [seen, setSeen] = useState<SeenState>(readSeen);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [active, setActive] = useState<GameHintKey | null>(null);

  const activeRef = useRef(active);
  activeRef.current = active;
  const pendingRef = useRef<PendingOutcome | null>(null);
  const lastResultRef = useRef(lastPlacementResult);
  const activeCardRef = useRef(activeCardName);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const markSeen = useCallback((key: GameHintKey) => {
    markHintSeen(key);
    setSeen((prev) => withSeen(prev, key));
  }, []);

  const show = useCallback(
    (key: GameHintKey, durationMs: number) => {
      clearHideTimer();
      setActive(key);
      markSeen(key);
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        setActive(null);
      }, durationMs);
    },
    [clearHideTimer, markSeen]
  );

  // 1. The rules, on the first game ever.
  useEffect(() => {
    if (playing && !hasSeenHint('rules')) setRulesOpen(true);
  }, [playing]);

  const dismissRules = useCallback(() => {
    markHintSeen('rules');
    setRulesOpen(false);
  }, []);

  // 2. The idle drag nudge. `rulesOpen` is a dependency on purpose: the timer cannot start
  //    while the modal is up, and starts from zero when it closes.
  useEffect(() => {
    if (!playing || rulesOpen || isMultiplayer || seen.drag || active !== null) return;
    const timer = window.setTimeout(() => setActive('drag'), DRAG_NUDGE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, rulesOpen, isMultiplayer, seen.drag, active]);

  // 3. A drag clears whatever is showing and settles `drag` for good.
  useEffect(() => {
    if (!isDragging) return;
    clearHideTimer();
    setActive(null);
    if (!seen.drag) markSeen('drag');
  }, [isDragging, seen.drag, clearHideTimer, markSeen]);

  // 4. A placement lands (with the animation starting): remember its outcome. The deck is
  //    read now, before a correct placement draws from it.
  useEffect(() => {
    if (lastPlacementResult && lastPlacementResult !== lastResultRef.current) {
      pendingRef.current = { success: lastPlacementResult.success, drewCard: deckLength > 0 };
    }
    lastResultRef.current = lastPlacementResult;
  }, [lastPlacementResult, deckLength]);

  // 5. The animation settles: show the outcome's hint, unless the game just ended (then it
  //    comes back next game) or something else is on screen.
  useEffect(() => {
    if (isAnimating || !pendingRef.current) return;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!playing || isMultiplayer || activeRef.current !== null) return;
    const key = pickOutcomeHint(pending, seen);
    if (key) show(key, OUTCOME_HINT_MS);
  }, [isAnimating, playing, isMultiplayer, seen, show]);

  // 6. The swap hint, after the others, with a quiet gap first.
  const swapEligible =
    playing &&
    !rulesOpen &&
    !isMultiplayer &&
    !isAnimating &&
    !isDragging &&
    active === null &&
    seen.drag &&
    seen.correct &&
    (seen.wrong || timelineLength >= 4) &&
    !seen.swap &&
    handLength >= 2;
  useEffect(() => {
    if (!swapEligible) return;
    const timer = window.setTimeout(() => show('swap', SWAP_HINT_MS), SWAP_COOLDOWN_MS);
    return () => window.clearTimeout(timer);
  }, [swapEligible, show]);

  // Using the swap button (the top card changes) is the dismissal it was asking for.
  useEffect(() => {
    if (activeCardName !== activeCardRef.current && active === 'swap') {
      clearHideTimer();
      setActive(null);
    }
    activeCardRef.current = activeCardName;
  }, [activeCardName, active, clearHideTimer]);

  // 7. Leaving play (game over, or the screen unmounting) clears everything.
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

  return { rulesOpen, dismissRules, active, dismiss };
}
