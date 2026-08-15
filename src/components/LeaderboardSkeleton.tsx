import React from 'react';

interface LeaderboardSkeletonProps {
  rows: number;
  /** `full` for the standalone board, `compact` for the preview inside the game-over popup. */
  variant?: 'full' | 'compact';
}

/**
 * Placeholder rows for a leaderboard that is still loading.
 *
 * Shared by both surfaces so they load the same way. The game-over popup used to show a single
 * "Loading leaderboard..." line instead, which meant the card grew by several hundred pixels the
 * moment the data landed — the jump read as something being wrong.
 */
const LeaderboardSkeleton: React.FC<LeaderboardSkeletonProps> = ({ rows, variant = 'full' }) => {
  const compact = variant === 'compact';

  return (
    <div className={compact ? 'space-y-1' : 'divide-y divide-border'}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          data-testid="leaderboard-skeleton-row"
          className={
            compact ? 'px-2 py-1 flex items-center gap-2' : 'px-4 py-3 flex items-center gap-3'
          }
        >
          <div
            className={`bg-border rounded animate-pulse shrink-0 ${compact ? 'w-5 h-4' : 'w-8 h-6'}`}
          />
          <div
            className={`bg-border rounded animate-pulse ${compact ? 'h-4' : 'h-5'}`}
            // The taper only reads as a list for the first few rows; past that a flat width
            // looks less like a pattern than a formula run off the end of its range.
            style={{ width: i < 5 ? `${70 - i * 8}%` : '34%' }}
          />
          <div
            className={`bg-border rounded animate-pulse shrink-0 ${compact ? 'w-5 h-4' : 'w-8 h-6'}`}
          />
        </div>
      ))}
    </div>
  );
};

export default LeaderboardSkeleton;
