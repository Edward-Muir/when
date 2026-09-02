import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import { markNavSeen } from '../../utils/playerStorage';
import { iconClass } from './primitives';

interface Props {
  unlocked: number;
  total: number;
}

/**
 * The one tappable card on the page: the badge count, linking to the Achievements route.
 * A route link in both mounts — Achievements lives in the burger menu, not the pager — and
 * it clears the menu's "new" dot on the way, as the menu item itself does.
 */
const AchievementsTile: React.FC<Props> = ({ unlocked, total }) => (
  <Link
    to="/achievements"
    onClick={() => markNavSeen('achievements')}
    aria-label={`Achievements, ${unlocked} of ${total} unlocked`}
    className="touch-manipulation flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left active:bg-bg"
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg">
      <Trophy className={iconClass} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="font-mono text-2xl font-bold text-text">
        {unlocked}
        <span className="text-base text-text-muted"> / {total}</span>
      </div>
      <div className="font-body text-sm text-text-muted">Achievements unlocked</div>
    </div>
    <ChevronRight aria-hidden className="h-6 w-6 shrink-0 text-accent" />
  </Link>
);

export default AchievementsTile;
