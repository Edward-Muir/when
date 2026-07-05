import { createContext, useContext } from 'react';

/**
 * Central tuning surface for the placement animations (success ripple, miss
 * flash/travel/wake). DEFAULT_TUNING is the shipped behavior; the game never
 * mounts a provider, so `useAnimationTuning()` resolves to the stable default
 * object and all values compile down to the same constants as before. The
 * /anim-jig dev page mounts `AnimationTuningContext.Provider` to live-tweak.
 */

export interface SpringParams {
  stiffness: number;
  damping: number;
  mass?: number;
}

export interface AnimationTuning {
  success: {
    /** Ripple wave stagger per card of distance (s). */
    rippleStaggerS: number;
    /** Ripple push-down amplitude at distance 1 (px). */
    rippleBaseYOffsetPx: number;
    /** Ripple amplitude halves every this many cards of distance. */
    rippleHalfLifeCards: number;
    /** Ripple push-down phase duration (s). */
    ripplePushDurationS: number;
    /** Ripple spring-back (low damping = visible oscillation). */
    rippleReturnSpring: SpringParams;
    /** How long ripple state is kept before cleanup (ms). */
    rippleCleanupMs: number;
    /** Placed-card landing bounce. */
    bounceSpring: SpringParams;
    /** Year label pop duration (s) and peak scale. */
    yearPopDurationS: number;
    yearPopPeakScale: number;
    /** Success flash phase: input unlocks after this (ms). */
    flashMs: number;
    /** Success glow CSS animation duration (s) — via --anim-glow-dur. */
    glowDurS: number;
  };
  miss: {
    /** Red flash at the attempted slot before the card travels (ms). */
    flashMs: number;
    /** Travel duration = clamp(base + perRow·distance, min, max) (ms). */
    travelBaseMs: number;
    travelPerRowMs: number;
    travelMinMs: number;
    travelMaxMs: number;
    /** Extra input lock after travel so wake springs settle (ms). */
    settleMarginMs: number;
    /** Tombstone at-rest x/opacity spring (displaced slide). */
    restSpring: SpringParams;
    /** Rejected-card exit spring (unused visually during reveal FLIP). */
    rejectionSpring: SpringParams;
    /** Error pulse CSS animation duration (s) — via --anim-error-pulse-dur. */
    errorPulseDurS: number;
  };
  wake: {
    /** Bump amplitude as the traveling card passes each row (px). */
    amplitudePx: number;
    /** Bump fires this long after the mover's passage moment (s). */
    bumpOffsetS: number;
    /** Rows the wave runs out past the landing gap. */
    runOutBumps: number;
    /** First run-out bump delay after landing (s), step between bumps (s). */
    runOutBaseDelayS: number;
    runOutStepS: number;
    /** Run-out amplitude decay factor per row. */
    runOutDecay: number;
    /** Path rows start parting this long before the mover arrives (s). */
    layoutShiftLeadS: number;
    /** Spring for the one-row layout shift of path rows. */
    layoutShiftSpring: SpringParams;
  };
}

export const DEFAULT_TUNING: AnimationTuning = {
  success: {
    rippleStaggerS: 0.2,
    rippleBaseYOffsetPx: 6,
    rippleHalfLifeCards: 1.0,
    ripplePushDurationS: 0.15,
    rippleReturnSpring: { stiffness: 150, damping: 4, mass: 1 },
    rippleCleanupMs: 2000,
    bounceSpring: { stiffness: 400, damping: 25 },
    yearPopDurationS: 0.4,
    yearPopPeakScale: 1.3,
    flashMs: 600,
    glowDurS: 0.6,
  },
  miss: {
    flashMs: 400,
    travelBaseMs: 550,
    travelPerRowMs: 170,
    travelMinMs: 700,
    travelMaxMs: 1500,
    settleMarginMs: 200,
    restSpring: { stiffness: 400, damping: 30 },
    rejectionSpring: { stiffness: 300, damping: 20 },
    errorPulseDurS: 0.6,
  },
  wake: {
    amplitudePx: 5,
    bumpOffsetS: 0.05,
    runOutBumps: 2,
    runOutBaseDelayS: 0.06,
    runOutStepS: 0.12,
    runOutDecay: 0.5,
    layoutShiftLeadS: 0.1,
    layoutShiftSpring: { stiffness: 350, damping: 22 },
  },
};

