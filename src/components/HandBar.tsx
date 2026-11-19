import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GamePhase } from '../types';

interface HandBarProps {
  phase: GamePhase;
  /** A dragged card is over the bar, where a drop returns it to the hand. */
  isOverHand: boolean;
  /** The `bottom-bar-zone` droppable's ref. */
  barRef: (node: HTMLElement | null) => void;
  children: React.ReactNode;
}

/**
 * The bar is tall only while it holds the square hand card. Game over swaps in a row of
 * buttons, and the board gets the space back.
 */
function bottomBarHeightClass(phase: GamePhase): string {
  return phase === 'gameOver' ? 'h-[120px] sm:h-[140px]' : 'hand-bar';
}

/**
 * The bar at the bottom of a game: the hand while playing, the result buttons at game over.
 * `hand-bar` (index.css) is the square hand card plus the safe-area inset, and `hand-rise`
 * slides the bar up from below the screen once the board has faded in.
 *
 * The tab on its top edge tucks the hand away so the timeline can be read at the full height
 * of the screen, and brings it back. It is a child of the bar, so it rides down with it and
 * is one control in one place for both directions. It sits at the right end because the
 * centre of that edge belongs to the board's "Later" label and the hint pill, and it lines
 * up under the HUD's two buttons.
 *
 * Hiding is a negative bottom margin (`hand-bar-hidden`), not a transform: the board is the
 * flex-1 sibling, so it grows as the bar leaves. The safe-area strip stays on screen, which
 * keeps "Later" off the home indicator. The hand is `inert` while hidden. Nothing is stored:
 * every game starts with the hand showing, and game over always shows its buttons.
 *
 * A component of its own because `Game` sits on ESLint's complexity ceiling.
 */
const HandBar: React.FC<HandBarProps> = ({ phase, isOverHand, barRef, children }) => {
  const [tucked, setTucked] = useState(false);
  const playing = phase !== 'gameOver';
  const hidden = tucked && playing;
  const Chevron = hidden ? ChevronUp : ChevronDown;

  return (
    <div
      ref={barRef}
      data-testid="hand-bar"
      className={`${bottomBarHeightClass(phase)} hand-rise hand-bar-slide relative flex items-center border-t border-border bg-bg z-40 pb-safe ${
        hidden ? 'hand-bar-hidden' : ''
      } ${isOverHand ? 'bg-accent/10' : ''}`}
    >
      {playing && (
        <button
          type="button"
          onClick={() => setTucked((t) => !t)}
          aria-label={hidden ? 'Show hand' : 'Hide hand'}
          aria-expanded={!hidden}
          // The visible tab is 28px tall; the button reaches 16px further up so the target
          // is 44px, and the tab's own bottom edge covers the bar's border under it.
          className="group absolute bottom-full right-2 flex h-11 w-11 items-end justify-center"
        >
          <span className="-mb-px flex h-7 w-11 items-center justify-center rounded-t-xl border border-b-0 border-border bg-bg text-text-muted shadow-sm transition-colors group-hover:text-text group-active:bg-surface">
            <Chevron className="h-5 w-5" aria-hidden="true" />
          </span>
        </button>
      )}
      <div className="contents" inert={hidden} data-testid="hand-bar-content">
        {children}
      </div>
    </div>
  );
};

export default HandBar;
