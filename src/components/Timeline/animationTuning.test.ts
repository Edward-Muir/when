import {
  AnimationTuning,
  DEFAULT_TUNING,
  MISS_FLASH_MS,
  getMissTravelMs,
  scaleSpring,
  scaleTuning,
  TRAVEL_EASE,
  invTravelEase,
} from './animationTuning';

describe('DEFAULT_TUNING', () => {
  // Regression tripwire: these are the shipped animation values. The tuning refactor
  // must not change game behavior — update this literal only for a deliberate retune.
  it('matches the shipped animation values', () => {
    const shipped: AnimationTuning = {
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
    expect(DEFAULT_TUNING).toEqual(shipped);
    expect(MISS_FLASH_MS).toBe(400);
  });
});

describe('getMissTravelMs', () => {
  it('clamps base + perRow·distance into [min, max]', () => {
    expect(getMissTravelMs(1)).toBe(720); // 550 + 170
    expect(getMissTravelMs(5)).toBe(1400); // 550 + 850
    expect(getMissTravelMs(6)).toBe(1500); // clamped to max
    expect(getMissTravelMs(0)).toBe(700); // clamped to min
    expect(getMissTravelMs(100)).toBe(1500);
  });

  it('accepts tuning overrides', () => {
    const miss = { ...DEFAULT_TUNING.miss, travelBaseMs: 100, travelPerRowMs: 50, travelMinMs: 0 };
    expect(getMissTravelMs(2, miss)).toBe(200);
  });
});

describe('TRAVEL_EASE / invTravelEase sync', () => {
  it('invTravelEase inverts cubic-out at the sample points the wake uses', () => {
    // cubic-out: p = 1 − (1−t)³, so invTravelEase(p) must return t
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const p = 1 - Math.pow(1 - t, 3);
      expect(invTravelEase(p)).toBeCloseTo(t, 10);
    }
    expect(TRAVEL_EASE).toEqual([0.33, 1, 0.68, 1]);
  });
});

describe('time scaling', () => {
  it('is the identity at speed 1', () => {
    expect(scaleTuning(DEFAULT_TUNING, 1)).toBe(DEFAULT_TUNING);
    expect(scaleSpring(DEFAULT_TUNING.success.bounceSpring, 1)).toBe(
      DEFAULT_TUNING.success.bounceSpring
    );
  });

  it('stretches durations and preserves spring damping ratio at half speed', () => {
    const half = scaleTuning(DEFAULT_TUNING, 0.5);
    expect(half.miss.flashMs).toBe(800);
    expect(half.miss.travelBaseMs).toBe(1100);
    expect(half.success.rippleStaggerS).toBeCloseTo(0.4);
    expect(half.success.glowDurS).toBeCloseTo(1.2);
    // Amplitudes / counts / decay untouched
    expect(half.wake.amplitudePx).toBe(5);
    expect(half.wake.runOutBumps).toBe(2);
    expect(half.wake.runOutDecay).toBe(0.5);
    // Spring: stiffness × s², damping × s keeps zeta = damping / (2·sqrt(stiffness·mass))
    const orig = DEFAULT_TUNING.success.rippleReturnSpring;
    const scaled = half.success.rippleReturnSpring;
    expect(scaled.stiffness).toBeCloseTo(orig.stiffness * 0.25);
    expect(scaled.damping).toBeCloseTo(orig.damping * 0.5);
    const zeta = (s: { stiffness: number; damping: number; mass?: number }) =>
      s.damping / (2 * Math.sqrt(s.stiffness * (s.mass ?? 1)));
    expect(zeta(scaled)).toBeCloseTo(zeta(orig));
  });
});
