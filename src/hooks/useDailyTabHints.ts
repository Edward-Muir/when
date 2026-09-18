import { useCallback, useEffect, useState } from 'react';
import { WhenGameState } from '../types';
import { DailyResult, TabHintKey, markHintSeen, subscribeHintsReset } from '../utils/playerStorage';
import { getLifetimeStats } from '../utils/statsStorage';
import { useTabHint } from './useTabHint';
import { DRAG_NUDGE_MS } from './useOnboardingHints';

export interface DailyTabHints {
  /** The one strip the Daily tab's slot carries, and the copy key it should render. */
  strip: { key: TabHintKey; show: boolean; dismiss: () => void };
  /** Glow the Play button: the first-play nudge is up. */
  playNudge: boolean;
  /** Glow the eye: the strip naming it is up. */
  reviewNudge: boolean;
  /** The eye's handler. Wraps the caller's so marking the hint seen cannot be forgotten. */
  openReview: () => void;
}

/**
 * Whether the Daily tab's "play your first daily game" strip applies: on the Daily tab, with
 * the Play button actually there to point at, and no daily behind the player.
 *
 * `hintsReset` waives the lifetime check. That check exists so an upgrade does not tell a
 * regular "your first", which is not what an explicit "Reset Hints" is — the player has just
 * asked to be shown the explanations again, and this is the only hint that would have sat the
 * request out. `todayResult` still gates it either way: with today's game done the hero card
 * carries Share and the eye, so the strip would be pointing at a button that is not there.
 */
function wantsFirstDailyNudge(
  onDailyTab: boolean,
  todayResult: DailyResult | null,
  hintsReset: boolean
): boolean {
  if (!onDailyTab || todayResult) return false;
  return hintsReset || getLifetimeStats().gamesPlayed.daily === 0;
}

/**
 * The Daily tab's two one-shot strips, and which of them has the slot.
 *
 * They live here rather than in `ModeSelect`, which sits on ESLint's `complexity` ceiling (an
 * error rule) — the same reason the in-game ladder is a hook rather than part of `Game`.
 *
 * The two cannot both apply: the first-play nudge wants today's game unplayed, and the review
 * hint wants today's finished board. The slot still takes one, so this chooses rather than
 * relying on that staying true.
 *
 * Their timing differs on purpose. The first-play nudge waits an idle `DRAG_NUDGE_MS`, so a
 * player who taps Play straight away never sees it. The review hint takes the default
 * scroll-settle delay: the player has just walked back from their game, and the board is what
 * they came back to.
 */
export function useDailyTabHints(args: {
  onDailyTab: boolean;
  todayResult: DailyResult | null;
  /** Today's restored board, or null when there is none: also what the eye is gated on. */
  board: WhenGameState | null;
  onReview: (restored: WhenGameState) => void;
}): DailyTabHints {
  const { onDailyTab, todayResult, board, onReview } = args;

  // An explicit reset puts every hint back on the table, this one included. Latched for the
  // session rather than read from storage, because the lifetime counter it waives is not
  // something `resetHintsSeen` clears.
  const [hintsReset, setHintsReset] = useState(false);
  useEffect(() => subscribeHintsReset(() => setHintsReset(true)), []);

  const dailyHint = useTabHint(
    'dailyTab',
    wantsFirstDailyNudge(onDailyTab, todayResult, hintsReset),
    DRAG_NUDGE_MS
  );
  const reviewHint = useTabHint('reviewEye', onDailyTab && !!board);

  // Using the eye counts as having met it, so a player who taps before the strip appears is
  // not told about it afterwards. Same rule as the in-game `drag` hint, which is marked on the
  // first drag whether or not its strip ever showed. It is wrapped here rather than left to
  // the call site so the two cannot drift apart.
  const openReview = useCallback(() => {
    if (!board) return;
    markHintSeen('reviewEye');
    onReview(board);
  }, [board, onReview]);

  return {
    strip: reviewHint.show
      ? { ...reviewHint, key: 'reviewEye' }
      : { ...dailyHint, key: 'dailyTab' },
    playNudge: dailyHint.show,
    reviewNudge: reviewHint.show,
    openReview,
  };
}
