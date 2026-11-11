import React, { useState } from 'react';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { useTheme } from '../hooks/useTheme';
import { UpdatePopup } from './UpdatePopup';

interface UpdateNoticeProps {
  /** Hold the popup back, e.g. while the game's intro plays. */
  paused?: boolean;
}

/**
 * The two things the app must do on every screen, mounted once by `App`. Both lived in the
 * top bar's menu while there was one, and neither has a visible home of its own:
 *
 * - the version check and its "what's new" popup. Nothing else calls `useVersionCheck`, so
 *   without this an installed app would never learn a new build exists;
 * - the saved light or dark theme, which `useTheme` applies to the document on mount. The
 *   switch itself is on the Settings tab, which mounts lazily and not at all during a game.
 */
const UpdateNotice: React.FC<UpdateNoticeProps> = ({ paused = false }) => {
  useTheme();
  const { updateAvailable, newVersion, notes } = useVersionCheck();
  const [dismissed, setDismissed] = useState(false);

  return (
    <UpdatePopup
      isVisible={updateAvailable && !dismissed && !paused}
      onDismiss={() => setDismissed(true)}
      version={newVersion}
      notes={notes}
    />
  );
};

export default UpdateNotice;
