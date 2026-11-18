/**
 * The timeline wheel: the pose of one board row, from how far its centre is from the centre of
 * the viewport.
 *
 * The board is laid out flat, exactly as it always was, and the wheel is paint on top of it: a
 * translate per row, and a tilt, a scale and a few extra pixels of height on its card. Layout
 * never moves, so scroll height, the 50vh runways and every `offsetTop` are what they were, and
 * a scroll can drive the pose without the pose feeding back into the scroll.
 *
 * `d` is a LAYOUT distance (row centre minus viewport centre, px, negative above). Everything
 * here is pure so the awkward properties can be asserted without a DOM: rows never cross, the
 * rail's segments still butt together, and no card gets shorter than a touch target.
 */

export interface WheelTuning {
  /** Tilt of a card at the viewport's edge, in degrees. */
  maxTilt: number;
  /** Scale of a card at the viewport's edge. */
  minScale: number;
  /** Opacity of a card at the viewport's edge. */
  minDim: number;
  /** Extra height the centred card gains, px. Must match `--wheel-grow` in index.css. */
  grow: number;
}

export const WHEEL_TUNING: WheelTuning = {
  maxTilt: 40,
  minScale: 0.8,
  minDim: 0.72,
  grow: 36,
};

/**
 * Extra clearance either side of the centred card, px. The perspective brings a tilted card's
 * near edge towards the viewer, so it paints a little taller than its flat height.
 */
const BULGE_PAD = 6;

export interface WheelPose {
  /** Translate for the whole row, px: its visual centre minus its layout centre. */
  y: number;
  /** rotateX for the card, degrees. Positive leans the top edge away (rows above centre). */
  tilt: number;
  scale: number;
  /** 1 on the centred card, 0 from one row away: how much of `grow` the card takes. */
  focus: number;
  dim: number;
  /** The rail segment's own translate (px, relative to the row) and vertical scale. */
  railY: number;
  railScale: number;
}

export const FLAT_POSE: WheelPose = {
  y: 0,
  tilt: 0,
  scale: 1,
  focus: 0,
  dim: 1,
  railY: 0,
  railScale: 1,
};

/** How far round the wheel a row is: 0 at the centre, 1 at the viewport's edge and beyond. */
function turn(d: number, half: number): number {
  return Math.min(Math.abs(d) / half, 1);
}

/**
 * Where a layout offset is painted. Two terms:
 *
 * - The drum. Rows bunch as they turn away: the local slope falls linearly from 1 at the centre
 *   to `edgeSlope` at the viewport's edge (the foreshortening of a card there) and stays there.
 * - The bulge. The centred card is `grow` taller than its slot, so its neighbours are pushed out
 *   by half of that, eased in over one row pitch.
 *
 * Both slopes are positive everywhere, so this is strictly increasing: rows keep their order.
 */
export function wheelOffset(
  d: number,
  half: number,
  pitch: number,
  tuning: WheelTuning = WHEEL_TUNING
): number {
  const u = Math.abs(d);
  const edgeSlope = tuning.minScale * Math.cos((tuning.maxTilt * Math.PI) / 180);
  const drum =
    u <= half
      ? u - ((1 - edgeSlope) * u * u) / (2 * half)
      : half - ((1 - edgeSlope) * half) / 2 + edgeSlope * (u - half);
  const x = Math.min(u / pitch, 1);
  const bulge = (tuning.grow / 2 + BULGE_PAD) * x * (2 - x);
  return Math.sign(d) * (drum + bulge);
}

/**
 * The pose of a row whose centre is `d` from the viewport's centre.
 *
 * `half` is half the viewport's height, `pitch` the height of an ordinary row, and `height` this
 * row's own height (a row can be taller than the pitch only in theory, but the rail maths must
 * use the real one or adjacent segments stop meeting).
 */
export function wheelPose(
  d: number,
  half: number,
  pitch: number,
  height: number = pitch,
  tuning: WheelTuning = WHEEL_TUNING
): WheelPose {
  if (half <= 0 || pitch <= 0) return FLAT_POSE;
  const t = turn(d, half);
  const visual = wheelOffset(d, half, pitch, tuning);
  const x = Math.min(Math.abs(d) / pitch, 1);
  // The rail segment fills its row, so it must be painted from where the row's top edge lands
  // to where its bottom edge lands. Adjacent rows share an edge, so their segments meet exactly.
  const top = wheelOffset(d - height / 2, half, pitch, tuning);
  const bottom = wheelOffset(d + height / 2, half, pitch, tuning);
  return {
    y: visual - d,
    // `|| 0` folds the centred row's -0 into 0, so it serialises as "0deg".
    tilt: -Math.sign(d) * tuning.maxTilt * t || 0,
    scale: 1 - (1 - tuning.minScale) * t,
    focus: 1 - x * x,
    dim: 1 - (1 - tuning.minDim) * t,
    railY: (top + bottom) / 2 - visual,
    railScale: height > 0 ? (bottom - top) / height : 1,
  };
}

/** The painted height of a card whose slot is `slot` px tall, for the touch-target check. */
export function wheelCardHeight(
  pose: WheelPose,
  slot: number,
  tuning: WheelTuning = WHEEL_TUNING
): number {
  return (slot + tuning.grow * pose.focus) * pose.scale * Math.cos((pose.tilt * Math.PI) / 180);
}
