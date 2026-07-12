import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clipboard,
  Download,
  RotateCcw,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  SkipForward,
} from 'lucide-react';
import { loadAllEventsUnfiltered } from '../utils/eventLoader';
import { preloadEventImages } from '../utils/preloadImage';
import {
  getDecisions,
  setDecision,
  clearDecision,
  clearAllDecisions,
  getLastPosition,
  setLastPosition,
  DedupDecisions,
} from '../utils/dedupStorage';
import { useTheme } from '../hooks/useTheme';
import { ClusterCard, ClusterMember } from './DedupClusterCard';

/**
 * Dev-only duplicate-resolution jig (route: /admin/dedup, not linked from any nav). Loads
 * clusters of same-event duplicates from `public/dedup/clusters.json` (built by
 * scripts/build-dedup-clusters.js) and shows them one at a time, letting me pick which
 * event(s) to KEEP or mark the whole cluster "not a duplicate". Decisions and the current
 * position persist in localStorage and can be exported as a delete-list of event ids.
 *
 * NOTE: this only records decisions — it never edits the event JSON. Acting on the
 * exported delete-list is a separate, deliberate step.
 */

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

/** The `{ name, file }` records marked for deletion under the current decisions. */
function computeDeleteList(
  clusters: ClusterMember[][],
  decisions: DedupDecisions
): Array<{ name: string; file: string | null }> {
  const out: Array<{ name: string; file: string | null }> = [];
  clusters.forEach((members, index) => {
    // eslint-disable-next-line security/detect-object-injection
    const decision = decisions[index];
    if (!decision || decision.kind !== 'keep') return;
    for (const member of members) {
      if (!decision.keep.includes(member.name)) {
        out.push({ name: member.name, file: member.event?.sourceFile ?? null });
      }
    }
  });
  return out;
}

