import React from 'react';
import { AlertCircle } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { getEventTextClass } from '../utils/eventColor';
import { useEventDetail } from '../hooks/useEventDetail';

/**
 * The long-form read, in the box the short description was occupying: three shimmer lines while
 * the shard loads, then the prose.
 *
 * Not a scroll region: it is the tall half of one, below the image, and the popup owns the box
 * they scroll in together. Its bottom padding is what lets the last line clear that box's fade.
 */
function EventDetailText({
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
    <div className="px-4 py-3 space-y-3">
      {detail.paragraphs.map((paragraph, i) => (
        <p key={i} className={`${textClass} text-sm leading-relaxed font-body break-words`}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default EventDetailText;
