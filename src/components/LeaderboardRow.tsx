import React from 'react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { getMedalEmoji, getMistakeCount } from '../utils/leaderboardUtils';

/** Shared geometry, so the sticky player row lines up exactly with the rows it floats over. */
const ROW_LAYOUT = 'w-full px-4 py-3 flex items-center gap-3 text-left';

const RowCells: React.FC<{ entry: LeaderboardEntry }> = ({ entry }) => {
  const medal = getMedalEmoji(entry.rank);
  const mistakes = getMistakeCount(entry);

  return (
    <>
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-sm text-text-muted font-mono">#{entry.rank}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-text truncate font-body">{entry.displayName}</div>
      </div>

      <div className="shrink-0 flex items-baseline gap-1">
        <span className="text-lg font-bold font-mono text-accent">{entry.correctCount}</span>
        {mistakes > 0 && (
          <span className="text-sm font-mono text-text-muted" aria-label={`${mistakes} mistakes`}>
            {mistakes}✗
          </span>
        )}
      </div>
    </>
  );
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  /** Paint the player's own highlight. Opaque by design — see `.bg-player-row` in index.css. */
  highlight?: boolean;
}

/** A plain row. Used for everyone else, and for the pinned footer when the board is truncated. */
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, highlight = false }) => (
  <div className={`${ROW_LAYOUT} ${highlight ? 'bg-player-row' : ''}`}>
    <RowCells entry={entry} />
  </div>
);

interface StickyPlayerRowProps {
  entry: LeaderboardEntry;
  onJump: () => void;
  rowRef: React.Ref<HTMLButtonElement>;
}

/**
 * The player's own row, pinned inside the scroll container.
 *
 * `sticky` with *both* `top-0` and `bottom-0` keeps a short box clamped into the scrollport:
 * it rides the bottom edge while its natural position is still below the fold, settles into
 * place as you scroll past it, then rides the top edge afterwards. So the player can always
 * see where they stand without the list carrying a duplicate row — which is what the old
 * `•••` separator existed to do.
 *
 * `z-10` matters: the list's `divide-y` puts a border on every sibling, and without a stacking
 * bump those borders draw over the pinned row. The background must stay fully opaque or the
 * rows scrolling underneath show through.
 *
 * The whole row is the button, not an icon inside it — index.css forces `min-height: 44px` on
 * every button, which suits a full row and would distort a small control.
 */
const StickyPlayerRow: React.FC<StickyPlayerRowProps> = ({ entry, onJump, rowRef }) => (
  <button
    ref={rowRef}
    type="button"
    onClick={onJump}
    aria-label={`Your rank, ${entry.rank}. Scroll to your position.`}
    className={`${ROW_LAYOUT} sticky top-0 bottom-0 z-10 bg-player-row border-y border-accent shadow-sm`}
  >
    <RowCells entry={entry} />
  </button>
);

export { StickyPlayerRow };
export default LeaderboardRow;
