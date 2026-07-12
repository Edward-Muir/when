import React, { useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { EventWithSource } from '../utils/eventLoader';
import { getImageUrl, isCloudinaryImage } from '../utils/cloudinaryImage';
import { DedupDecision } from '../utils/dedupStorage';

/**
 * Card components for the `/admin/dedup` review page. Extracted from AdminDedup.tsx so each
 * file stays focused. `ClusterCard` shows one duplicate cluster's members side by side;
 * `MemberCard` renders a single event with its Keep toggle.
 */

/** A single member of a cluster: the id from clusters.json plus joined event details. */
export interface ClusterMember {
  name: string;
  event: EventWithSource | undefined;
}

interface ClusterCardProps {
  index: number;
  total: number;
  members: ClusterMember[];
  decision: DedupDecision | undefined;
  onToggleKeep: (name: string) => void;
  onPass: () => void;
  onReset: () => void;
}

export const ClusterCard: React.FC<ClusterCardProps> = ({
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
