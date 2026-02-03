import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { useLeaderboard, LeaderboardEntry } from '../hooks/useLeaderboard';
import {
  DailyResult,
  getDisplayName,
  saveDisplayName,
  hasSubmittedToLeaderboard,
  markLeaderboardSubmitted,
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
}

function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

// Leaderboard preview showing top 3 + player's entry if outside top 3
function LeaderboardPreview({
  entries,
  isLoading,
  playerRank,
}: {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  playerRank: number | null;
}) {
  if (isLoading) {
    return <div className="text-sm text-text-muted text-center py-2">Loading leaderboard...</div>;
  }

  if (entries.length === 0) {
    return null;
  }

  const top3 = entries.slice(0, 3);
  const playerEntry =
    playerRank && playerRank > 3 ? entries.find((e) => e.rank === playerRank) : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
        <Trophy className="w-3 h-3" />
        <span>Today's Leaderboard</span>
      </div>
      {top3.map((entry) => (
        <div
          key={entry.rank}
          className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${playerRank === entry.rank ? 'bg-accent/10' : ''}`}
        >
          <span className="w-5 text-center">{getMedalEmoji(entry.rank)}</span>
          <span className="flex-1 truncate font-body text-text">{entry.displayName}</span>
          <span className="font-mono text-accent font-medium">{entry.correctCount}</span>
        </div>
      ))}
      {playerEntry && (
        <>
          <div className="text-xs text-text-muted text-center py-1">...</div>
          <div className="flex items-center gap-2 text-sm px-2 py-1 rounded bg-accent/10">
            <span className="w-5 text-center text-xs text-text-muted font-mono">
              #{playerEntry.rank}
            </span>
            <span className="flex-1 truncate font-body text-text">{playerEntry.displayName}</span>
            <span className="font-mono text-accent font-medium">{playerEntry.correctCount}</span>
          </div>
        </>
      )}
    </div>
  );
}

const LeaderboardSubmit: React.FC<LeaderboardSubmitProps> = ({ dailyResult }) => {
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
    submitResult,
    fetchLeaderboard,
  } = useLeaderboard();

  // Fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard(dailyResult.date);
  }, [dailyResult.date, fetchLeaderboard]);

  // Check if already submitted on mount
  useEffect(() => {
    setAlreadySubmitted(hasSubmittedToLeaderboard());
  }, []);

  const handleSubmit = async () => {
    // Save name for future use
    saveDisplayName(name);

    const success = await submitResult(dailyResult, name || 'Anonymous');
    if (success) {
      markLeaderboardSubmitted();
      setAlreadySubmitted(true);
      // Refresh leaderboard to show updated entries
      fetchLeaderboard(dailyResult.date);
    }
  };

  // Already submitted - show leaderboard with player's position
  if (alreadySubmitted || hasSubmitted) {
    return (
      <div className="border-t border-border pt-4 mt-4">
        <LeaderboardPreview entries={leaderboard} isLoading={isLoading} playerRank={rank} />

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
      <LeaderboardPreview entries={leaderboard} isLoading={isLoading} playerRank={null} />

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