// Miss-reveal choreography timings, shared with Timeline (travel tween + wake stagger).
// flash: red pulse at the attempted slot; travel: FLIP glide to the correct gap.
export const MISS_FLASH_MS = DEFAULT_TUNING.miss.flashMs;

// Travel time scales with how far off the guess was, so the card visibly journeys to
// its true spot (a 1-row miss glides ~0.7s; a far miss up to 1.5s).
export function getMissTravelMs(
  pathLen: number,
  m: AnimationTuning['miss'] = DEFAULT_TUNING.miss
): number {
  return Math.min(
    Math.max(m.travelBaseMs + m.travelPerRowMs * pathLen, m.travelMinMs),
    m.travelMaxMs
  );
}

// Cubic ease-out: the failed card launches quickly and decelerates into its true slot.
// invTravelEase is its analytic inverse — Timeline schedules the trailing wake by
// inverting this exact curve, so THE TWO MUST STAY IN SYNC. If the ease ever becomes
// tunable, restrict it to a preset list of (ease, inverse) pairs with closed-form
// inverses (e.g. 1-(1-p)^(1/n) families); a free bezier has no analytic inverse.
export const TRAVEL_EASE: [number, number, number, number] = [0.33, 1, 0.68, 1];
export const invTravelEase = (p: number) => 1 - Math.pow(1 - p, 1 / 3);

export const AnimationTuningContext = createContext<AnimationTuning>(DEFAULT_TUNING);
export const useAnimationTuning = () => useContext(AnimationTuningContext);

/**
 * Time-stretch a spring by 1/speed while preserving its damping ratio (same
 * trajectory, slower): stiffness scales with speed², damping with speed.
 */
export function scaleSpring(s: SpringParams, speed: number): SpringParams {
  if (speed === 1) return s;
  return {
    stiffness: s.stiffness * speed * speed,
    damping: s.damping * speed,
    ...(s.mass !== undefined ? { mass: s.mass } : {}),
  };
}

/**
 * Slow every duration/delay in the tuning by 1/speed (0.5 = half speed) for the
 * jig's slow-mo. Dimensionless fields (amplitudes, scales, counts, decay) are
 * untouched. Identity at speed 1 so the default path stays referentially stable.
 */
export function scaleTuning(t: AnimationTuning, speed: number): AnimationTuning {
  if (speed === 1) return t;
  return {
    success: {
      ...t.success,
      rippleStaggerS: t.success.rippleStaggerS / speed,
      ripplePushDurationS: t.success.ripplePushDurationS / speed,
      rippleReturnSpring: scaleSpring(t.success.rippleReturnSpring, speed),
      rippleCleanupMs: t.success.rippleCleanupMs / speed,
      bounceSpring: scaleSpring(t.success.bounceSpring, speed),
      yearPopDurationS: t.success.yearPopDurationS / speed,
      flashMs: t.success.flashMs / speed,
      glowDurS: t.success.glowDurS / speed,
    },
    miss: {
      ...t.miss,
      flashMs: t.miss.flashMs / speed,
      travelBaseMs: t.miss.travelBaseMs / speed,
      travelPerRowMs: t.miss.travelPerRowMs / speed,
      travelMinMs: t.miss.travelMinMs / speed,
      travelMaxMs: t.miss.travelMaxMs / speed,
      settleMarginMs: t.miss.settleMarginMs / speed,
      restSpring: scaleSpring(t.miss.restSpring, speed),
      rejectionSpring: scaleSpring(t.miss.rejectionSpring, speed),
      errorPulseDurS: t.miss.errorPulseDurS / speed,
    },
    wake: {
      ...t.wake,
      bumpOffsetS: t.wake.bumpOffsetS / speed,
      runOutBaseDelayS: t.wake.runOutBaseDelayS / speed,
      runOutStepS: t.wake.runOutStepS / speed,
      layoutShiftLeadS: t.wake.layoutShiftLeadS / speed,
      layoutShiftSpring: scaleSpring(t.wake.layoutShiftSpring, speed),
    },
  };
}
