import { useCallback, useEffect, useState } from 'react';
import {
  ReminderPermissionState,
  disableDailyReminders,
  getReminderPermissionState,
  isDailyReminderSupported,
  requestReminderPermission,
  resyncDailyReminders,
} from '../utils/dailyReminder';
import { isDailyReminderEnabled, setDailyReminderEnabled } from '../utils/playerStorage';

/**
 * Shared state for the two daily-reminder surfaces (priming card in the daily
 * game-over popup, management row in the burger menu). Mirrors useHaptics'
 * shape: callers check isSupported and render nothing on web/old app shells.
 */
export function useDailyReminder() {
  const isSupported = isDailyReminderSupported();

  const [enabled, setEnabled] = useState(isDailyReminderEnabled);
  const [permission, setPermission] = useState<ReminderPermissionState>('prompt');

  useEffect(() => {
    if (!isSupported) return;
    getReminderPermissionState().then(setPermission);
  }, [isSupported]);

  /**
   * Spend the one-shot iOS permission dialog (only call from a user action).
   * On grant, enables the reminder and schedules the window.
   */
  const requestAndEnable = useCallback(async (): Promise<boolean> => {
    const granted = await requestReminderPermission();
    setPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setDailyReminderEnabled(true);
      setEnabled(true);
      await resyncDailyReminders();
    }
    return granted;
  }, []);

  /** Re-enable without prompting (permission already granted). */
  const enable = useCallback(async () => {
    setDailyReminderEnabled(true);
    setEnabled(true);
    await resyncDailyReminders();
  }, []);

  const disable = useCallback(async () => {
    setEnabled(false);
    await disableDailyReminders();
  }, []);

  return { isSupported, enabled, permission, requestAndEnable, enable, disable };
}
