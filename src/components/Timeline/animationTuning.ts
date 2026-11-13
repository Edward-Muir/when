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
    /** Miss-wake bump: push-down phase duration (s). The success wave is `shock`, below. */
    ripplePushDurationS: number;
    /** Miss-wake bump: spring-back (low damping = visible oscillation). */
    rippleReturnSpring: SpringParams;
    /** How long wave state is kept before cleanup (ms). */
    rippleCleanupMs: number;
    /** Year label pop duration (s) and peak scale. */
    yearPopDurationS: number;
    yearPopPeakScale: number;
    /** Success flash phase: input unlocks after this (ms). */
    flashMs: number;
    /** Success glow CSS animation duration (s) — via --anim-glow-dur. */
    glowDurS: number;
  };
  /**
   * The correct-placement shockwave: rows kicked away from the placed card in one damped pulse,
   * with a light running along the rail in step. The maths is in `shockwave.ts`.
   */
  shock: {
    /**
     * Nothing starts until the carried card is seated in its row (s). The drop glides the card
     * in over `SETTLE_SEATED_MS` (HandDragOverlay); a wave that started at the drop would play
     * its first frames underneath that card. A test pins the two together.
     */
    landDelayS: number;
    /** The front reaches the nearest row after this long, and each row after (ms). */
    frontMsPerRow: number;
    /** ...plus this much more per row squared, so the front slows as it travels (ms). */
    frontSlowMsPerRow2: number;
    /** Peak displacement of the nearest row at a streak of 1, before `kickBase` (px). */
    kickPx: number;
    /** The kick halves every this many rows out. */
    halfLifeRows: number;
    /** Rate of the pulse's rebound (Hz) and how fast it dies away (1/s). */
    reboundHz: number;
    settle: number;
    /** Opacity of the light on the rail at its brightest, 0..1. */
    lightBrightness: number;
    /** How steeply everything below builds with the streak. 0 = every card lands the same. */
    streakGain: number;
    /** Kick multiplier = kickBase + kickBuild x build, where build runs 0..streakGain. */
    kickBase: number;
    kickBuild: number;
    /** Placed card's dip into the rail = dipPx + dipBuildPx x build (px). */
    dipPx: number;
    dipBuildPx: number;
    /** Card glow and rail light sizes = 1 + (their build) x build. */
    glowBuild: number;
    lightBuild: number;
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
  tick: {
    /**
     * Dot → dash morph: the marker's shape becoming the tick's. Keep it at or past critical
     * damping — `damping >= 2 * sqrt(stiffness * mass)`. The dash's right edge _is_ the board
     * column's seam (`tick.right === rail.left`, see index.css), so an under-damped morph
     * overshoots the tick off the rail and drops it back: a hairline of daylight that opens and
     * closes at the join. The growth is the juice here; the arrival is not meant to bounce.
     */
    morphSpring: SpringParams;
    /** How long the landed tick takes to give up the marker's glow (s). */
    glowDecayS: number;
    /** A wrong drop snuffs the marker where it stands over this long (s). */
    snuffS: number;
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
    ripplePushDurationS: 0.15,
    rippleReturnSpring: { stiffness: 150, damping: 4, mass: 1 },
    rippleCleanupMs: 2000,
    yearPopDurationS: 0.4,
    yearPopPeakScale: 1.3,
    flashMs: 600,
    glowDurS: 0.6,
  },
  shock: {
    landDelayS: 0.09,
    frontMsPerRow: 65,
    frontSlowMsPerRow2: 8,
    kickPx: 7,
    halfLifeRows: 2.2,
    reboundHz: 3,
    settle: 9,
    lightBrightness: 1,
    // 0.55 of what the rig first showed: about 6px at a streak of 1 building to about 15px at 8.
    streakGain: 0.55,
    kickBase: 0.86,
    kickBuild: 2.28,
    dipPx: 2,
    dipBuildPx: 8,
    glowBuild: 0.9,
    lightBuild: 0.7,
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
  tick: {
    // damping 38 ≥ 2·√(420 · 0.8) = 36.7 — critically damped, so the dash cannot lift off the rail.
    morphSpring: { stiffness: 420, damping: 38, mass: 0.8 },
    glowDecayS: 0.4,
    snuffS: 0.35,
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
      ripplePushDurationS: t.success.ripplePushDurationS / speed,
      rippleReturnSpring: scaleSpring(t.success.rippleReturnSpring, speed),
      rippleCleanupMs: t.success.rippleCleanupMs / speed,
      yearPopDurationS: t.success.yearPopDurationS / speed,
      flashMs: t.success.flashMs / speed,
      glowDurS: t.success.glowDurS / speed,
    },
    shock: {
      ...t.shock,
      landDelayS: t.shock.landDelayS / speed,
      frontMsPerRow: t.shock.frontMsPerRow / speed,
      frontSlowMsPerRow2: t.shock.frontSlowMsPerRow2 / speed,
      // Rates, not durations: a slower clock means fewer cycles a second.
      reboundHz: t.shock.reboundHz * speed,
      settle: t.shock.settle * speed,
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
    tick: {
      ...t.tick,
      morphSpring: scaleSpring(t.tick.morphSpring, speed),
      glowDecayS: t.tick.glowDecayS / speed,
      snuffS: t.tick.snuffS / speed,
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
