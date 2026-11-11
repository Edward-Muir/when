import React, { useState } from 'react';
import { getSeenPortraits } from '../../utils/playerStorage';
import { getAchievements } from '../../utils/statsStorage';
import { newEarnedPortraits } from '../../utils/avatar';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import AvatarPickerModal from '../AvatarPickerModal';
import OwnPortrait from '../ui/OwnPortrait';
import { RowCard, RowChevron, rowClass } from './rows';

/**
 * The player, at the head of the Settings tab: their portrait and name as they show on the
 * leaderboard, and the way to change both. It wears a gold "new" dot while an achievement
 * portrait has not been shown in the picker yet; opening the picker clears it.
 */
const ProfileCard: React.FC = () => {
  const { name } = usePlayerProfile();
  const [open, setOpen] = useState(false);
  // Read on render: the card re-renders when the picker closes, which is what clears it.
  const hasNewPortraits =
    newEarnedPortraits(getAchievements().unlocked, getSeenPortraits()).size > 0;

  return (
    <>
      <RowCard>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Profile"
          className={`${rowClass} py-3`}
        >
          <span className="relative shrink-0">
            <OwnPortrait size={60} />
            {hasNewPortraits && (
              <span
                role="img"
                aria-label="New"
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface"
              />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-xl font-semibold text-text">
              {name}
            </span>
            <span className="block text-sm text-text-muted">Change name and portrait</span>
          </span>
          <RowChevron />
        </button>
      </RowCard>

      <AvatarPickerModal open={open} onDismiss={() => setOpen(false)} />
    </>
  );
};

export default ProfileCard;
