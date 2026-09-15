import { AnimationTuning, TRAVEL_EASE } from './animationTuning';

/**
 * The geometry and clocks behind "the glowing dot becomes the tick".
 *
 * The drag marker and the tick are already neighbours on the board's one alignment invariant
 * (see BOARD COLUMN in index.css): the dash terminates the 96px gutter at board-left 84→96, the
 * rail starts at 96, and the marker rides the rail's centre at 98. So a correct placement's
 * landing is a short slide left plus a change of shape, and nothing has to cross the board to
 * make it read.
 *
 * The 8px that implies is never written down. Both ends are measured, which is the point: if the
 * board column ever moves, the landing follows it instead of quietly pointing at the wrong place.
 *
 * All of this is pure so the awkward parts can be asserted without a DOM.
 */

/** The dash at rest: `w-3 h-1`, square. Must match the placeholder box in TimelineTick. */
export const TICK_W = 12;
export const TICK_H = 4;
/** The marker: `h-2 w-1.5 rounded-full`. Must match TimelineMarker's MARKER_W / MARKER_H. */
export const DOT_W = 6;
export const DOT_H = 8;
/** Big enough to round a 6px-wide box into a pill; framer needs a number, not `9999px`. */
export const DOT_RADIUS = 9999;
/** The rail: `w-1` in TimelineRail. Only needed for the offset below. */
const RAIL_W = 4;

/**
 * How far left of the rail's centre the dash's centre sits — the width of the step the marker
 * takes when it stops being a drag indicator and starts being a tick.
 *
 * Derived, not measured, because it is needed before either end exists: the marker takes this
 * step while it snuffs, so that a wrong drop's dot travels down the bare gutter instead of
 * along the rail, where an unlit dot on a full-strength rail is simply invisible. It follows
 * from the board column invariant (`tick.right === rail.left`) and nothing else, so it stays
 * true at any gutter width — see index.css.
 */
export const RAIL_TO_TICK = RAIL_W / 2 + TICK_W / 2;

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * The transform that makes the dash *be* the marker: the dot's size, centred where the dot was
 * last painted.
 *
 * Both arguments are viewport points, and that is safe for exactly one reason — they are read in
 * the same layout effect, one frame's worth apart at most, so nothing has moved between them.
 * Holding either of them across a scroll would not be safe, which is why neither is stored.
 */
export function dotStart(origin: Point, rest: Box): Point {
  return {
    x: origin.x - (rest.left + TICK_W / 2) - (DOT_W - TICK_W) / 2,
    y: origin.y - (rest.top + TICK_H / 2) - (DOT_H - TICK_H) / 2,
  };
}

/** Frame-by-frame targets for the landing: dot on the first frame, dash on the last. */
export function landingKeyframes(start: Point) {
  return {
    x: [start.x, 0],
    y: [start.y, 0],
    width: [DOT_W, TICK_W],
    height: [DOT_H, TICK_H],
    borderRadius: [DOT_RADIUS, 0],
  };
}

/**
 * When the landing ends a wrong drop, the dash has somewhere to be first: the card is FLIPping to
 * its true slot, and the snuffed dot goes with it on the same tween and the same ease, then grows
 * once it arrives. `travelMs` undefined is a correct placement — no journey, just the morph.
 *
 * The two clocks are deliberately shared with the card's own reveal (`TombstoneRow`'s
 * `cardTransition`). If they ever drift apart the dot arrives before or after the card it is
 * supposed to be escorting, which is worse than not escorting it at all.
 */
export function landingTransition(tick: AnimationTuning['tick'], travelMs: number | undefined) {
  const morph = { type: 'spring' as const, ...tick.morphSpring };
  if (travelMs === undefined) return { default: morph };
  const travelS = travelMs / 1000;
  return {
    default: { ...morph, delay: travelS },
    x: { type: 'tween' as const, duration: travelS, ease: TRAVEL_EASE },
    y: { type: 'tween' as const, duration: travelS, ease: TRAVEL_EASE },
  };
}
