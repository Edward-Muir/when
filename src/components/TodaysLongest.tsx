import React from 'react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';

interface TodaysLongestProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  playerEntry: LeaderboardEntry | null;
  playerRank: number | null;
  onOpenFull: () => void;
}

const Row: React.FC<{
  rank: number | string;
  name: string;
  score: number;
  highlight?: boolean;
}> = ({ rank, name, score, highlight = false }) => (
  <div className={`flex items-center gap-2 text-sm py-0.5 ${highlight ? 'text-accent' : ''}`}>
    <span
      className={`w-6 text-center flex-shrink-0 font-body ${
        highlight ? 'text-accent font-semibold' : 'text-text-muted'
      }`}
    >
      {rank}
    </span>
    <span
      className={`flex-1 text-left truncate font-body ${
        highlight ? 'text-accent font-semibold' : 'text-text'
      }`}
    >
      {name}
    </span>
    <span className="font-body text-accent font-semibold flex-shrink-0">{score}</span>
  </div>
);

/**
 * "Today's Longest" leaderboard for the Daily page: top 3 entries plus a highlighted
 * "You" row when the player is outside the top 3. Tappable to open the full leaderboard.
 */
const TodaysLongest: React.FC<TodaysLongestProps> = ({
  entries,
  isLoading,
  playerEntry,
  playerRank,
  onOpenFull,
}) => {
  const top3 = entries.slice(0, 3);
  const showYouRow = !!playerEntry && (playerEntry.rank ?? playerRank ?? 0) > 3;

  return (
    <button
      onClick={onOpenFull}
      className="w-full text-left cursor-pointer rounded-xl hover:bg-surface/60 p-2 transition-colors"
    >
      <div className="text-xs font-body font-semibold uppercase tracking-[0.15em] text-text-muted mb-2 px-1">
        Longest Timelines
      </div>

      {!isLoading && top3.length === 0 ? (
        <div className="text-sm text-text-muted font-body text-center py-3">
          No entries yet. Be the first!
        </div>
      ) : (
        <div className="space-y-0.5">
          {[0, 1, 2].map((i) => {
            const entry = !isLoading ? (top3.at(i) ?? null) : null;
            if (isLoading) {
              return (
                <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                  <div className="w-6 h-5 bg-border rounded animate-pulse" />
                  <div
                    className="flex-1 h-5 bg-border rounded animate-pulse"
                    style={{ width: `${65 - i * 10}%` }}
                  />
                  <div className="w-6 h-5 bg-border rounded animate-pulse flex-shrink-0" />
                </div>
              );
            }
            return entry ? (
              <Row key={i} rank={entry.rank} name={entry.displayName} score={entry.correctCount} />
            ) : (
              <div key={i} className="text-sm py-0.5">
                <span className="invisible">&nbsp;</span>
              </div>
            );
          })}

          {showYouRow && playerEntry && (
            <>
              <div className="border-t border-border my-1" />
              <Row
                rank={playerEntry.rank ?? playerRank ?? '—'}
                name="You"
                score={playerEntry.correctCount}
                highlight
              />
            </>
          )}
        </div>
      )}
    </button>
  );
};

export default TodaysLongest;
