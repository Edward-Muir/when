import React from 'react';
import { SIZE_CLASSES } from './ui/Portrait';
import { podiumStyle } from '../utils/leaderboardUtils';

interface LeaderboardSkeletonProps {
  rows: number;
  /** `full` for the standalone board, `compact` for the preview inside the game-over popup. */
  variant?: 'full' | 'compact';
}

/**
 * Placeholder rows for a leaderboard that is still loading.
 *
 * Shared by both surfaces so they load the same way. A single "Loading leaderboard..." line
 * would let the card grow by several hundred pixels the moment the data lands — the jump reads
 * as something being wrong.
 */
const LeaderboardSkeleton: React.FC<LeaderboardSkeletonProps> = ({ rows, variant = 'full' }) => {
  const compact = variant === 'compact';

  return (
    <div className={compact ? 'space-y-1' : 'divide-y divide-border'}>
      {Array.from({ length: rows }, (_, i) => {
        // The full board's podium rows are taller, with larger tiles (`podiumStyle`).
        const podium = podiumStyle(i + 1);
        return (
          <div
            key={i}
            data-testid="leaderboard-skeleton-row"
            className={
              compact
                ? 'px-2 py-1 flex items-center gap-2'
                : `px-4 ${podium.pad} flex items-center gap-3`
            }
          >
            {!compact && podium.podium ? (
              // The podium has no rank number: its tile sits right-aligned in the same width.
              <div className="w-20 shrink-0 flex justify-end">
                <div className={`bg-border animate-pulse ${SIZE_CLASSES[podium.portrait]}`} />
              </div>
            ) : (
              <>
                {/* The rank number, then the portrait tile at the loaded row's size */}
                <div
                  className={`bg-border rounded animate-pulse shrink-0 ${compact ? 'w-5 h-4' : 'w-6 h-5'}`}
                />
                <div
                  className={`bg-border animate-pulse shrink-0 ${SIZE_CLASSES[compact ? 'xs' : podium.portrait]}`}
                />
              </>
            )}
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
        );
      })}
    </div>
  );
};

export default LeaderboardSkeleton;
