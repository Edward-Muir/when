import React from 'react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { getMedalColor } from '../utils/leaderboardUtils';
import { Avatar, resolveAvatar } from '../utils/avatar';
import Portrait from './ui/Portrait';

/** Shared geometry, so the sticky player row lines up exactly with the rows it floats over. */
const ROW_LAYOUT = 'w-full px-4 py-2 flex items-center gap-3 text-left';

/**
 * Rank, portrait, name, score. The podium is marked by framing the top three portraits in
 * gold, silver and bronze rather than with medal emoji, so the rank is a plain number for
 * everyone and the portrait carries the honour.
 */
const RankCell: React.FC<{ rank: number }> = ({ rank }) => (
  <div className="w-6 text-right shrink-0 text-sm text-text-muted font-mono">{rank}</div>
);

const NameScoreCells: React.FC<{ entry: LeaderboardEntry }> = ({ entry }) => (
  <>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-text truncate font-body">{entry.displayName}</div>
    </div>

    <div className="text-right shrink-0">
      <span className="text-lg font-bold font-mono text-accent">{entry.correctCount}</span>
    </div>
  </>
);

const RowCells: React.FC<{ entry: LeaderboardEntry; avatar: Avatar }> = ({ entry, avatar }) => (
  <>
    <RankCell rank={entry.rank} />
    <Portrait avatar={avatar} size="md" frame={getMedalColor(entry.rank)} />
    <NameScoreCells entry={entry} />
  </>
);

/** Open a player's portrait up close (`PortraitViewerModal`). */
export type ViewPortrait = (entry: LeaderboardEntry, avatar: Avatar) => void;

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  /** Paint the player's own highlight. Opaque by design — see `.bg-player-row` in index.css. */
  highlight?: boolean;
  /** Make the whole row a button that shows this player's portrait up close. */
  onView?: ViewPortrait;
}

/**
 * The row's container: a button when it opens the portrait, a plain div otherwise. The whole
 * row is the target, not the portrait, because index.css forces `min-height: 44px` on every
 * button, which suits a full row and would distort a small control.
 */
const RowShell: React.FC<{
  entry: LeaderboardEntry;
  avatar: Avatar;
  className: string;
  onView?: ViewPortrait;
}> = ({ entry, avatar, className, onView }) =>
  onView ? (
    <button
      type="button"
      onClick={() => onView(entry, avatar)}
      aria-label={`View ${entry.displayName}'s portrait`}
      className={className}
    >
      <RowCells entry={entry} avatar={avatar} />
    </button>
  ) : (
    <div className={className}>
      <RowCells entry={entry} avatar={avatar} />
    </div>
  );

/**
 * The player's own row shows the avatar they have now, not the one stored with today's score:
 * a pick made after submitting would otherwise only appear tomorrow, on their own screen too.
 */
const OwnRow: React.FC<{ entry: LeaderboardEntry; className: string; onView?: ViewPortrait }> = (
  props
) => {
  const { avatar } = usePlayerProfile();
  return <RowShell {...props} avatar={avatar} />;
};

/** A plain row. Used for everyone else, and for the pinned footer when the board is truncated. */
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, highlight = false, onView }) =>
  highlight ? (
    <OwnRow entry={entry} className={`${ROW_LAYOUT} bg-player-row`} onView={onView} />
  ) : (
    <RowShell entry={entry} avatar={resolveAvatar(entry)} className={ROW_LAYOUT} onView={onView} />
  );

interface StickyPlayerRowProps {
  entry: LeaderboardEntry;
  onJump: () => void;
  rowRef: React.Ref<HTMLButtonElement>;
  onView?: ViewPortrait;
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
 * Two buttons side by side, since buttons cannot nest: the rank and portrait open the portrait
 * up close, the name and score scroll the row back to its place. Both are full-height, which
 * suits index.css's forced `min-height: 44px` on buttons.
 */
const StickyPlayerRow: React.FC<StickyPlayerRowProps> = ({ entry, onJump, rowRef, onView }) => {
  const { avatar } = usePlayerProfile();
  return (
    <div
      data-testid="player-sticky-row"
      className="w-full flex items-stretch sticky top-0 bottom-0 z-10 bg-player-row border-y border-accent shadow-sm"
    >
      <button
        type="button"
        onClick={() => onView?.(entry, avatar)}
        disabled={!onView}
        aria-label="View your portrait"
        className="pl-4 py-2 flex items-center gap-3 shrink-0"
      >
        <RankCell rank={entry.rank} />
        <Portrait avatar={avatar} size="md" frame={getMedalColor(entry.rank)} />
      </button>
      <button
        ref={rowRef}
        type="button"
        onClick={onJump}
        aria-label={`Your rank, ${entry.rank}. Scroll to your position.`}
        className="flex-1 min-w-0 pl-3 pr-4 py-2 flex items-center gap-3 text-left"
      >
        <NameScoreCells entry={entry} />
      </button>
    </div>
  );
};

export { StickyPlayerRow };
export default LeaderboardRow;
