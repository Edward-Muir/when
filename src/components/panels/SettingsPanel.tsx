import React, { useState } from 'react';
import HintStrip from '../HintStrip';
import { Toast } from '../Toast';
import { tabHintText } from '../../utils/hintCopy';
import { useTabHint } from '../../hooks/useTabHint';
import ProfileCard from '../settings/ProfileCard';
import PreferencesCard from '../settings/PreferencesCard';
import MoreCard from '../settings/MoreCard';
import { GroupHeading } from '../settings/rows';
import StatsPanel from './StatsPanel';

interface SettingsPanelProps {
  /** Whether this panel is the visible pager tab (see `StatsPanel`). */
  active?: boolean;
}

/**
 * The Settings tab: the player's profile, the settings, their stats and badges, and
 * everything else the burger menu used to hold. One page, in the order it is wanted: who you
 * are and what you can change first, how you have played next, the rarely-needed links last.
 *
 * Mounted by the home pager (`/settings`, and `/stats` from when it was the Stats tab); the
 * pager page owns the scroll container.
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ active = true }) => {
  const hint = useTabHint('statsTab', active);
  const [notice, setNotice] = useState<string | null>(null);
  // The toast keeps its last words while it leaves, so it never blanks mid-fade.
  const [lastNotice, setLastNotice] = useState('');
  const showNotice = (message: string) => {
    setLastNotice(message);
    setNotice(message);
  };

  return (
    <div className="mx-auto w-full max-w-sm px-3">
      {/* Header — the other tabs' heading, so the five read alike */}
      <div className="text-left mb-3">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Settings</h1>
        <p className="text-text-muted text-sm mt-1 font-body">You, your game and your stats</p>
        <HintStrip text={hint.show ? tabHintText('statsTab') : null} onDismiss={hint.dismiss} />
      </div>

      <div className="flex flex-col gap-3 pb-4">
        <ProfileCard />
        <PreferencesCard />

        <GroupHeading>Stats</GroupHeading>
        <StatsPanel active={active} />

        <GroupHeading>More</GroupHeading>
        <MoreCard onNotice={showNotice} />
      </div>

      <Toast
        message={lastNotice}
        isVisible={notice !== null}
        onClose={() => setNotice(null)}
        aboveTabBar
      />
    </div>
  );
};

export default SettingsPanel;
