/**
 * The two card sizes the game draws, in one place.
 *
 * The landscape card is a timeline row's card (and the drop ghost, the Archive's day card and
 * what a dragged card becomes). The square is the card in hand. The landscape size was tuned on a
 * phone with the wheel running: 228 x 70, magnified by a quarter at the centre. The hand card is a 168px
 * square; 140 was tried alongside the smaller timeline card and reverted.
 *
 * Changing either one is not just these strings:
 *
 * - The wheel's row height in index.css (`--wheel-pitch`) is derived from the landscape
 *   height; `wheelMath.test.ts` pins it.
 * - The hand bar's height and its grid are built on `--hand-card` in index.css.
 * - The board column's desktop centring is built on `--board-card` (the `sm` width).
 *
 * The class strings are whole literals so Tailwind can see them.
 */
export const LANDSCAPE_CARD_CLASS = 'w-[228px] h-[70px] sm:w-[280px] sm:h-[96px]';
export const SQUARE_CARD_CLASS = 'w-[168px] h-[168px]';

/** The landscape card's size in px, below and from Tailwind's `sm` breakpoint (640px). */
export const LANDSCAPE_CARD = {
  base: { w: 228, h: 70 },
  sm: { w: 280, h: 96 },
} as const;
