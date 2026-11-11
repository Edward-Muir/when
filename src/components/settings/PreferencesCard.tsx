import React, { useState } from 'react';
import { Bell, HelpCircle, Moon } from 'lucide-react';
import { useDailyReminder } from '../../hooks/useDailyReminder';
import { useTheme } from '../../hooks/useTheme';
import HowToPlayModal from '../HowToPlayModal';
import { RowCard, RowChevron, RowSwitch, rowClass, rowIconClass } from './rows';

/**
 * The daily-reminder switch (native app only). "On" means it will actually fire: the player's
 * choice AND the OS permission. This row is both the opt-out and the way back after a denial.
 */
const DailyReminderRow: React.FC = () => {
  const reminder = useDailyReminder();
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  if (!reminder.isSupported) return null;

  const reminderOn = reminder.enabled && reminder.permission === 'granted';

  const handleToggle = () => {
    if (reminderOn) {
      reminder.disable();
    } else if (reminder.permission === 'denied') {
      setShowSettingsHint(true);
    } else if (reminder.permission === 'granted') {
      reminder.enable();
    } else {
      reminder.requestAndEnable();
    }
  };

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={reminderOn}
        onClick={handleToggle}
        className={rowClass}
      >
        <Bell className={rowIconClass} />
        <span>
          Daily reminder
          <span className="block text-sm text-text-muted">8 AM, when the new puzzle is ready</span>
        </span>
        <RowSwitch on={reminderOn} />
      </button>
      {showSettingsHint && (
        <p className="px-4 pb-3 text-sm text-text-muted font-body">
          Notifications are off for When? — enable them in iOS Settings.
        </p>
      )}
    </div>
  );
};

/** The settings a player changes: dark mode, the daily reminder, and the rules. */
const PreferencesCard: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [showRules, setShowRules] = useState(false);

  return (
    <>
      <RowCard>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className={rowClass}
        >
          <Moon className={rowIconClass} />
          <span>Dark mode</span>
          <RowSwitch on={isDark} />
        </button>

        <DailyReminderRow />

        <button type="button" onClick={() => setShowRules(true)} className={rowClass}>
          <HelpCircle className={rowIconClass} />
          <span>How to Play</span>
          <RowChevron />
        </button>
      </RowCard>

      <HowToPlayModal open={showRules} onDismiss={() => setShowRules(false)} />
    </>
  );
};

export default PreferencesCard;
