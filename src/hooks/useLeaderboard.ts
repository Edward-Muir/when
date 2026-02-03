import { useState, useCallback } from 'react';
import { DailyResult } from '../utils/playerStorage';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

export interface LeaderboardEntry {
  displayName: string;
  correctCount: number;
  totalAttempts: number;
  emojiGrid: string;
  rank: number;
}

export interface LeaderboardData {
  date: string;
  leaderboard: LeaderboardEntry[];
  totalPlayers: number;
  playerRank: number | null;
  playerEntry: LeaderboardEntry | null;
}

interface LeaderboardState {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  submitError: string | null;
  rank: number | null;
  totalPlayers: number | null;
  isLoading: boolean;
  loadError: string | null;
  data: LeaderboardData | null;
}

export function useLeaderboard() {
  const [state, setState] = useState<LeaderboardState>({
    isSubmitting: false,
    hasSubmitted: false,
    submitError: null,
    rank: null,
    totalPlayers: null,
    isLoading: false,
    loadError: null,
    data: null,
  });

  /**
   * Submit a daily result to the leaderboard
   */
  const submitResult = useCallback(
    async (result: DailyResult, displayName: string): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        submitError: null,
      }));

      try {
        const deviceId = await getDeviceFingerprint();

        const response = await fetch('/api/leaderboard/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: result.date,
            displayName,
            correctCount: result.correctCount,
            totalAttempts: result.totalAttempts,
            emojiGrid: result.emojiGrid,
            deviceId,
            theme: result.theme,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Submission failed');
        }

        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          hasSubmitted: true,
          submitError: null,
          rank: data.rank,
          totalPlayers: data.totalPlayers,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitError: errorMessage,
        }));
        return false;
      }
    },
    []
  );

  /**
   * Fetch the leaderboard for a specific date
   */
  const fetchLeaderboard = useCallback(async (date: string): Promise<LeaderboardData | null> => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      loadError: null,
    }));

    try {
      const deviceId = await getDeviceFingerprint();
      const response = await fetch(
        `/api/leaderboard/${date}?deviceId=${encodeURIComponent(deviceId)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load leaderboard');
      }

      const data: LeaderboardData = await response.json();

      setState((prev) => ({
        ...prev,
        isLoading: false,
        loadError: null,
        data,
        // Update hasSubmitted if we found the player in the leaderboard
        hasSubmitted: prev.hasSubmitted || data.playerRank !== null,
        rank: data.playerRank,
        totalPlayers: data.totalPlayers,
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        loadError: errorMessage,
      }));
      return null;
    }
  }, []);

  /**
   * Reset the leaderboard state (useful when starting a new game)
   */
  const resetState = useCallback(() => {
    setState({
      isSubmitting: false,
      hasSubmitted: false,
      submitError: null,
      rank: null,
      totalPlayers: null,
      isLoading: false,
      loadError: null,
      data: null,
    });
  }, []);

  return {
    // Submission state
    isSubmitting: state.isSubmitting,
    hasSubmitted: state.hasSubmitted,
    submitError: state.submitError,
    rank: state.rank,
    totalPlayers: state.totalPlayers,

    // Fetch state
    isLoading: state.isLoading,
    loadError: state.loadError,
    leaderboard: state.data?.leaderboard ?? [],
    playerEntry: state.data?.playerEntry ?? null,

    // Actions
    submitResult,
    fetchLeaderboard,
    resetState,
  };
}
