import { SETTLE_SEATED_MS } from '../HandDragOverlay';
import { DEFAULT_TUNING, scaleTuning } from './animationTuning';
import {
  MAX_BUILD_STREAK,
  sampleShock,
  shockDelayS,
  shockDipPx,
  shockDurationS,
  shockGlowScale,
  shockKickPx,
  shockPeakS,
  shockPulse,
  shockReach,
  streakBuild,
} from './shockwave';

const shock = DEFAULT_TUNING.shock;

describe('shockPulse', () => {
  it('is at rest before it starts', () => {
    expect(shockPulse(0, shock)).toBe(0);
    expect(shockPulse(-0.1, shock)).toBe(0);
  });

  it('peaks at exactly 1, at shockPeakS', () => {
    const peak = shockPeakS(shock);
    expect(shockPulse(peak, shock)).toBeCloseTo(1, 6);
    expect(shockPulse(peak - 0.01, shock)).toBeLessThan(1);
    expect(shockPulse(peak + 0.01, shock)).toBeLessThan(1);
  });

  it('rebounds once past rest, by much less than the kick', () => {
    let trough = 0;
    for (let t = 0; t < 1; t += 0.002) trough = Math.min(trough, shockPulse(t, shock));
    expect(trough).toBeLessThan(-0.1);
    expect(trough).toBeGreaterThan(-0.4);
  });

  // The old ripple rang for about two seconds. This one must be still well inside one.
  it('is still by 700ms even for the hardest hit', () => {
    const hardest = shockKickPx(1, MAX_BUILD_STREAK, shock);
    for (let t = 0.7; t < 2; t += 0.01) {
      expect(Math.abs(hardest * shockPulse(t, shock))).toBeLessThan(0.3);
    }
  });
});

describe('the landing', () => {
  // The wave must not start under the card the player is still putting down. If the drop is
  // retimed in HandDragOverlay, retime `landDelayS` with it.
  it('waits for the carried card to be seated', () => {
    expect(Math.abs(shock.landDelayS * 1000 - SETTLE_SEATED_MS)).toBeLessThanOrEqual(5);
  });
});

describe('the front', () => {
  it('reaches the third row out in under 300ms', () => {
    expect(shockDelayS(3, shock)).toBeLessThan(0.3);
  });

  it('slows as it travels', () => {
    const near = shockDelayS(2, shock) - shockDelayS(1, shock);
    const far = shockDelayS(6, shock) - shockDelayS(5, shock);
    expect(far).toBeGreaterThan(near);
  });

  it('fades with distance, halving every halfLifeRows', () => {
    expect(shockReach(1, shock)).toBe(1);
    expect(shockReach(1 + shock.halfLifeRows, shock)).toBeCloseTo(0.5);
  });
});

describe('the streak build', () => {
  it('starts from nothing and stops growing at the cap', () => {
    expect(streakBuild(0, shock)).toBe(0);
    expect(streakBuild(1, shock)).toBe(0);
    expect(streakBuild(MAX_BUILD_STREAK, shock)).toBeCloseTo(shock.streakGain);
    expect(streakBuild(40, shock)).toBeCloseTo(shock.streakGain);
  });

  // The complaint this replaced: four tiers, so most correct cards looked like the last one.
  it('lands harder with every correct card up to the cap', () => {
    for (let streak = 1; streak < MAX_BUILD_STREAK; streak++) {
      expect(shockKickPx(1, streak + 1, shock)).toBeGreaterThan(shockKickPx(1, streak, shock));
      expect(shockDipPx(streak + 1, shock)).toBeGreaterThan(shockDipPx(streak, shock));
      expect(shockGlowScale(streak + 1, shock)).toBeGreaterThan(shockGlowScale(streak, shock));
    }
  });

  it('keeps the shipped range: about 6px at a streak of 1, about 15px at 8', () => {
    expect(shockKickPx(1, 1, shock)).toBeCloseTo(6.02);
    expect(shockKickPx(1, MAX_BUILD_STREAK, shock)).toBeCloseTo(14.8, 1);
  });
});

describe('sampleShock', () => {
  it('starts and ends at rest and reaches the amplitude', () => {
    const frames = sampleShock(-10, shock);
    expect(frames[0]).toBeCloseTo(0);
    expect(frames[frames.length - 1]).toBe(0);
    // Sampled, so the peak falls between two frames: within 5% of the true amplitude.
    expect(Math.min(...frames)).toBeLessThan(-9.5);
    expect(Math.min(...frames)).toBeGreaterThanOrEqual(-10);
  });

  it('plays the same curve in slow motion', () => {
    const slow = scaleTuning(DEFAULT_TUNING, 0.25).shock;
    expect(shockDurationS(slow)).toBeCloseTo(shockDurationS(shock) * 4);
    const normal = sampleShock(1, shock);
    sampleShock(1, slow).forEach((v, i) => expect(v).toBeCloseTo(normal.at(i) ?? NaN));
  });
});
