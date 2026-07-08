# Daily Reminder Notifications (8 AM local)

A local notification fires at 8:00 AM in the user's timezone with themed copy for that day's puzzle ("Today's theme is Science — build your timeline!"). iOS Capacitor app only — no web push, no server.

## Design

**Local, not remote push.** The daily theme is deterministic from the date (`src/utils/dailyTheme.ts`), so future days' copy can be pre-computed on-device. `@capacitor/local-notifications` schedules them; iOS (`UNUserNotificationCenter`) delivers them even when the app is terminated or force-quit. No APNs keys, entitlements, subscription store, or cron sender.

**Rolling 14-day window.** `resyncDailyReminders()` (in `src/utils/dailyReminder.ts`) cancels our pending IDs (9000–9013; 9099 is the dev test shot) and re-schedules the next 14 local 8 AMs, each with per-day themed copy. Today's slot is dropped once `hasPlayedToday()`. Resync is idempotent and runs on app launch, `appResume`, and `gameOver` (wired in `App.tsx`). A user who stops opening the app stops being nagged after 14 days — intentional.

**Puzzle-date subtlety:** the daily is seeded by the **UTC** date, so copy is computed from the UTC date _at the fire instant_ (`fireAt.toISOString()`), not the local calendar date — at 8 AM local in UTC+ timezones these differ.

**Permission strategy (one-shot prompt).** iOS shows the notification-permission dialog exactly once, ever; a denial is permanent (Settings-app only). So:

- **Never prompted at launch** — resync only schedules if permission is already granted.
- **Priming card** (`src/components/DailyReminderPrompt.tsx`) in the daily game-over popup: "Remind me" fires the real dialog; "Not now" costs nothing and re-offers after 7 days, max 3 times (`shouldShowReminderPriming` in `playerStorage.ts`).
- **Intent defaults to ON** (`when-daily-reminder` != '0'); the burger-menu row (`DailyReminderMenuItem` in `Menu.tsx`) is the opt-out and the recovery path after a denial.

**Version skew (remote-URL shell).** The app is a WKWebView loading play-when.com, so this JS runs inside old app binaries without the plugin. Everything gates on `isDailyReminderSupported()` (`isNativePlatform && isPluginAvailable('LocalNotifications')`) — on web and old shells the UI doesn't render and calls no-op. Web JS can deploy before the new binary ships.

**Tap → deep link.** `localNotificationActionPerformed` (registered in `App.tsx`) navigates to `/daily`, which auto-starts the daily and bounces home if already played. Cold-start taps are retained by the plugin and delivered once the listener registers.

## Key files

| File                                     | Purpose                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `src/utils/dailyReminder.ts`             | Core: guards, pure date/copy helpers, permission, resync, test fire    |
| `src/utils/playerStorage.ts`             | `when-daily-reminder` intent + `when-reminder-priming` dismissal state |
| `src/hooks/useDailyReminder.ts`          | Shared state for the two UI surfaces                                   |
| `src/components/DailyReminderPrompt.tsx` | Priming card (daily game-over popup)                                   |
| `src/components/Menu.tsx`                | `DailyReminderMenuItem` toggle row                                     |
| `src/pages/ReminderPreview.tsx`          | Admin harness at `/reminder-preview` (unlinked)                        |
| `capacitor.config.ts`                    | `LocalNotifications.presentationOptions: []` (no foreground banner)    |

## Testing

- Unit tests: `src/utils/dailyReminder.test.ts` (`CI=true npm test`).
- `/reminder-preview` (unlinked route): 14-day copy table + priming-card preview on web; on the native build also permission state, "fire test notification in 10s" (background the app to see it), resync, and a pending-schedule dump.
- Simulator supports local notifications; no Info.plist/entitlement changes were needed.

## Shipping

Web changes deploy via Vercel as usual. The plugin itself required `npm i @capacitor/local-notifications` + `npx cap sync ios` + an Xcode rebuild — users must update the app from the App Store before the reminder features light up for them.
