import React from 'react';
import { Info } from 'lucide-react';

/**
 * The "read more" control, pinned to the top-right of an event's image by whatever renders it.
 *
 * A frosted disc rather than the card's own text colour: this sits over arbitrary card art, where
 * a per-event tint has nothing to guarantee contrast against. Same chip treatment as the lock on
 * a locked achievement, which solves the same problem.
 *
 * The popup it belongs to dismisses on a tap anywhere while the short description is showing, so
 * the click has to stop there or the card vanishes instead of turning over.
 */
function EventInfoButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Read more about this event"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-11 h-11 flex items-center justify-center rounded-full bg-black/35 backdrop-blur-[2px] ring-1 ring-white/30 shadow-[0_2px_6px_rgba(0,0,0,0.45)] text-white/95 hover:bg-black/50 active:scale-95 transition-all ${className}`}
    >
      <Info className="w-5 h-5" />
    </button>
  );
}

export default EventInfoButton;
