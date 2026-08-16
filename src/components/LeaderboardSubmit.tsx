import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { DailyLeaderboard } from '../hooks/useDailyLeaderboard';
import { getMedalEmoji, resolvePlayerRow } from '../utils/leaderboardUtils';
import LeaderboardSkeleton from './LeaderboardSkeleton';

const PREVIEW_ROWS = 3;

function PreviewHeader() {
  return (
    <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
      <Trophy className="w-3 h-3" />
      <span>Today&apos;s Leaderboard</span>
    </div>
  );
}

// Leaderboard preview showing top 3 + player's entry if outside top 3
function LeaderboardPreview({
  entries,
  playerRank,
  playerEntry,
}: {
  entries: LeaderboardEntry[];
  playerRank: number | null;
  playerEntry: LeaderboardEntry | null;
}) {
  if (entries.length === 0) {
    return null;
  }

  const top3 = entries.slice(0, PREVIEW_ROWS);
  // The server's own row for the caller, not a lookup in `entries` — the list is a capped
  // slice, so searching it silently finds nothing once the player ranks below the cap.
  const { row: playerRow, inList } = resolvePlayerRow(top3, playerRank, playerEntry);
  const outsideTop3 = playerRow !== null && !inList;

  return (
    <div className="space-y-1">
      <PreviewHeader />
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

/**
 * Claim today's score: a name and a submit button.
 *
 * Split out of the popup block below because the board modal shows it too — that is the only
 * route back for a score whose submission failed at game over, since the popup is gone for good
 * once dismissed. The modal wants the form without the top-3 preview, which would duplicate the
 * board it sits under.
 */
export const LeaderboardSubmitForm: React.FC<{ leaderboard: DailyLeaderboard }> = ({
  leaderboard,
}) => {
  const [name, setName] = useState(leaderboard.suggestedName);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        maxLength={20}
        className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        onClick={() => void leaderboard.submit(name)}
        disabled={leaderboard.isSubmitting}
        className="w-full py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium font-body text-sm transition-colors disabled:opacity-50"
      >
        {leaderboard.isSubmitting ? 'Submitting...' : 'Submit to Leaderboard'}
      </button>
      {leaderboard.submitError && (
        <div className="text-xs text-error text-center font-body">
          {submitErrorMessage(leaderboard.submitError)}
        </div>
      )}
    </div>
  );
};

/**
 * What to tell the player about a failed submission — and specifically whether retrying is worth
 * their time. Everything except a network or server fault is permanent for this score, and saying
 * "try again later" to those sent players back to a button that could never work.
 */
function submitErrorMessage(error: string): string {
  if (error === 'Already submitted today') return "You've already submitted today";
  if (error.startsWith('Invalid')) return "This score couldn't be verified.";
  return 'Failed to submit. Try again later.';
}

/**
 * The leaderboard block inside the daily game-over popup: the top of today's board, and either
 * the player's placing or the form to claim it.
 *
 * Presentational — all leaderboard state lives in `useDailyLeaderboard`, owned by `Game`. It used
 * to hold its own `useLeaderboard` instance and report upward through `onSubmitted` /
 * `onRankResolved` callbacks, which is how the popup's submit gate could get permanently stuck.
 */
const LeaderboardSubmit: React.FC<{ leaderboard: DailyLeaderboard }> = ({ leaderboard }) => {
  const { entries, isLoading, rank, totalPlayers, playerEntry, submitted } = leaderboard;

  // Hold the skeleton until the board answers. Rendering the form first and swapping it for the
  // player's placing a moment later is the flicker this replaces — and for anyone already on the
  // board, the form was never the right screen to show.
  if (isLoading && !submitted) {
    return (
      <div className="border-t border-border pt-4 mt-4">
        <PreviewHeader />
        <LeaderboardSkeleton rows={PREVIEW_ROWS} variant="compact" />
      </div>
    );
  }

  if (submitted) {
    const percentile =
      rank && totalPlayers && totalPlayers > 1
        ? Math.round(((totalPlayers - rank) / (totalPlayers - 1)) * 100)
        : null;

    return (
      <div className="border-t border-border pt-4 mt-4">
        <LeaderboardPreview entries={entries} playerRank={rank} playerEntry={playerEntry} />

        {percentile !== null && percentile > 0 && (
          <div className="mt-3 text-center">
            <div className="text-sm text-accent font-medium font-body">
              You did better than {percentile}% of players
            </div>
          </div>
        )}

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

  return (
    <div className="border-t border-border pt-4 mt-4">
      <LeaderboardPreview entries={entries} playerRank={null} playerEntry={null} />

      <div className="mt-3">
        <LeaderboardSubmitForm leaderboard={leaderboard} />
      </div>
    </div>
  );
};

export default LeaderboardSubmit;
