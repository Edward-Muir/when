/**
 * The timeline wheel: the pose of one board row, from how far its centre is from the centre of
 * the viewport.
 *
 * Two things happen to a row as it nears the centre, and both come from one curve:
 *
 * - **It opens.** The card's frame grows above and below, so more of the same painting shows.
 *   Nothing is scaled. The opening is a bell across the wheel, not a step at the centre: the
 *   neighbours are part-open too, so a card opens gradually along its whole approach.
 * - **It turns to face the player.** The strip the rows sit on is wrapped round a very large
 *   cylinder and seen under one shared perspective, so rows further out lean back a few degrees
 *   and sit slightly closer together.
 *
 * ## The one curve
 *
 * The strip is measured in "strip px": a row at rest is `pitch` tall. `stripPosition` maps a
 * distance along the unopened strip to a distance along the opened one. It is strictly
 * increasing, and a row's two edges both go through it, so a row's opened height is exactly the
 * room its neighbours make for it: rows can never overlap or leave a gap, at rest or mid-turn.
 *
 * ## Why the board is laid out tall
 *
 * A taller centre card means the strip is stretched there, so it moves further than the scroll
 * that drives it. The board scrolls natively, on the compositor, and the pose is applied a
 * frame later from JavaScript; whatever the pose adds to the scroll's own movement is what can
 * lag or judder. So the rows are LAID OUT at the centre's stretched height (`rowHeight`, set in
 * index.css), which makes the pose's correction zero at the centre and its slope there 1: the
 * centred card moves exactly with the finger, and the rows further out move a little slower, as
 * they would on a real wheel.
 *
 * Everything here is pure so those properties can be asserted without a DOM.
 */

export interface WheelTuning {
  /** How far round the cylinder the viewport's edge is, in degrees. */
  edgeAngle: number;
  /** The shared perspective distance, px. */
  perspective: number;
  /** How far the centred card opens: 0 is the resting crop, 1 the whole square painting. */
  reveal: number;
  /** How far from the centre the opening reaches, in row pitches (the bell's width). */
  spread: number;
  /** The painting's width as a fraction of the card's (`w-[70%]` in CardFace). */
  artRatio: number;
  /** The gap between two cards at rest, px (`py-1` on each row). */
  gap: number;
  /** How much a card at the viewport's edge is dimmed. */
  dim: number;
  /** The opacity of a year far from the centre. */
  yearFloor: number;
}

export const WHEEL_TUNING: WheelTuning = {
  edgeAngle: 11.4,
  perspective: 970,
  reveal: 0.4,
  spread: 1.6,
  artRatio: 0.7,
  gap: 8,
  dim: 0.12,
  yearFloor: 0.6,
};

/** What the wheel is measured against: the viewport and the card it carries. */
export interface WheelFrame {
  /** Half the viewport's height, px. */
  half: number;
  /** The card slot's height at rest, px (80, or 96 from the `sm` breakpoint). */
  slot: number;
  /** The card's width, px (240 or 280). */
  cardWidth: number;
  /** The height rows are laid out at, px. Should be `wheelRowHeight(slot, cardWidth)`. */
  rowHeight: number;
}

export interface WheelGeometry {
  frame: WheelFrame;
  tuning: WheelTuning;
  /** A row's height at rest, in strip px. */
  pitch: number;
  /** The extra height of the centred card, px. */
  grow: number;
  /** The bell's width, strip px. */
  sigma: number;
  /** The bell's amplitude: `stripPosition(d) = d + amp * erf(d / sigma)`. */
  amp: number;
  /** How fast the centred row's midpoint moves, in opened px per strip px. */
  centreSlope: number;
  /** The cylinder's radius, px. */
  radius: number;
}

export interface WheelPose {
  /** Translate for the row, px: where its centre is painted minus where layout puts it. */
  y: number;
  /** How far back the row sits, px (zero or negative). */
  z: number;
  /** rotateX for the row, radians. Positive leans the top edge away (rows above centre). */
  tilt: number;
  /** Extra height for the card over its resting slot, px. */
  grow: number;
  /** The rail segment's vertical scale: the row's opened height over its laid-out height. */
  railScale: number;
  /** 1 on the centred row, falling to 0: drives the year's size. */
  focus: number;
  /** The year's opacity. */
  yearDim: number;
  /** The card's opacity. */
  dim: number;
}

