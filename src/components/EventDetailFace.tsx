import React from 'react';
import { AlertCircle } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { getEventTextClass } from '../utils/eventColor';
import { useEventDetail } from '../hooks/useEventDetail';

/** Shared shell for the two header controls, so they match in size, colour and feedback. */
export function HeaderIconButton({
  event,
  tombstone,
  label,
  onClick,
  children,
}: {
  event: HistoricalEvent;
  tombstone?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const textClass = tombstone ? 'text-text-muted' : getEventTextClass(event);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        // The popup dismisses on backdrop clicks; Modal stops propagation at the card, but
        // these controls stop it too so they keep working if that ever changes.
        e.stopPropagation();
        onClick();
      }}
      className={`shrink-0 -my-1 w-11 h-11 flex items-center justify-center rounded-xl opacity-60 hover:opacity-100 active:scale-95 transition-all ${textClass}`}
    >
      {children}
    </button>
  );
}

/**
 * The reading face: three shimmer lines while the shard loads, then the prose.
 *
 * No image here. The header already identifies the card, and the front face's 384px image box
 * is most of a phone screen — the point of this face is reading room.
 */
function EventDetailFace({
  event,
  tombstone,
  detail,
}: {
  event: HistoricalEvent;
  tombstone?: boolean;
  detail: ReturnType<typeof useEventDetail>;
}) {
  const textClass = tombstone ? 'text-text-muted' : getEventTextClass(event);

  if (detail.status === 'loading' || detail.status === 'idle') {
    return (
      <div className="px-4 py-3 space-y-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading more about this event</span>
        {/* Ragged widths so it reads as text rather than as a progress bar. */}
        {['w-full', 'w-11/12', 'w-4/5'].map((width, i) => (
          <div
            key={width}
            className={`h-3 rounded bg-current opacity-20 ${width}`}
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    );
  }

  if (detail.status === 'error' || !detail.paragraphs) {
    return (
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            detail.retry();
          }}
          aria-live="polite"
          className={`w-full min-h-[44px] flex items-center justify-center gap-1.5 font-body text-xs opacity-80 hover:opacity-100 active:scale-95 transition-all ${textClass}`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Couldn&apos;t load — tap to retry
        </button>
      </div>
    );
  }

  return (
    // overscroll-contain so flicking past the end of the prose doesn't scroll the board behind.
    <div className="px-4 py-3 overflow-y-auto overscroll-contain space-y-3">
      {detail.paragraphs.map((paragraph, i) => (
        <p key={i} className={`${textClass} text-sm leading-relaxed font-body break-words`}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default EventDetailFace;
