import React from 'react';
import Modal from './ui/Modal';
import Portrait from './ui/Portrait';
import { LeaderboardEntry } from '../hooks/useLeaderboard';
import { getMedalColor } from '../utils/leaderboardUtils';
import { Avatar, getAnimal, getTheme } from '../utils/avatar';

export interface ViewedPortrait {
  entry: LeaderboardEntry;
  avatar: Avatar;
}

interface PortraitViewerModalProps {
  open: boolean;
  /** The player to show. Keep the last one after closing, so the card has content as it exits. */
  viewing: ViewedPortrait | null;
  onDismiss: () => void;
}

/**
 * A leaderboard player's portrait, up close. Opened by tapping their row; any tap closes it.
 *
 * On `ui/Modal`: keep it mounted and drive `open`. `reveal` layer so it sits over the board it
 * opens from.
 */
const PortraitViewerModal: React.FC<PortraitViewerModalProps> = ({
  open,
  viewing: current,
  onDismiss,
}) => {
  const animal = current ? (getAnimal(current.avatar.animal)?.label ?? current.avatar.animal) : '';
  const theme = current ? getTheme(current.avatar.theme)?.label : undefined;

  return (
    <Modal
      open={open && current !== null}
      onDismiss={onDismiss}
      dismiss="tap-advance"
      size="compact"
      layer="reveal"
      labelledBy="portrait-viewer-name"
    >
      {current && (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <Portrait
            avatar={current.avatar}
            size="2xl"
            labelled
            frame={getMedalColor(current.entry.rank)}
          />
          <div className="min-w-0 max-w-full">
            <h2
              id="portrait-viewer-name"
              className="font-display font-semibold text-xl text-text truncate"
            >
              {current.entry.displayName}
            </h2>
            <p className="text-sm text-text-muted font-body">
              {theme ? `${animal} · ${theme}` : animal}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PortraitViewerModal;
