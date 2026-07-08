import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { recordPrimingDismissed, shouldShowReminderPriming } from '../utils/playerStorage';

interface DailyReminderPromptProps {
  /** Dev/preview (/reminder-preview): render regardless of platform and dismissal state. */
  forceVisible?: boolean;
}

/**
 * Pre-permission priming card shown in the daily game-over popup. Asks in-app
 * first ("Remind me" / "Not now") so the one-shot iOS permission dialog is only
 * spent on users who already said yes. "Not now" starts a 7-day cooldown
 * (max 3 asks); once OS permission is granted or denied the card never returns.
 */
const DailyReminderPrompt: React.FC<DailyReminderPromptProps> = ({ forceVisible = false }) => {
  const { isSupported, enabled, permission, requestAndEnable } = useDailyReminder();

  // Evaluated once per mount so the card doesn't vanish mid-interaction.
  const [primingAllowed] = useState(shouldShowReminderPriming);
  const [outcome, setOutcome] = useState<'idle' | 'granted' | 'denied' | 'dismissed'>('idle');

  const eligible = isSupported && enabled && permission === 'prompt' && primingAllowed;
  if (!forceVisible && !eligible) return null;
  if (outcome === 'dismissed') return null;

  if (outcome === 'granted') {
    return (
      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border bg-bg px-4 py-3">
        <Check className="w-4 h-4 text-success flex-shrink-0" />
        <span className="text-sm text-text font-body">You’re set — see you at 8 AM!</span>
      </div>
    );
  }

  if (outcome === 'denied') {
    return (
      <p className="mt-4 text-center text-text-muted text-sm font-body">
        Notifications are off — enable them for When? in Settings to get reminders.
      </p>
    );
  }

  const handleRemindMe = async () => {
    const granted = await requestAndEnable();
    setOutcome(granted ? 'granted' : 'denied');
  };

  const handleNotNow = () => {
    recordPrimingDismissed();
    setOutcome('dismissed');
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-bg px-4 py-3">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-sm text-text font-body leading-snug">
          Get a reminder at 8 AM when tomorrow’s puzzle is ready?
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleRemindMe}
          className="flex-1 min-h-[44px] rounded-lg bg-accent text-white font-body font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Remind me
        </button>
        <button
          onClick={handleNotNow}
          className="flex-1 min-h-[44px] rounded-lg border border-border text-text-muted font-body text-sm hover:bg-border/50 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
};

export default DailyReminderPrompt;