const AdminDedup: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [clusters, setClusters] = useState<ClusterMember[][] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<DedupDecisions>({});
  // Index of the single cluster currently on screen. Only this cluster's images render,
  // which keeps the page fast (vs. mounting all ~1,000 images at once).
  const [pos, setPos] = useState(0);
  const [jump, setJump] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  // Load clusters.json + join with the (unfiltered) event data by name.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res, events] = await Promise.all([
          fetch('/dedup/clusters.json'),
          loadAllEventsUnfiltered(),
        ]);
        if (!res.ok) throw new Error(`clusters.json returned ${res.status}`);
        const names: string[][] = await res.json();
        const byName = new Map(events.map((e) => [e.name, e]));
        const joined: ClusterMember[][] = names.map((cluster) =>
          cluster.map((name) => ({ name, event: byName.get(name) }))
        );
        if (!cancelled) {
          setClusters(joined);
          // Resume where I left off (clamped in case clusters.json shrank).
          setPos(Math.min(getLastPosition(), Math.max(0, joined.length - 1)));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load clusters.json');
        }
      }
    })();
    setDecisions(getDecisions());
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the viewing position so a reload resumes on the same cluster.
  useEffect(() => {
    if (clusters) setLastPosition(pos);
  }, [pos, clusters]);

  const total = clusters?.length ?? 0;

  const go = useCallback(
    (i: number) => setPos((p) => (total ? Math.max(0, Math.min(total - 1, i)) : p)),
    [total]
  );

  // Advance to the next cluster with no decision (wrapping once). `decs` is passed in so
  // callers can advance based on a just-updated decision map, not the stale closure.
  const advanceUnresolved = useCallback(
    (from: number, decs: DedupDecisions) => {
      if (!clusters) return;
      for (let i = from + 1; i < clusters.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        if (!decs[i]) return setPos(i);
      }
      for (let i = 0; i <= from; i++) {
        // eslint-disable-next-line security/detect-object-injection
        if (!decs[i]) return setPos(i);
      }
      // Nothing pending — stay put.
    },
    [clusters]
  );

  // Arrow keys step between clusters (ignored while typing in the jump box).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') go(pos - 1);
      else if (e.key === 'ArrowRight') go(pos + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pos, go]);

  // Warm the next cluster's thumbnails so forward nav feels instant.
  useEffect(() => {
    if (!clusters) return;
    // eslint-disable-next-line security/detect-object-injection
    const nextCluster = clusters[pos + 1];
    if (nextCluster) preloadEventImages(nextCluster.map((m) => m.event), ['thumbnail']);
  }, [pos, clusters]);

  const counts = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const values = clusters ? clusters.map((_, i) => decisions[i]) : [];
    const resolved = values.filter((d) => d?.kind === 'keep').length;
    const passed = values.filter((d) => d?.kind === 'pass').length;
    const pending = total - resolved - passed;
    const deleteCount = clusters ? computeDeleteList(clusters, decisions).length : 0;
    return { resolved, passed, pending, deleteCount };
  }, [clusters, decisions, total]);

  const toggleKeep = (name: string) => {
    // eslint-disable-next-line security/detect-object-injection
    const current = decisions[pos];
    const keptNow = current?.kind === 'keep' ? current.keep : [];
    const next = keptNow.includes(name)
      ? keptNow.filter((n) => n !== name)
      : [...keptNow, name];
    // Unchecking the last keeper returns the cluster to pending.
    setDecisions(
      next.length === 0 ? clearDecision(pos) : setDecision(pos, { kind: 'keep', keep: next })
    );
  };

  // Pass = "not a duplicate" (nothing deleted). Auto-advance to the next unresolved
  // cluster, since dismissing a false positive is a terminal action for that cluster.
  const passCluster = () => {
    const updated = setDecision(pos, { kind: 'pass' });
    setDecisions(updated);
    advanceUnresolved(pos, updated);
  };

  const resetCluster = () => setDecisions(clearDecision(pos));

  const resetAll = () => {
    if (window.confirm('Reset ALL dedup decisions? This cannot be undone.')) {
      setDecisions(clearAllDecisions());
    }
  };

  const doJump = () => {
    const n = parseInt(jump, 10);
    if (Number.isFinite(n)) go(n - 1); // input is 1-based
    setJump('');
  };

  const doExport = async () => {
    if (!clusters) return;
    const list = computeDeleteList(clusters, decisions);
    await copyToClipboard(JSON.stringify(list, null, 2));
    setCopied(list.length);
    setTimeout(() => setCopied(null), 2000);
  };

  const doDownload = () => {
    if (!clusters) return;
    const list = computeDeleteList(clusters, decisions);
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dedup-delete-list.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const done = counts.resolved + counts.passed;
  // eslint-disable-next-line security/detect-object-injection
  const current = clusters ? clusters[pos] : undefined;

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg text-text pb-safe">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-border bg-surface p-2 text-text transition-colors hover:bg-border active:scale-95"
              aria-label="Back to app"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-text">Dedup Review</h1>
              <p className="font-mono text-xs text-text/50">dev tool · saves to this browser</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-border bg-surface p-2 text-text transition-colors hover:bg-border active:scale-95"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Summary bar (sticky) */}
        <div className="sticky top-0 z-10 mb-4 rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm">
            <span className="text-text/60">
              <span className="font-bold text-text">{total}</span> clusters
            </span>
            <span className="text-accent">
              <span className="font-bold">{counts.resolved}</span> resolved
            </span>
            <span className="text-text/60">
              <span className="font-bold text-text">{counts.passed}</span> passed
            </span>
            <span className="text-amber-500">
              <span className="font-bold">{counts.pending}</span> pending
            </span>
            <span className="text-red-500">
              <span className="font-bold">{counts.deleteCount}</span> to delete
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={doExport}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95"
            >
              <Clipboard className="h-4 w-4" />
              {copied !== null ? `Copied ${copied} ids` : 'Export (copy)'}
            </button>
            <button
              onClick={doDownload}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-border active:scale-95"
            >
              <Download className="h-4 w-4" /> Download .json
            </button>
            <button
              onClick={resetAll}
              className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text/70 transition-colors hover:bg-border active:scale-95"
            >
              <RotateCcw className="h-4 w-4" /> Reset all
            </button>
          </div>
        </div>

        {/* Body */}
        {loadError ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6">
            <p className="font-mono text-sm text-red-500">Failed to load clusters: {loadError}</p>
            <p className="mt-2 font-mono text-xs text-text/60">
              Run <code>node scripts/build-dedup-clusters.js</code> to generate{' '}
              <code>public/dedup/clusters.json</code>, then reload.
            </p>
          </div>
        ) : !clusters ? (
          <p className="font-mono text-sm text-text/60">Loading clusters…</p>
        ) : total === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="font-display text-xl font-bold text-text">No clusters found</h2>
            <p className="mt-2 font-mono text-sm text-text/60">clusters.json is empty.</p>
          </div>
        ) : (
          <>
            {/* Navigation */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => go(pos - 1)}
                disabled={pos === 0}
                className="flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text transition-colors hover:bg-border active:scale-95 disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" /> Prev
              </button>

              <div className="flex items-center gap-2 font-mono text-sm text-text/70">
                <span>Cluster</span>
                <input
                  type="number"
                  min={1}
                  max={total}
                  value={jump}
                  placeholder={String(pos + 1)}
                  onChange={(e) => setJump(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doJump()}
                  onBlur={doJump}
                  className="w-16 rounded-lg border border-border bg-bg px-2 py-1 text-center text-text focus:border-accent focus:outline-none"
                  aria-label="Jump to cluster number"
                />
                <span>/ {total}</span>
              </div>

              <button
                onClick={() => go(pos + 1)}
                disabled={pos === total - 1}
                className="flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text transition-colors hover:bg-border active:scale-95 disabled:opacity-40"
              >
                Next <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex justify-center">
              <button
                onClick={() => advanceUnresolved(pos, decisions)}
                disabled={counts.pending === 0}
                className="flex items-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent/20 active:scale-95 disabled:opacity-40"
              >
                <SkipForward className="h-4 w-4" /> Next unresolved
              </button>
            </div>

            {current && (
              <ClusterCard
                index={pos}
                total={total}
                members={current}
                // eslint-disable-next-line security/detect-object-injection
                decision={decisions[pos]}
                onToggleKeep={toggleKeep}
                onPass={passCluster}
                onReset={resetCluster}
              />
            )}

            {counts.pending === 0 && (
              <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/5 p-4 text-center">
                <p className="font-display text-lg font-bold text-text">All clusters resolved 🎉</p>
                <p className="mt-1 font-mono text-sm text-text/60">
                  Export the delete-list from the bar above.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDedup;
