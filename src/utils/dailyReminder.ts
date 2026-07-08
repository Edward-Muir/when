/**
 * Daily-puzzle reminder notifications (iOS Capacitor app only).
 *
 * Schedules a rolling window of local notifications at 8:00 AM in the user's
 * local timezone, one per day, with per-day themed copy (the daily theme is
 * deterministic from the date, so future days can be computed ahead of time).
 * The OS delivers them even when the app is closed; the app only needs to be
 * opened occasionally so the window can be topped back up via resync.
 *
 * The native app is a WKWebView loading play-when.com, so this JS also runs
 * inside already-shipped app binaries that predate the LocalNotifications
 * plugin — every plugin call is gated on isDailyReminderSupported().
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getDailyTheme, getThemeDisplayName } from './dailyTheme';
import { hasPlayedToday, isDailyReminderEnabled, setDailyReminderEnabled } from './playerStorage';

export const REMINDER_HOUR = 8; // 8:00 AM local time

/** Rolling window length; well under iOS's 64-pending-notification cap. */
export const REMINDER_WINDOW_DAYS = 14;

/** Our notification IDs: 9000..9013 for the window, 9099 for the dev test shot. */
const REMINDER_ID_BASE = 9000;
const REMINDER_ID_MAX = 9099;
const TEST_REMINDER_ID = 9099;

export type ReminderPermissionState = 'granted' | 'denied' | 'prompt';

export function isDailyReminderSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications');
}

// --- Pure helpers (no plugin calls — unit-tested) ---

/**
 * The next `count` local-time 8:00 AMs, starting with today's if it hasn't
 * passed yet. Uses local-calendar arithmetic so each fire time is 8:00 AM
 * wall-clock even across DST changes.
 */
export function getNext8amDates(count: number, now: Date = new Date()): Date[] {
  const todayAt8 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    REMINDER_HOUR,
    0,
    0,
    0
  );
  const startOffset = now.getTime() < todayAt8.getTime() ? 0 : 1;

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + startOffset + i,
        REMINDER_HOUR,
        0,
        0,
        0
      )
    );
  }
  return dates;
}

/**
 * Notification copy for a reminder firing at `fireAt`. The puzzle date is the
 * UTC date AT THE FIRE INSTANT — at 8am local this can differ from the local
 * calendar date (e.g. UTC+10 mornings are already "tomorrow" in UTC), and the
 * puzzle/theme are seeded by the UTC date.
 */
export function getReminderCopy(fireAt: Date): { title: string; body: string } {
  const puzzleDate = fireAt.toISOString().split('T')[0];
  const themeName = getThemeDisplayName(getDailyTheme(puzzleDate));
  return {
    title: 'Today’s daily puzzle is ready',
    body: `Today’s theme is ${themeName} — build your timeline!`,
  };
}

// --- Plugin-facing API (all no-ops when unsupported) ---

/** Current OS notification permission. Never triggers the system prompt. */
export async function getReminderPermissionState(): Promise<ReminderPermissionState> {
  if (!isDailyReminderSupported()) return 'denied';
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'denied';
  }
}

/**
 * Fire the one-shot iOS permission dialog. iOS shows this exactly once, ever —
 * only call it from an explicit user action (priming card / menu row), never
 * at launch.
 */
export async function requestReminderPermission(): Promise<boolean> {
  if (!isDailyReminderSupported()) return false;
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

async function cancelOurPending(): Promise<void> {
  const { notifications } = await LocalNotifications.getPending();
  const ours = notifications.filter(
    (n) => n.id >= REMINDER_ID_BASE && n.id <= REMINDER_ID_MAX && n.id !== TEST_REMINDER_ID
  );
  if (ours.length > 0) {
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  }
}

/**
 * Idempotent top-up of the rolling reminder window. Safe to over-call: runs on
 * launch, resume and game over. Schedules only when the user hasn't opted out
 * AND permission is already granted (never prompts). Today's slot is dropped
 * once today's daily has been played.
 */
export async function resyncDailyReminders(): Promise<void> {
  if (!isDailyReminderSupported()) return;
  try {
    if (!isDailyReminderEnabled()) return;
    if ((await getReminderPermissionState()) !== 'granted') return;

    await cancelOurPending();

    const todayPuzzleDate = new Date().toISOString().split('T')[0];
    const slots = getNext8amDates(REMINDER_WINDOW_DAYS).filter(
      (fireAt) => !(hasPlayedToday() && fireAt.toISOString().split('T')[0] === todayPuzzleDate)
    );

    await LocalNotifications.schedule({
      notifications: slots.map((fireAt, i) => ({
        id: REMINDER_ID_BASE + i,
        ...getReminderCopy(fireAt),
        schedule: { at: fireAt },
        extra: { route: '/daily' },
      })),
    });
  } catch {
    console.warn('Failed to resync daily reminders');
  }
}

/** Opt out: cancel everything pending and persist the user's choice. */
export async function disableDailyReminders(): Promise<void> {
  setDailyReminderEnabled(false);
  if (!isDailyReminderSupported()) return;
  try {
    await cancelOurPending();
  } catch {
    console.warn('Failed to cancel daily reminders');
  }
}

/**
 * Dev/admin helper (/reminder-preview): fire a one-off reminder shortly from
 * now so delivery and tap-through can be tested without waiting for 8am.
 */
export async function scheduleTestReminder(secondsFromNow: number): Promise<void> {
  if (!isDailyReminderSupported()) return;
  const fireAt = new Date(Date.now() + secondsFromNow * 1000);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_REMINDER_ID,
        ...getReminderCopy(fireAt),
        schedule: { at: fireAt },
        extra: { route: '/daily' },
      },
    ],
  });
}

/** Pending notifications in our ID range, for the /reminder-preview dump. */
export async function getPendingReminders(): Promise<{ id: number; title: string; at?: string }[]> {
  if (!isDailyReminderSupported()) return [];
  const { notifications } = await LocalNotifications.getPending();
  return notifications
    .filter((n) => n.id >= REMINDER_ID_BASE && n.id <= REMINDER_ID_MAX)
    .sort((a, b) => a.id - b.id)
    .map((n) => ({
      id: n.id,
      title: n.title ?? '',
      at: n.schedule?.at ? new Date(n.schedule.at).toLocaleString() : undefined,
    }));
}
