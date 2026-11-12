import type { AnimationTuning } from './animationTuning';

/**
 * The correct-placement shockwave, as pure maths.
 *
 * A card that lands correctly kicks the rows around it AWAY from itself (rows above lift, rows
 * below sink) in one damped pulse: out, a single rebound, still. The front runs along the
 * timeline and slows as it goes, and a light on the rail travels with it, timed to sit on each
 * row at the moment that row is furthest from rest.
 *
 * The streak builds it per correct card, not per tier: every card up to MAX_BUILD_STREAK lands
 * a little harder than the last. See docs/gameplay-feel/index.md for why the old ripple (every
 * row pushed down, 200ms a row, ringing for two seconds) never read as a splash, and
 * docs/gameplay-feel/splash-rig.html for the rig these numbers were chosen in.
 */

type Shock = AnimationTuning['shock'];

/** The build stops growing here: a streak of 8 and a streak of 20 land the same. */
export const MAX_BUILD_STREAK = 8;

/** Below this a row's kick is not worth animating, which keeps far rows of a long board idle. */
export const MIN_KICK_PX = 0.3;

/** How far the streak has built, 0 at a first correct card, `streakGain` at the cap. */
export function streakBuild(streak: number, s: Shock): number {
  const steps = Math.min(Math.max(streak - 1, 0), MAX_BUILD_STREAK - 1);
  return (steps / (MAX_BUILD_STREAK - 1)) * s.streakGain;
}

/** How long after it starts moving a row is at full kick (s). The rail light is timed to this. */
export function shockPeakS(s: Shock): number {
  const w = 2 * Math.PI * s.reboundHz;
  return Math.atan2(w, s.settle) / w;
}

/** One damped pulse, `tau` seconds after it starts. Normalised so its first peak is exactly 1. */
export function shockPulse(tau: number, s: Shock): number {
  if (tau <= 0) return 0;
  const w = 2 * Math.PI * s.reboundHz;
  const tp = shockPeakS(s);
  const peak = Math.exp(-s.settle * tp) * Math.sin(w * tp);
  return (Math.exp(-s.settle * tau) * Math.sin(w * tau)) / peak;
}

/** When the row `d` rows from the placed card starts to move (s). The front slows as it goes. */
export function shockDelayS(d: number, s: Shock): number {
  return (d * s.frontMsPerRow + d * d * s.frontSlowMsPerRow2) / 1000;
}

/** How much of the kick is left `d` rows out, 1 at the nearest row. */
export function shockReach(d: number, s: Shock): number {
  return Math.pow(0.5, (d - 1) / s.halfLifeRows);
}

/** Peak displacement of the row `d` rows out (px), unsigned. */
export function shockKickPx(d: number, streak: number, s: Shock): number {
  return s.kickPx * (s.kickBase + s.kickBuild * streakBuild(streak, s)) * shockReach(d, s);
}

/** How far the placed card itself dips into the rail (px). */
export function shockDipPx(streak: number, s: Shock): number {
  return s.dipPx + s.dipBuildPx * streakBuild(streak, s);
}

/** Size multiplier for the placed card's glow. */
export function shockGlowScale(streak: number, s: Shock): number {
  return 1 + s.glowBuild * streakBuild(streak, s);
}

/** Size multiplier for the light on the rail. */
export function shockLightScale(streak: number, s: Shock): number {
  return 1 + s.lightBuild * streakBuild(streak, s);
}

/** How long one row's pulse is played for (s): by then it is a four-hundredth of its peak. */
export function shockDurationS(s: Shock): number {
  return 6 / s.settle;
}

const SAMPLES = 24;

/**
 * The pulse as evenly spaced keyframes for a linear tween of `shockDurationS`, scaled to
 * `amplitude` (signed px for a row, or 1 for a unit curve). Ends on exactly 0.
 */
export function sampleShock(amplitude: number, s: Shock): number[] {
  const duration = shockDurationS(s);
  const frames: number[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    frames.push(amplitude * shockPulse((i / SAMPLES) * duration, s));
  }
  frames.push(0);
  return frames;
}
