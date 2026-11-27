import React from 'react';

/** The small round count the hand, the Pass button and (in its own words) the deck pile wear. */
export const COUNT_PILL =
  'flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-body text-[10px] font-semibold leading-none ring-2 ring-bg';

/**
 * The cards in hand, on the top right corner of the hand: the same pill as the deck's count
 * and the pass count (`DeckPile`, `PassBadge`). The fan beside it stops at five cards, and
 * this does not. Still: it changes with the fan, which is movement enough. A sibling of the
 * draggable card, so it stays where it is during a drag.
 */
const HandBadge: React.FC<{ count: number }> = ({ count }) => (
  <>
    <span
      data-testid="hand-count"
      aria-hidden
      className={`pointer-events-none absolute -right-2 -top-1.5 z-[7] ${COUNT_PILL} ${
        count > 0 ? 'bg-accent text-white' : 'bg-border text-text-muted'
      }`}
    >
      {count}
    </span>
    <span className="sr-only">{count === 1 ? '1 card in hand' : `${count} cards in hand`}</span>
  </>
);

export default HandBadge;
