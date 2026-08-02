import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, RefreshCw } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { loadAllEvents } from '../utils/eventLoader';
import { getImageUrl } from '../utils/cloudinaryImage';
import { formatYear } from '../utils/gameLogic';
import { REPORT_REASONS, ReportReasonId } from '../utils/cardReport';

/**
 * Hidden maintainer tool (route: /card-reports, not linked from any nav) listing
 * the cards players have flagged via the "Report an issue" row in the card detail
 * popup. The API stores only an event id and a reason id, so the full card is
 * joined back in here from the event data.
 */

interface ReportCount {
  eventName: string;
  count: number;
}

interface RecentReport {
  eventName: string;
  reason: string;
  timestamp: number;
  appVersion: string;
}

function reasonLabel(id: string): string {
  const match = REPORT_REASONS.find((r) => r.id === (id as ReportReasonId));
  return match ? match.label : id;
}

function formatWhen(timestamp: number): string {
  if (!timestamp) return 'unknown';
  return new Date(timestamp).toLocaleString();
}

// The REPORTS_ADMIN_KEY shared secret, kept so the page works from a bare
// bookmark. Wrapped per the playerStorage.ts convention — storage can throw.
const ADMIN_KEY_STORAGE = 'when-reports-key';

function getStoredKey(): string {
  try {
    return localStorage.getItem(ADMIN_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function storeKey(key: string): void {
  try {
    if (key) localStorage.setItem(ADMIN_KEY_STORAGE, key);
    else localStorage.removeItem(ADMIN_KEY_STORAGE);
  } catch {
    console.warn('Failed to save reports admin key to localStorage');
  }
}

/** The server's message when REPORTS_ADMIN_KEY is missing, as opposed to wrong. */
const NOT_CONFIGURED = 'Reports admin key not configured';

type EventLookup = Map<string, HistoricalEvent>;

function ReportedCardsList({
  counts,
  eventsById,
  reasonsByEvent,
}: {
  counts: ReportCount[];
  eventsById: EventLookup;
  reasonsByEvent: Map<string, string[]>;
}) {
  return (
    <>
      <p className="text-text-muted font-body text-sm mb-3">
        {counts.length} {counts.length === 1 ? 'card' : 'cards'} reported · most reported first
      </p>
      <ul className="space-y-2">
        {counts.map(({ eventName, count }) => {
          const event = eventsById.get(eventName);
          const reasons = reasonsByEvent.get(eventName) || [];
          return (
            <li
              key={eventName}
              className="flex gap-3 items-center rounded-xl border border-border bg-surface p-3"
            >
              <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-border/30 flex items-center justify-center">
                {event?.image_url ? (
                  <img
                    src={getImageUrl(event.image_url, 'thumbnail')}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Flag className="w-5 h-5 text-text-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body font-semibold text-sm truncate">
                  {event ? event.friendly_name : eventName}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {event ? `${formatYear(event.year)} · ${event.category}` : 'unknown card'}
                </p>
                <p className="font-mono text-xs text-text-muted truncate">{eventName}</p>
                {reasons.length > 0 && (
                  <p className="font-body text-xs text-text-muted mt-1 truncate">
                    {reasons.join(', ')}
                  </p>
                )}
              </div>
              <span className="font-mono font-bold text-lg text-accent shrink-0">{count}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function RecentReportsList({
  recent,
  eventsById,
}: {
  recent: RecentReport[];
  eventsById: EventLookup;
}) {
  return (
    <>
      <h2 className="font-display font-semibold text-base mt-6 mb-2">Recent</h2>
      <ul className="space-y-1">
        {recent.map((report, i) => {
          const event = eventsById.get(report.eventName);
          return (
            <li
              key={`${report.eventName}-${report.timestamp}-${i}`}
              className="font-body text-xs text-text-muted border-b border-border py-1.5"
            >
              <span className="text-text">{event ? event.friendly_name : report.eventName}</span> —{' '}
              {reasonLabel(report.reason)} · {formatWhen(report.timestamp)}
              {report.appVersion && ` · v${report.appVersion}`}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function AdminKeyForm({
  notConfigured,
  onSave,
}: {
  notConfigured: boolean;
  onSave: (key: string) => void;
}) {
  const [value, setValue] = useState('');
  const stored = getStoredKey();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        storeKey(trimmed);
        onSave(trimmed);
        setValue('');
      }}
      className="rounded-xl border border-border bg-surface px-4 py-4"
    >
      <label htmlFor="admin-key" className="font-body text-sm font-semibold block">
        Admin key
      </label>
      <p className="font-body text-xs text-text-muted mt-1 mb-3">
        {notConfigured
          ? 'REPORTS_ADMIN_KEY is not set on the server, so reports cannot be read yet. Add it in the Vercel project settings for Production and Preview.'
          : 'Reading reports needs the REPORTS_ADMIN_KEY value from the Vercel project settings.'}
      </p>
      <input
        id="admin-key"
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2 font-mono text-sm text-text"
      />
      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-accent text-white font-body font-semibold text-sm hover:bg-accent/90 active:scale-95 transition-colors"
        >
          Save key
        </button>
        {stored && (
          <button
            type="button"
            onClick={() => {
              storeKey('');
              onSave('');
            }}
            className="px-4 py-2 rounded-xl bg-surface border border-border font-body text-sm hover:bg-border active:scale-95 transition-colors"
          >
            Forget key
          </button>
        )}
      </div>
    </form>
  );
}

const CardReports: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<ReportCount[] | null>(null);
  const [recent, setRecent] = useState<RecentReport[]>([]);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [needsKey, setNeedsKey] = useState(false);

  // A key can arrive as ?key=… for a first visit. Stash it and strip the query
  // so the secret doesn't linger in the address bar, history or browser sync.
  const [adminKey, setAdminKey] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('key');
    if (fromUrl) {
      storeKey(fromUrl);
      return fromUrl;
    }
    return getStoredKey();
  });

  useEffect(() => {
    if (window.location.search) navigate('/card-reports', { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNeedsKey(false);

    Promise.all([
      fetch('/api/card-reports/list', {
        cache: 'no-store',
        headers: adminKey ? { 'x-admin-key': adminKey } : undefined,
      }).then(async (res) => {
        const data = await res.json();
        if (res.status === 401 || res.status === 503) {
          if (!cancelled) setNeedsKey(true);
          throw new Error(data.error || 'Unauthorized');
        }
        if (!res.ok) throw new Error(data.error || 'Failed to load reports');
        return data;
      }),
      loadAllEvents(),
    ])
      .then(([data, allEvents]) => {
        if (cancelled) return;
        setCounts(data.counts || []);
        setRecent(data.recent || []);
        setEvents(allEvents);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, adminKey]);

  const eventsById = useMemo(() => {
    const map = new Map<string, HistoricalEvent>();
    for (const event of events) map.set(event.name, event);
    return map;
  }, [events]);

  // Reason breakdown per card, derived from the recent log.
  const reasonsByEvent = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const report of recent) {
      const existing = map.get(report.eventName) || [];
      existing.push(reasonLabel(report.reason));
      map.set(report.eventName, existing);
    }
    return map;
  }, [recent]);

  const ready = !loading && !error && counts !== null;
  const showKeyForm = needsKey && !loading;
  const showError = !!error && !needsKey;

  return (
    <div className="min-h-dvh bg-bg text-text">
      <div className="sticky top-0 z-10 bg-bg border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-border transition-colors"
          aria-label="Back to game"
        >
          <ArrowLeft className="w-5 h-5 text-text" />
        </button>
        <h1 className="font-display font-semibold text-lg flex-1">Card reports</h1>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="p-2 rounded-xl bg-surface border border-border hover:bg-border transition-colors active:scale-95"
          aria-label="Reload reports"
        >
          <RefreshCw className="w-5 h-5 text-text" />
        </button>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        {loading && <p className="text-text-muted font-body">Loading…</p>}

        {showKeyForm && (
          <AdminKeyForm notConfigured={error === NOT_CONFIGURED} onSave={setAdminKey} />
        )}

        {showError && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3">
            <p className="font-body text-sm text-text">{error}</p>
            <p className="font-body text-xs text-text-muted mt-1">
              The API needs Upstash Redis credentials — run with <code>vercel dev</code> locally.
            </p>
          </div>
        )}

        {ready && counts.length === 0 && (
          <p className="text-text-muted font-body">No reports yet.</p>
        )}

        {ready && counts.length > 0 && (
          <ReportedCardsList
            counts={counts}
            eventsById={eventsById}
            reasonsByEvent={reasonsByEvent}
          />
        )}

        {ready && recent.length > 0 && (
          <RecentReportsList recent={recent} eventsById={eventsById} />
        )}
      </div>
    </div>
  );
};

export default CardReports;
