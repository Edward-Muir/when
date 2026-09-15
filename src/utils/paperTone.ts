/**
 * NOTE: this no longer tints the board. The paper ramp is positional now — a fixed-length
 * crossfade anchored at the first card, which a longer board reveals more of (see
 * `usePaperField`). What is left here is the year → 0..1 scale itself, which /timeline-lab
 * still uses to spread its sample draw evenly across history.
 *
 * Where a year sits on the board's paper ramp: 0 = the warm (early) tone, 1 = the cool
 * (late) one. Feeds `--tone` on each timeline row; the two tones themselves live in
 * index.css and are each only a few percent off the page colour.
 *
 * Two deliberate choices:
 *
 * 1. **Absolute, not normalised to your own board.** A board sitting inside one century
 *    comes out flat, and only a board that actually reaches back earns the warm end. A
 *    scale normalised to the current first/last card would show a full sweep at two cards
 *    and never change again — the opposite of the thing this is for.
 * 2. **Log of time-before-now, not linear years.** Perceived age is logarithmic: 1500 and
 *    1000 feel further apart than 1500 and 2000 do, despite the identical gap. It also
 *    matches the catalogue, which is roughly half pre-1500 and half post — a linear scale
 *    would squash every modern board into one indistinguishable sliver.
 */

/** "Now" for the purposes of the ramp. A fixed year, so the tint never shifts under a player. */
const REFERENCE_YEAR = 2025;

/** log10(years before now) at the cool end (~5 years ago) and the warm end (~8000 BCE). */
const LOG_NEAR = 0.7;
const LOG_FAR = 4.0;

export function paperTone(year: number): number {
  const yearsAgo = Math.max(1, REFERENCE_YEAR - year);
  const t = (Math.log10(yearsAgo) - LOG_NEAR) / (LOG_FAR - LOG_NEAR);
  return 1 - Math.min(1, Math.max(0, t));
}
