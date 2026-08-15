import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { useLeaderboard, LeaderboardEntry } from '../hooks/useLeaderboard';
import { getMedalEmoji, resolvePlayerRow } from '../utils/leaderboardUtils';
import {
  DailyResult,
  getDisplayName,
  saveDisplayName,
  hasSubmittedToLeaderboard,
  markLeaderboardSubmitted,
  updateDailyResultWithLeaderboard,
} from '../utils/playerStorage';

function generateRandomName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    style: 'capital',
    length: 2,
  });
}

interface LeaderboardSubmitProps {
  dailyResult: DailyResult;
  onSubmitted?: () => void;
  /**
   * Fired when this component's `useLeaderboard` resolves a rank, so the game-over popup can
   * put it on the share. This component owns the only `useLeaderboard` instance on the
   * screen; lifting the value out is cheaper than mounting a second one and cannot drift
   * from what is rendered here.
   */
  onRankResolved?: (rank: number) => void;
}

// Leaderboard preview showing top 3 + player's entry if outside top 3
function LeaderboardPreview({
  entries,
  isLoading,
  playerRank,
  playerEntry,
}: {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  playerRank: number | null;
  playerEntry: LeaderboardEntry | null;
}) {
  if (isLoading) {
    return <div className="text-sm text-text-muted text-center py-2">Loading leaderboard...</div>;
  }

  if (entries.length === 0) {
    return null;
  }

  const top3 = entries.slice(0, 3);
  // The server's own row for the caller, not a lookup in `entries` — the list is a capped
  // slice, so searching it silently finds nothing once the player ranks below the cap.
  const { row: playerRow, inList } = resolvePlayerRow(top3, playerRank, playerEntry);
  const outsideTop3 = playerRow !== null && !inList;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
        <Trophy className="w-3 h-3" />
        <span>Today's Leaderboard</span>
      </div>
      {top3.map((entry) => (
        <div
          key={entry.rank}
          className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${playerRank === entry.rank ? 'bg-player-row' : ''}`}
        >
          <span className="w-5 text-center">{getMedalEmoji(entry.rank)}</span>
          <span className="flex-1 truncate font-body text-text">{entry.displayName}</span>
          <span className="font-mono text-accent font-medium">{entry.correctCount}</span>
        </div>
      ))}
      {outsideTop3 && playerRow && (
        <>
          <div className="text-xs text-text-muted text-center py-1">...</div>
          <div className="flex items-center gap-2 text-sm px-2 py-1 rounded bg-player-row">
            <span className="w-5 text-center text-xs text-text-muted font-mono">
              #{playerRow.rank}
            </span>
            <span className="flex-1 truncate font-body text-text">{playerRow.displayName}</span>
            <span className="font-mono text-accent font-medium">{playerRow.correctCount}</span>
          </div>
        </>
      )}
    </div>
  );
}

const LeaderboardSubmit: React.FC<LeaderboardSubmitProps> = ({
  dailyResult,
  onSubmitted,
  onRankResolved,
}) => {
  const [name, setName] = useState(() => getDisplayName() || generateRandomName());
  const [alreadySubmitted, setAlreadySubmitted] = useState(hasSubmittedToLeaderboard());

  const {
    isSubmitting,
    hasSubmitted,
    submitError,
    rank,
    totalPlayers,
    isLoading,
    leaderboard,
    playerEntry,
    submitResult,
    fetchLeaderboard,
  } = useLeaderboard();

  // Fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard(dailyResult.date);
  }, [dailyResult.date, fetchLeaderboard]);

  // Keep the post-game leaderboard preview live: refetch on app resume / tab refocus,
  // and poll every 15s while visible. Polling pauses when the tab is hidden.
  useEffect(() => {
    const date = dailyResult.date;
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
  }, [dailyResult.date, fetchLeaderboard]);

  // Check if already submitted on mount
  useEffect(() => {
    setAlreadySubmitted(hasSubmittedToLeaderboard());
  }, []);

  // Save leaderboard data to localStorage when rank is available, and hand it up so the
  // share rendered alongside this component can carry it.
  useEffect(() => {
    if (rank && totalPlayers) {
      updateDailyResultWithLeaderboard(rank, totalPlayers);
      onRankResolved?.(rank);
    }
  }, [rank, totalPlayers, onRankResolved]);

  const handleSubmit = async () => {
    // Save name for future use
    saveDisplayName(name);

    const success = await submitResult(dailyResult, name || 'Anonymous');
    if (success) {
      markLeaderboardSubmitted();
      setAlreadySubmitted(true);
      onSubmitted?.();
      // Refresh leaderboard to show updated entries
      fetchLeaderboard(dailyResult.date);
    }
  };

  // Already submitted - show leaderboard with player's position
  if (alreadySubmitted || hasSubmitted) {
    return (
      <div className="border-t border-border pt-4 mt-4">
        <LeaderboardPreview
          entries={leaderboard}
          isLoading={isLoading}
          playerRank={rank}
          playerEntry={playerEntry}
        />

        {rank &&
          totalPlayers &&
          totalPlayers > 1 &&
          (() => {
            const percentile = Math.round(((totalPlayers - rank) / (totalPlayers - 1)) * 100);
            if (percentile <= 0) return null;
            return (
              <div className="mt-3 text-center">
                <div className="text-sm text-accent font-medium font-body">
                  You did better than {percentile}% of players
                </div>
              </div>
            );
          })()}

        {totalPlayers && (
          <div className="mt-3 text-center">
            <div className="text-xs text-text-muted">
              {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} today
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not submitted yet - show form
  return (
    <div className="border-t border-border pt-4 mt-4">
      <LeaderboardPreview
        entries={leaderboard}
        isLoading={isLoading}
        playerRank={null}
        playerEntry={null}
      />

      <div className="mt-3 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          maxLength={20}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium font-body text-sm transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit to Leaderboard'}
        </button>
        {submitError && (
          <div className="text-xs text-error text-center font-body">
            {submitError === 'Already submitted today'
              ? "You've already submitted today"
              : 'Failed to submit. Try again later.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardSubmit;
