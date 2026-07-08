import React, { useCallback, useEffect, useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import DailyReminderPrompt from '../components/DailyReminderPrompt';
import {
  REMINDER_WINDOW_DAYS,
  getNext8amDates,
  getPendingReminders,
  getReminderCopy,
  getReminderPermissionState,
  isDailyReminderSupported,
  requestReminderPermission,
  resyncDailyReminders,
  scheduleTestReminder,
  ReminderPermissionState,
} from '../utils/dailyReminder';
import { resetReminderPriming } from '../utils/playerStorage';

/**
 * Dev-only harness (route: /reminder-preview, unlinked) for the daily 8am
 * reminder notifications. Reviews the exact themed copy for the next 14 days
 * (works on web — the copy helpers are pure), previews the priming card, and
 * on the native app exercises the real plugin: permission, test fire, resync,
 * and a dump of the actually-pending scheduled notifications.
 */
const ReminderPreview: React.FC = () => {
  const isNative = isDailyReminderSupported();

  const [permission, setPermission] = useState<ReminderPermissionState | 'n/a'>('n/a');
  const [pending, setPending] = useState<{ id: number; title: string; at?: string }[]>([]);
  const [status, setStatus] = useState('');
  const [primingKey, setPrimingKey] = useState(0);

  const refresh = useCallback(async () => {
    if (!isNative) return;
    setPermission(await getReminderPermissionState());
    setPending(await getPendingReminders());
  }, [isNative]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const slots = getNext8amDates(REMINDER_WINDOW_DAYS);

  const nativeBtn = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={!isNative}
      className="min-h-[44px] px-4 rounded-lg border border-border bg-surface text-text font-body text-sm hover:bg-border/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-bg text-text px-4 py-6 font-body">
      <div className="mx-auto max-w-lg space-y-8">
        <header className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-display font-bold">Reminder Preview</h1>
        </header>

        {/* Priming card as it appears in the daily game-over popup */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-2">Priming card</h2>
          <div className="rounded-lg border border-border bg-surface px-4 pb-4">
            <DailyReminderPrompt key={primingKey} forceVisible />
          </div>
          <button
            onClick={() => {
              resetReminderPriming();
              setPrimingKey((k) => k + 1);
              setStatus('Priming state cleared');
            }}
            className="mt-2 min-h-[44px] px-4 rounded-lg border border-border text-text-muted text-sm hover:bg-border/50 transition-colors"
          >
            Reset priming state
          </button>
        </section>

        {/* Real plugin controls — native app only */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-display font-semibold">Native controls</h2>
            <button
              onClick={refresh}
              disabled={!isNative}
              aria-label="Refresh"
              className="disabled:opacity-40"
            >
              <RefreshCw className="w-4 h-4 text-text-muted" />
            </button>
          </div>
          {!isNative && (
            <p className="text-sm text-text-muted mb-2">
              Not available here — open this page inside the iOS app (requires the
              LocalNotifications plugin build).
            </p>
          )}
          <p className="text-sm mb-3">
            Permission: <span className="font-mono">{permission}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {nativeBtn('Request permission', async () => {
              const granted = await requestReminderPermission();
              setStatus(granted ? 'Permission granted' : 'Permission denied');
              refresh();
            })}
            {nativeBtn('Fire test notification in 10s', async () => {
              await scheduleTestReminder(10);
              setStatus('Test scheduled — background the app (Cmd+Shift+H) and wait 10s');
              refresh();
            })}
            {nativeBtn('Resync now', async () => {
              await resyncDailyReminders();
              setStatus('Resynced');
              refresh();
            })}
          </div>
          {status && <p className="mt-2 text-sm text-accent">{status}</p>}

          <h3 className="text-base font-display font-semibold mt-4 mb-1">
            Pending scheduled ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <p className="text-sm text-text-muted">None</p>
          ) : (
            <ul className="text-sm font-mono space-y-1">
              {pending.map((n) => (
                <li key={n.id}>
                  #{n.id} · {n.at ?? '?'} · {n.title}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Copy for the next 14 days — pure helpers, works on web */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-2">
            Next {REMINDER_WINDOW_DAYS} days of copy
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            {slots.map((fireAt) => {
              const copy = getReminderCopy(fireAt);
              return (
                <div
                  key={fireAt.getTime()}
                  className="px-3 py-2 border-b border-border last:border-b-0 bg-surface"
                >
                  <p className="text-xs text-text-muted font-mono">
                    fires {fireAt.toLocaleString()} · puzzle {fireAt.toISOString().split('T')[0]}
                  </p>
                  <p className="text-sm font-semibold">{copy.title}</p>
                  <p className="text-sm text-text-muted">{copy.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReminderPreview;
