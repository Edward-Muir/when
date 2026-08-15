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

export interface DailyLeaderboard {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  rank: number | null;
  totalPlayers: number | null;
  playerEntry: LeaderboardEntry | null;
  /** This player's score is on the board — from any source. See the note below. */
  submitted: boolean;
  /** The board could not be read or written, so submitting is not currently possible. */
  unavailable: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  /** The name to prefill the submit form with. */
  suggestedName: string;
  submit: (displayName: string) => Promise<void>;
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
 * hook stays inert — no fetch, no polling.
 */
export function useDailyLeaderboard(dailyResult: DailyResult | null): DailyLeaderboard {
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

  const date = dailyResult?.date;

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
    if (!date) return;
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
  }, [date, fetchLeaderboard]);

  // Persist the placing onto today's stored result, so the stats page and a later share can
  // show it without refetching.
  useEffect(() => {
    if (rank && totalPlayers) updateDailyResultWithLeaderboard(rank, totalPlayers);
  }, [rank, totalPlayers]);

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

  return {
    entries: leaderboard,
    isLoading,
    rank,
    totalPlayers,
    playerEntry,
    submitted,
    unavailable: !!loadError || !!submitError,
    isSubmitting,
    submitError,
    suggestedName,
    submit,
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
