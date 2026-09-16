/**
 * Where a year sits on an absolute scale of recorded history: 0 = the deep past, 1 = now.
 *
 * It was built to tint the board's background, which has since been dropped (see
 * docs/ui-redesign/index.md). What is worth keeping is the scale itself, which /timeline-lab
 * uses to spread its sample draw evenly across history rather than clumping it wherever the
 * catalogue is densest.
 *
 * Two deliberate choices:
 *
 * 1. **Absolute, not normalised to the set you happen to have.** A set sitting inside one
 *    century comes out flat, and only one that actually reaches back covers the range. A scale
 *    normalised to its own first/last entry would show a full sweep at two entries and never
 *    change again — the opposite of the thing this is for.
 * 2. **Log of time-before-now, not linear years.** Perceived age is logarithmic: 1500 and 1000
 *    feel further apart than 1500 and 2000 do, despite the identical gap. It also matches the
 *    catalogue, which is roughly half pre-1500 and half post — a linear scale would squash
 *    every modern set into one indistinguishable sliver.
 */

/** "Now" for the purposes of the scale. A fixed year, so it never shifts under a player. */
const REFERENCE_YEAR = 2025;

/** log10(years before now) at the recent end (~5 years ago) and the far end (~8000 BCE). */
const LOG_NEAR = 0.7;
const LOG_FAR = 4.0;

export function yearScale(year: number): number {
  const yearsAgo = Math.max(1, REFERENCE_YEAR - year);
  const t = (Math.log10(yearsAgo) - LOG_NEAR) / (LOG_FAR - LOG_NEAR);
  return 1 - Math.min(1, Math.max(0, t));
}
