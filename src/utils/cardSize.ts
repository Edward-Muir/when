/**
 * The two card sizes the game draws, in one place.
 *
 * The landscape card is a timeline row's card (and the drop ghost, the Archive's day card and
 * what a dragged card becomes). The square is the card in hand. A smaller landscape card
 * (228 x 70) and a 140px hand card were both tried and reverted.
 *
 * Changing either one is not just these strings:
 *
 * - The hand bar's height and its grid are built on `--hand-card` in index.css.
 * - The board column's desktop centring is built on `--board-card` (the `sm` width).
 * - At phone size the landscape card's painting (70% of its width) is exactly the square's
 *   width, which is what lets a dragged card open without its painting resizing
 *   (HandDragOverlay.tsx).
 *
 * The class strings are whole literals so Tailwind can see them.
 */
export const LANDSCAPE_CARD_CLASS = 'w-[240px] h-[80px] sm:w-[280px] sm:h-[96px]';
export const SQUARE_CARD_CLASS = 'w-[168px] h-[168px]';

/** The landscape card's size in px, below and from Tailwind's `sm` breakpoint (640px). */
export const LANDSCAPE_CARD = {
  base: { w: 240, h: 80 },
  sm: { w: 280, h: 96 },
} as const;
