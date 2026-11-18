/**
 * The two card sizes the game draws, in one place.
 *
 * The landscape card is a timeline row's card (and the drop ghost, the Archive's day card and
 * what a dragged card becomes). The square is the card in hand. They were tuned together on a
 * phone, with the wheel running: 228 x 70 on the timeline, opening to 97 at the centre, and a
 * 140px square in hand.
 *
 * Changing either one is not just these strings:
 *
 * - The wheel's row height and art pin in index.css (`--wheel-pitch`, `--wheel-art-pin`) are
 *   derived from the landscape size; `wheelMath.test.ts` pins them.
 * - The hand bar's height and its grid are built on `--hand-card` in index.css.
 * - The board column's desktop centring is built on `--board-card` (the `sm` width).
 *
 * The class strings are whole literals so Tailwind can see them.
 */
export const LANDSCAPE_CARD_CLASS = 'w-[228px] h-[70px] sm:w-[280px] sm:h-[96px]';
export const SQUARE_CARD_CLASS = 'w-[140px] h-[140px]';

/** The landscape card's size in px, below and from Tailwind's `sm` breakpoint (640px). */
export const LANDSCAPE_CARD = {
  base: { w: 228, h: 70 },
  sm: { w: 280, h: 96 },
} as const;
