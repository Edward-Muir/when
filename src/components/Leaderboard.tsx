import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, X } from 'lucide-react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { resolvePlayerRow, ResolvedPlayerRow } from '../utils/leaderboardUtils';
import LeaderboardRow, { StickyPlayerRow } from './LeaderboardRow';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  totalPlayers: number;
  playerRank: number | null;
  playerEntry: LeaderboardEntry | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void | Promise<void>;
  /** True when `entries` is a capped slice of `totalPlayers` rather than the whole board. */
  truncated?: boolean;
}

const POLL_INTERVAL_MS = 15_000;

// Enough rows to fill the shortest the card ever gets. The card is sized by its content up to
// `max-h`, so the skeleton's row count is what stops it snapping taller when data lands.
const SKELETON_ROWS = 8;

// Matches ~7 rows. Keeps the skeleton, error, empty and short-board states the same height.
const LIST_MIN_HEIGHT = 'min-h-[320px]';

// The desktop card scales in; the mobile sheet slides up from the bottom edge. framer-motion
// writes inline styles, so a Tailwind breakpoint can't express this — hence the media query.
const DESKTOP_MOTION = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
} as const;

const SHEET_MOTION = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
} as const;

// Poll `onRefresh` every `intervalMs` while `active` and the tab is visible.
// Fires an immediate refresh whenever activation starts or the tab becomes visible.
// Pauses on tab-hidden. Uses a ref so unstable inline callbacks don't restart the
// effect on every render.
function useVisiblePolling(
  active: boolean,
  intervalMs: number,
  onRefresh: (() => void | Promise<void>) | undefined
) {
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (!active) return;
    const fire = () => {
      const cb = onRefreshRef.current;
      if (cb) void cb();
    };
    let intervalId: number | null = null;
    const start = () => {
      if (intervalId === null) {
        intervalId = window.setInterval(fire, intervalMs);
      }
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
        fire();
        start();
      }
    };
    if (!document.hidden) {
      fire();
      start();
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, intervalMs]);
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  player: ResolvedPlayerRow;
  isLoading?: boolean;
  error?: string | null;
  onJumpToSelf: () => void;
  playerRowRef: React.Ref<HTMLButtonElement>;
}

/**
 * The scrolling body: skeleton, error, empty state, or the rows themselves. Split out of the
 * animated shell so it can be reasoned about — and tested — without framer-motion in the way.
 */
const LeaderboardList: React.FC<LeaderboardListProps> = ({
  entries,
  player,
  isLoading,
  error,
  onJumpToSelf,
  playerRowRef,
}) => {
  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <div
            key={i}
            data-testid="leaderboard-skeleton-row"
            className="px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-6 bg-border rounded animate-pulse shrink-0" />
            <div
              className="h-5 bg-border rounded animate-pulse"
              // The taper only reads as a list for the first few rows; past that a flat width
              // looks less like a pattern than a formula run off the end of its range.
              style={{ width: i < 5 ? `${70 - i * 8}%` : '34%' }}
            />
            <div className="w-8 h-6 bg-border rounded animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-error font-body">{error}</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted font-body">No entries yet. Be the first!</div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {entries.map((entry) =>
        player.inList && player.row && entry.rank === player.row.rank ? (
          <StickyPlayerRow
            key={entry.rank}
            entry={player.row}
            onJump={onJumpToSelf}
            rowRef={playerRowRef}
          />
        ) : (
          <LeaderboardRow key={entry.rank} entry={entry} />
        )
      )}
    </div>
  );
};

const Leaderboard: React.FC<LeaderboardProps> = ({
  isOpen,
  onClose,
  entries,
  totalPlayers,
  playerRank,
  playerEntry,
  isLoading,
  error,
  onRefresh,
  truncated = false,
}) => {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const playerRowRef = useRef<HTMLButtonElement | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Poll every 15s while the modal is open AND the tab is visible. The hook also
  // fires an immediate refresh on activation, so opening the modal triggers a
  // fresh fetch — no separate refetch-on-open effect needed.
  useVisiblePolling(isOpen, POLL_INTERVAL_MS, onRefresh);

  const player = useMemo(
    () => resolvePlayerRow(entries, playerRank, playerEntry),
    [entries, playerRank, playerEntry]
  );

  // Scroll the pinned row back to where it actually sits in the standings.
  const jumpToSelf = useCallback(() => {
    playerRowRef.current?.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-testid="leaderboard-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leaderboard-title"
            className="flex flex-col overflow-hidden bg-surface shadow-sm w-full h-dvh min-h-screen-safe pt-safe-top pb-safe-bottom sm:w-[90vw] sm:max-w-[400px] sm:h-auto sm:min-h-0 sm:max-h-[80vh] sm:rounded-lg sm:border sm:border-border sm:pt-0 sm:pb-0"
            {...(isDesktop ? DESKTOP_MOTION : SHEET_MOTION)}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            // The backdrop closes the sheet; clicks that land on the sheet itself must not.
            // Without this, tapping a row — or releasing a scrollbar drag — closes it.
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <h2 id="leaderboard-title" className="text-lg font-display font-semibold text-text">
                  Daily Leaderboard
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-border transition-colors"
                aria-label="Close leaderboard"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Player count */}
            <div className="px-4 py-2 border-b border-border bg-bg flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted font-body">
                {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} today
              </span>
            </div>

            {/* Entries */}
            <div
              className={`overflow-y-auto flex-1 ${LIST_MIN_HEIGHT} timeline-scroll-vertical`}
              data-testid="leaderboard-list"
            >
              <LeaderboardList
                entries={entries}
                player={player}
                isLoading={isLoading}
                error={error}
                onJumpToSelf={jumpToSelf}
                playerRowRef={playerRowRef}
              />
            </div>

            {/* The player ranks below the served slice, so there is no row in the list to pin. */}
            {!isLoading && !error && player.row && !player.inList && (
              <div className="shrink-0 border-t border-border">
                <LeaderboardRow entry={player.row} highlight />
              </div>
            )}

            {/* A board fills over ~50 hours, because the puzzle day is each player's own local
                date. Ranks really do drift overnight; say so rather than let it read as a bug. */}
            {!isLoading && !error && entries.length > 0 && (
              <div className="shrink-0 border-t border-border px-4 py-2 text-xs text-text-muted font-body">
                {truncated && `Showing the top ${entries.length} of ${totalPlayers}. `}
                Ranks update through the day as players in other time zones finish.
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;