export const FLAT_POSE: WheelPose = {
  y: 0,
  z: 0,
  tilt: 0,
  grow: 0,
  railScale: 1,
  focus: 0,
  yearDim: 1,
  dim: 1,
};

const SQRT_PI_2 = Math.sqrt(Math.PI) / 2;
/** Past this angle a row is edge-on; it is held there rather than wrapped behind the wheel. */
const HORIZON = 1.45;

/** The error function (Abramowitz and Stegun 7.1.26, accurate to about 1.5e-7). */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const poly =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - poly * Math.exp(-a * a));
}

/** The opening's fixed numbers for a card size: independent of the viewport. */
function opening(slot: number, cardWidth: number, tuning: WheelTuning) {
  const pitch = slot + tuning.gap;
  const grow = Math.max(0, tuning.reveal * (tuning.artRatio * cardWidth - slot));
  const sigma = tuning.spread * pitch;
  const amp = grow / (2 * erf(pitch / (2 * sigma)));
  // The centred row's midpoint is the mean of its two edges, so it moves at the mean of their
  // speeds: the curve's slope half a pitch out.
  const centreSlope = 1 + (amp / (SQRT_PI_2 * sigma)) * Math.exp(-((pitch / (2 * sigma)) ** 2));
  return { pitch, grow, sigma, amp, centreSlope };
}

/**
 * The height rows must be laid out at for the centred card to move exactly with the scroll.
 * `--wheel-pitch` in index.css is this number for each card size; `wheelMath.test.ts` holds
 * the two together.
 */
export function wheelRowHeight(
  slot: number,
  cardWidth: number,
  tuning: WheelTuning = WHEEL_TUNING
): number {
  const { pitch, centreSlope } = opening(slot, cardWidth, tuning);
  return Math.round(pitch * centreSlope);
}

export function wheelGeometry(
  frame: WheelFrame,
  tuning: WheelTuning = WHEEL_TUNING
): WheelGeometry {
  const radius = frame.half / ((tuning.edgeAngle * Math.PI) / 180);
  return { frame, tuning, radius, ...opening(frame.slot, frame.cardWidth, tuning) };
}

/** Where a point `d` along the unopened strip sits on the opened one. Strictly increasing. */
export function stripPosition(d: number, geo: WheelGeometry): number {
  return geo.amp > 0 ? d + geo.amp * erf(d / geo.sigma) : d;
}

/**
 * Where a point `u` on the opened strip is painted, as a distance below the viewport's centre:
 * round the cylinder, then through the shared perspective.
 */
export function wheelScreenY(u: number, geo: WheelGeometry): number {
  const theta = Math.max(-HORIZON, Math.min(HORIZON, u / geo.radius));
  const z = -geo.radius * (1 - Math.cos(theta));
  const p = geo.tuning.perspective;
  return (geo.radius * Math.sin(theta) * p) / (p - z);
}

/**
 * The pose of a row whose centre is laid out `x` px below the viewport's centre and which is
 * `height` px tall in layout (normally `frame.rowHeight`).
 */
export function wheelPose(
  x: number,
  geo: WheelGeometry,
  height: number = geo.frame.rowHeight
): WheelPose {
  const { frame, tuning } = geo;
  if (frame.half <= 0 || frame.rowHeight <= 0 || height <= 0) return FLAT_POSE;
  // Layout px to strip px: a laid-out row is one pitch of strip.
  const toStrip = geo.pitch / frame.rowHeight;
  const top = stripPosition((x - height / 2) * toStrip, geo);
  const bottom = stripPosition((x + height / 2) * toStrip, geo);
  const extent = bottom - top;
  const theta = Math.max(-HORIZON, Math.min(HORIZON, (top + bottom) / 2 / geo.radius));
  const d = x * toStrip;
  const focus = Math.exp(-2 * (d / geo.sigma) ** 2);
  const t = Math.min(Math.abs(geo.radius * Math.sin(theta)) / frame.half, 1);
  return {
    y: geo.radius * Math.sin(theta) - x,
    z: -geo.radius * (1 - Math.cos(theta)),
    // `|| 0` folds the centred row's -0 into 0, so it serialises as "0rad".
    tilt: -theta || 0,
    grow: extent - height * toStrip,
    railScale: extent / height,
    focus,
    yearDim: tuning.yearFloor + (1 - tuning.yearFloor) * focus,
    dim: 1 - tuning.dim * t * t,
  };
}
