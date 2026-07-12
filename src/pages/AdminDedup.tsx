import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clipboard, Download, RotateCcw, Sun, Moon, Check } from 'lucide-react';
import { loadAllEventsUnfiltered, EventWithSource } from '../utils/eventLoader';
import { getImageUrl, isCloudinaryImage } from '../utils/cloudinaryImage';
import {
  getDecisions,
  setDecision,
  clearDecision,
  clearAllDecisions,
  DedupDecision,
  DedupDecisions,
} from '../utils/dedupStorage';
import { useTheme } from '../hooks/useTheme';

/**
 * Dev-only duplicate-resolution jig (route: /admin/dedup, only registered outside
 * production builds; not linked from any nav). Loads clusters of same-event duplicates
 * from `public/dedup/clusters.json` (built by scripts/build-dedup-clusters.js) and, per
 * cluster, lets me pick which event(s) to KEEP or mark the whole cluster "not a duplicate".
 * Decisions persist in localStorage and can be exported as a delete-list of event ids.
 *
 * NOTE: this only records decisions — it never edits the event JSON. Acting on the
 * exported delete-list is a separate, deliberate step.
 */

/** A single member of a cluster: the id from clusters.json plus joined event details. */
interface ClusterMember {
  name: string;
  event: EventWithSource | undefined;
}

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
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
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
        if (!cancelled) setClusters(joined);
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

  const counts = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const values = clusters ? clusters.map((_, i) => decisions[i]) : [];
    const resolved = values.filter((d) => d?.kind === 'keep').length;
    const passed = values.filter((d) => d?.kind === 'pass').length;
    const total = clusters?.length ?? 0;
    const pending = total - resolved - passed;
    const deleteCount = clusters ? computeDeleteList(clusters, decisions).length : 0;
    return { resolved, passed, pending, total, deleteCount };
  }, [clusters, decisions]);

  // Cluster indices to render, honoring the "unresolved only" filter.
  const visible = useMemo(() => {
    if (!clusters) return [];
    // eslint-disable-next-line security/detect-object-injection
    return clusters.map((_, i) => i).filter((i) => !unresolvedOnly || !decisions[i]);
  }, [clusters, decisions, unresolvedOnly]);

  const toggleKeep = (index: number, name: string) => {
    // eslint-disable-next-line security/detect-object-injection
    const current = decisions[index];
    const keptNow = current?.kind === 'keep' ? current.keep : [];
    const next = keptNow.includes(name)
      ? keptNow.filter((n) => n !== name)
      : [...keptNow, name];
    // Unchecking the last keeper returns the cluster to pending.
    setDecisions(
      next.length === 0
        ? clearDecision(index)
        : setDecision(index, { kind: 'keep', keep: next })
    );
  };

  const passCluster = (index: number) => {
    setDecisions(setDecision(index, { kind: 'pass' }));
  };

  const resetCluster = (index: number) => {
    setDecisions(clearDecision(index));
  };

  const resetAll = () => {
    if (window.confirm('Reset ALL dedup decisions? This cannot be undone.')) {
      setDecisions(clearAllDecisions());
    }
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

  return (
    <div className="min-h-screen bg-bg text-text">
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
              <p className="font-mono text-xs text-text/50">dev tool · /admin/dedup</p>
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
              <span className="font-bold text-text">{counts.total}</span> clusters
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
              <span className="font-bold">{counts.deleteCount}</span> marked for deletion
            </span>
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
            <label className="ml-auto flex cursor-pointer select-none items-center gap-2 text-sm text-text/70">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Unresolved only
            </label>
            <button
              onClick={resetAll}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text/70 transition-colors hover:bg-border active:scale-95"
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
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="font-display text-xl font-bold text-text">
              {unresolvedOnly ? 'All caught up 🎉' : 'No clusters found'}
            </h2>
            <p className="mt-2 font-mono text-sm text-text/60">
              {unresolvedOnly ? 'Every cluster has a decision.' : 'clusters.json is empty.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((index) => (
              <ClusterCard
                key={index}
                index={index}
                total={counts.total}
                // eslint-disable-next-line security/detect-object-injection
                members={clusters[index]}
                // eslint-disable-next-line security/detect-object-injection
                decision={decisions[index]}
                onToggleKeep={(name) => toggleKeep(index, name)}
                onPass={() => passCluster(index)}
                onReset={() => resetCluster(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ClusterCardProps {
  index: number;
  total: number;
  members: ClusterMember[];
  decision: DedupDecision | undefined;
  onToggleKeep: (name: string) => void;
  onPass: () => void;
  onReset: () => void;
}

const ClusterCard: React.FC<ClusterCardProps> = ({
  index,
  total,
  members,
  decision,
  onToggleKeep,
  onPass,
  onReset,
}) => {
  const isPass = decision?.kind === 'pass';
  const keep = decision?.kind === 'keep' ? decision.keep : [];
  const status: 'passed' | 'resolved' | 'pending' = isPass
    ? 'passed'
    : keep.length > 0
      ? 'resolved'
      : 'pending';

  const statusStyles: Record<typeof status, string> = {
    passed: 'border-border',
    resolved: 'border-accent/50',
    pending: 'border-amber-500/40',
  };

  return (
    <div
      // eslint-disable-next-line security/detect-object-injection
      className={`rounded-2xl border-2 bg-surface p-4 shadow-md ${statusStyles[status]}`}
    >
      {/* Cluster header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-lg font-bold text-text">
            Cluster {index + 1}
            <span className="font-mono text-sm font-normal text-text/40"> / {total}</span>
          </h3>
          <span className="rounded-full bg-bg px-2 py-0.5 font-mono text-xs text-text/50">
            {members.length} events
          </span>
          {status === 'passed' && (
            <span className="rounded-full bg-text/10 px-2 py-0.5 font-mono text-xs font-bold text-text/60">
              NOT A DUPLICATE
            </span>
          )}
          {status === 'resolved' && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-xs font-bold text-accent">
              KEEPING {keep.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPass}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold transition-colors active:scale-95 ${
              isPass
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-surface text-text hover:bg-border'
            }`}
          >
            <Check className="h-4 w-4" /> Keep all / not a dup
          </button>
          <button
            onClick={onReset}
            disabled={!decision}
            className="rounded-xl border border-border bg-surface p-1.5 text-text/60 transition-colors hover:bg-border active:scale-95 disabled:opacity-40"
            aria-label="Reset cluster"
            title="Reset cluster"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Members side by side */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <MemberCard
            key={member.name}
            member={member}
            kept={keep.includes(member.name)}
            markedForDeletion={status === 'resolved' && !keep.includes(member.name)}
            onToggleKeep={() => onToggleKeep(member.name)}
          />
        ))}
      </div>
    </div>
  );
};

interface MemberCardProps {
  member: ClusterMember;
  kept: boolean;
  markedForDeletion: boolean;
  onToggleKeep: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  kept,
  markedForDeletion,
  onToggleKeep,
}) => {
  const [imgError, setImgError] = useState(false);
  const { event, name } = member;
  const hasCloudinary = isCloudinaryImage(event?.image_url);
  const thumb = getImageUrl(event?.image_url, 'thumbnail');
  const showImg = !!thumb && !imgError;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
        kept
          ? 'border-accent bg-accent/5'
          : markedForDeletion
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-border bg-bg'
      }`}
    >
      {/* Image / placeholder */}
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-surface">
        {showImg ? (
          <img
            src={thumb}
            alt={event?.friendly_name ?? name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-mono text-xs text-text/40">no image</span>
        )}
        {!hasCloudinary && (
          <span className="absolute right-1.5 top-1.5 rounded bg-amber-500/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">
            HIDDEN
          </span>
        )}
        {markedForDeletion && (
          <span className="absolute left-1.5 top-1.5 rounded bg-red-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
            DELETE
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        {event ? (
          <>
            <p className="font-display text-sm font-bold leading-snug text-text">
              {event.friendly_name}
            </p>
            <p className="font-mono text-xs text-text/60">
              {event.year} · {event.difficulty}
            </p>
            <p className="font-mono text-[11px] text-text/40">
              {event.sourceFile} · {name}
            </p>
            <p className="mt-1 line-clamp-3 text-xs text-text/70">{event.description}</p>
          </>
        ) : (
          <>
            <p className="font-display text-sm font-bold text-text/70">{name}</p>
            <p className="font-mono text-[11px] text-red-500">
              not found in event data (already deleted?)
            </p>
          </>
        )}
      </div>

      {/* Keep toggle */}
      <button
        onClick={onToggleKeep}
        className={`flex items-center justify-center gap-2 border-t px-3 py-2 text-sm font-bold transition-colors active:scale-95 ${
          kept
            ? 'border-accent/40 bg-accent text-white'
            : 'border-border bg-surface text-text hover:bg-border'
        }`}
      >
        <span
          className={`flex h-4 w-4 items-center justify-center rounded border ${
            kept ? 'border-white bg-white/20' : 'border-text/40'
          }`}
        >
          {kept && <Check className="h-3 w-3" />}
        </span>
        {kept ? 'Keeping' : 'Keep'}
      </button>
    </div>
  );
};

export default AdminDedup;
