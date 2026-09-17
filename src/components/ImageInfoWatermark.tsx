import React from 'react';
import { Info } from 'lucide-react';

/**
 * Opens an event's detail card from its image, for a surface that is not the card itself.
 *
 * White rather than event-tinted, because over arbitrary card art a per-event tint has nothing to
 * guarantee contrast against; the drop shadow is what carries it on pale art.
 */
function ImageInfoWatermark({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Read more about this event"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-11 h-11 flex items-center justify-center text-white opacity-55 hover:opacity-90 active:scale-95 transition-all drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] ${className}`}
    >
      <Info className="w-5 h-5" />
    </button>
  );
}

export default ImageInfoWatermark;
