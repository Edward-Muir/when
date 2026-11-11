import React from 'react';
import { Home } from 'lucide-react';

interface GameHomeButtonProps {
  onClick: () => void;
  /**
   * True while a card is being dragged. The button sits over the board's top-right corner,
   * where a card can be dropped, so it steps out of the way for the length of the drag.
   */
  hidden: boolean;
}

/**
 * The game's one piece of chrome: Home, floating at the board's top right. It replaced the
 * top bar, which cost the board 56px for a title and three buttons. Above the timeline's
 * "Earlier" fade (z-30) and level with the hint strip, below the hand bar (z-40).
 */
const GameHomeButton: React.FC<GameHomeButtonProps> = ({ onClick, hidden }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Go home"
    aria-hidden={hidden || undefined}
    tabIndex={hidden ? -1 : undefined}
    className={`absolute top-2 right-2 z-[35] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-opacity duration-150 active:scale-95 ${
      hidden ? 'opacity-0 pointer-events-none' : ''
    }`}
  >
    <Home className="h-5 w-5 text-text" />
  </button>
);

export default GameHomeButton;
