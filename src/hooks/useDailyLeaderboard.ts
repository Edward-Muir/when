import { useCallback, useEffect, useState } from 'react';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { useLeaderboard, LeaderboardEntry } from './useLeaderboard';
import {
  DailyResult,
  getDisplayName,
  saveDisplayName,
  hasSubmittedToLeaderboard,
  markLeaderboardSubmitted,
  updateDailyResultWithLeaderboard,
} from '../utils/playerStorage';
import { patchDailyRank } from '../utils/gameHistory';

export interface DailyLeaderboard {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  rank: number | null;
  totalPlayers: number | null;
  playerEntry: LeaderboardEntry | null;
  /** True when `entries` is a capped slice of `totalPlayers` rather than the whole board. */
  truncated: boolean;
  /** This player's score is on the board — from any source. See the note below. */
  submitted: boolean;
  /**
   * The board itself could not be read. Distinct from `unavailable`, and the one to gate a
   * "submit your score" affordance on: a null `rank` means "not on the board" only if the board
   * was actually read, and `unavailable` also folds in `submitError`, so gating on that would
   * retract the affordance the instant a submission failed — exactly when it is needed.
   */
  loadError: string | null;
  /** The board could not be read or written, so submitting is not currently possible. */
  unavailable: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  /** The name to prefill the submit form with. */
  suggestedName: string;
  submit: (displayName: string) => Promise<void>;
  /** Refetch the board. Defaults to the date being tracked; pass one to follow a day rollover. */
  refresh: (date?: string) => void;
}

export interface DailyLeaderboardOptions {
  /**
   * Which date's board to read, when that is not the date of the result being submitted.
   *
   * The home screen needs this: it shows the board to everyone, including players who have not
   * played today and so have no `DailyResult` at all. Without it the hook's effects early-return
   * on a null date and the board silently never loads.
   */
  boardDate?: string;
  /**
   * Poll the board every 15s while the tab is visible. Defaults to true, which suits a screen
   * the player is watching for their placing. The home screen passes false — it already
   * refetches on mount and on every `useToday` tick, and the board modal does its own polling
   * while open, so polling here would add a permanent background request per idle user.
   */
  poll?: boolean;
}

/**
 * The daily leaderboard, owned in one place.
 *
 * This exists because "has the player submitted today?" used to be tracked four separate ways —
 * a flag in `GamePopup`, a flag in `LeaderboardSubmit`, `useLeaderboard.hasSubmitted`, and
 * localStorage — kept in sync by callbacks. They could disagree, and when they did the
 * game-over popup's submit gate never opened and the popup became impossible to dismiss.
 *
 * The fix is not more syncing: `submitted` below is a single OR of every signal, so any one of
 * them saying yes is enough. Divergence can no longer strand anyone, and the localStorage copy
 * is *healed* from the server's answer rather than trusted as the truth.
 *
 * Pass `null` for a game with no leaderboard (anything that is not a completed daily) and the
 * hook stays inert — no fetch, no polling — unless `boardDate` gives it a board to read anyway.
 *
 * Two callers, and they want different things. `Game` passes the finished daily and lets the
 * defaults stand. `ModeSelect` passes today's *stored* result — which is how a score that failed
 * to submit at game over can still be submitted later the same day — plus `boardDate` so the
 * board renders for players who have not played, and `poll: false` so an idle home screen does
 * not sit there polling.
 */
export function useDailyLeaderboard(
  dailyResult: DailyResult | null,
  { boardDate, poll = true }: DailyLeaderboardOptions = {}
): DailyLeaderboard {
  const {
    isSubmitting,
    hasSubmitted,
    submitError,
    rank,
    totalPlayers,
    isLoading,
    loadError,
    leaderboard,
    playerEntry,
    truncated,
    submitResult,
    fetchLeaderboard,
  } = useLeaderboard();

  const [suggestedName] = useState(() => getDisplayName() || generateRandomName());

  // Seeded from localStorage so a returning player never sees the submit form flash before the
  // server confirms what we already know.
  const [submittedLocally, setSubmittedLocally] = useState(hasSubmittedToLeaderboard);

  // The server identifies the player by device fingerprint, so a non-null rank means this
  // device is on the board even when localStorage has been cleared or never written.
  const submitted = submittedLocally || hasSubmitted || rank !== null;

  // The board's date, which is not always the result's: the home screen shows today's board to
  // players who have not played it and therefore have no result to submit.
  const date = boardDate ?? dailyResult?.date;

  useEffect(() => {
    if (submitted && !submittedLocally) {
      markLeaderboardSubmitted();
      setSubmittedLocally(true);
    }
  }, [submitted, submittedLocally]);

  useEffect(() => {
    if (!date) return;
    void fetchLeaderboard(date);
  }, [date, fetchLeaderboard]);

  // Keep the board live: refetch on app resume / tab refocus, and poll every 15s while visible.
  // Polling pauses when the tab is hidden.
  useEffect(() => {
    if (!date || !poll) return;
    const refresh = () => {
      void fetchLeaderboard(date);
    };
    let intervalId: number | null = null;
    const start = () => {
      if (intervalId !== null) return;
      intervalId = window.setInterval(refresh, 15_000);
    };
    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        refresh();
        start();
      }
    };
    window.addEventListener('appResume', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    if (!document.hidden) start();
    return () => {
      window.removeEventListener('appResume', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [date, poll, fetchLeaderboard]);

  // Persist the placing onto today's stored result, so the stats page and a later share can
  // show it without refetching.
  useEffect(() => {
    if (!rank || !totalPlayers) return;
    updateDailyResultWithLeaderboard(rank, totalPlayers);
    if (dailyResult?.date) patchDailyRank(dailyResult.date, rank, totalPlayers);
  }, [rank, totalPlayers, dailyResult?.date]);

  const submit = useCallback(
    async (displayName: string) => {
      if (!dailyResult) return;
      saveDisplayName(displayName);
      const success = await submitResult(dailyResult, displayName || 'Anonymous');
      if (success) {
        markLeaderboardSubmitted();
        setSubmittedLocally(true);
        void fetchLeaderboard(dailyResult.date);
      }
    },
    [dailyResult, submitResult, fetchLeaderboard]
  );

  const refresh = useCallback(
    (next?: string) => {
      const target = next ?? date;
      if (target) void fetchLeaderboard(target);
    },
    [date, fetchLeaderboard]
  );

  return {
    entries: leaderboard,
    isLoading,
    rank,
    totalPlayers,
    playerEntry,
    truncated,
    submitted,
    loadError,
    unavailable: !!loadError || !!submitError,
    isSubmitting,
    submitError,
    suggestedName,
    submit,
    refresh,
  };
}

function generateRandomName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    style: 'capital',
    length: 2,
  });
}
