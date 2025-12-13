import React, { useEffect } from 'react';
import { PlacementResult } from '../types';
import { formatYear } from '../utils/gameLogic';

interface TurnBannerProps {
  placementResult: PlacementResult;
  nextPlayerName: string | null; // null for single-player, player name for multiplayer
  onDismiss: () => void;
}

const TurnBanner: React.FC<TurnBannerProps> = ({
  placementResult,
  nextPlayerName,
  onDismiss
}) => {
  const { success, event } = placementResult;

  // Auto-dismiss after 3 seconds (enough time to read the result)
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 animate-turn-banner-backdrop"
      onClick={onDismiss}
    >
      <div
        className="
          px-8 py-6 sm:px-12 sm:py-8
          bg-amber-50 rounded-xl
          sketch-border
          animate-turn-banner-in
          text-center
          max-w-sm sm:max-w-md
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success/Failure indicator */}
        <div className={`
          text-xl sm:text-2xl font-bold mb-3
          ${success ? 'text-green-600' : 'text-red-600'}
        `}>
          {success ? '✓ Correct!' : '✗ Wrong!'}
        </div>

        {/* Event name */}
        <div className="text-lg sm:text-xl text-sketch/80 mb-2">
          {event.friendly_name}
        </div>

        {/* Year - prominently displayed */}
        <div className="text-4xl sm:text-5xl font-bold text-sketch mb-4">
          {formatYear(event.year)}
        </div>

        {/* Next player section (multiplayer only) */}
        {nextPlayerName && (
          <>
            <div className="border-t border-amber-300/50 my-4" />
            <div className="text-amber-700/70 text-base sm:text-lg">
              Next Up
            </div>
            <div className="text-xl sm:text-2xl text-sketch font-bold">
              {nextPlayerName}'s Turn
            </div>
          </>
        )}

        {/* Dismiss hint */}
        <div className="text-amber-600/50 text-sm mt-4">
          Tap anywhere to continue
        </div>
      </div>
    </div>
  );
};

export default TurnBanner;
