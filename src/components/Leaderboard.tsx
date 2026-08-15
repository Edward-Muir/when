import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, X } from 'lucide-react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { resolvePlayerRow, ResolvedPlayerRow } from '../utils/leaderboardUtils';
import LeaderboardRow, { StickyPlayerRow } from './LeaderboardRow';
import LeaderboardSkeleton from './LeaderboardSkeleton';

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

// ~6 rows, so the skeleton, error, empty and short-board states settle at the same height.
// Capped against the viewport too: the card is `max-h-[min(75vh,520px)]` and the header and
// count bar take ~90px of it, so a flat pixel floor would outgrow the card on a landscape phone
// and `overflow-hidden` would silently eat the bottom of the list.
const LIST_MIN_HEIGHT = 'min-h-[min(320px,30vh)]';

const CARD_MOTION = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
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
    return <LeaderboardSkeleton rows={SKELETON_ROWS} />;
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
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
        ? 'auto'
        : 'smooth',
    });
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-testid="leaderboard-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
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
            // Keep a real height cap. Filling the backdrop's padded box was tried, to get an
            // even gap on all four sides, and it shipped broken: `p-4` is 16px, but on iOS the
            // webview extends under the status bar (`overlaysWebView: true`), so the card's top
            // edge landed under the clock and camera. A short, centred card clears the inset by
            // being centred, without needing to know what the inset is.
            //
            // Headless Chromium reports `env(safe-area-inset-*)` as 0, so a browser check
            // cannot see that failure. Verify height changes on a real device or the PWA.
            className="w-[90vw] max-w-[400px] max-h-[min(75vh,520px)] rounded-lg overflow-hidden border border-border bg-surface shadow-sm flex flex-col"
            {...CARD_MOTION}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            // The backdrop closes the board; clicks that land on the card itself must not.
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

            {/* Player count. Also where truncation is disclosed: `totalPlayers` is the true
                count while the list is capped, so without this the board would imply it is
                showing everyone. */}
            <div className="px-4 py-2 border-b border-border bg-bg flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted font-body">
                {truncated
                  ? `Showing ${entries.length} of ${totalPlayers} players today`
                  : `${totalPlayers} player${totalPlayers !== 1 ? 's' : ''} today`}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;
