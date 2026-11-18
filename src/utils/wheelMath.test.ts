import { wheelCardHeight, wheelOffset, wheelPose, WHEEL_TUNING } from './wheelMath';

const HALF = 330;
const PITCH = 88;
const SLOT = 80;

describe('wheelPose', () => {
  it('leaves the centred row where it is, upright, full size and fully grown', () => {
    const pose = wheelPose(0, HALF, PITCH);
    expect(pose.y).toBe(0);
    expect(pose.tilt).toBe(0);
    expect(pose.scale).toBe(1);
    expect(pose.focus).toBe(1);
    expect(pose.dim).toBe(1);
  });

  it('is symmetric about the centre, with the tilt mirrored', () => {
    for (const d of [10, 44, 88, 200, 330, 900]) {
      const below = wheelPose(d, HALF, PITCH);
      const above = wheelPose(-d, HALF, PITCH);
      expect(above.y).toBeCloseTo(-below.y);
      expect(above.tilt).toBeCloseTo(-below.tilt);
      expect(above.scale).toBeCloseTo(below.scale);
      expect(above.focus).toBeCloseTo(below.focus);
      // Rows above the centre lean their top edge away.
      expect(above.tilt).toBeGreaterThan(0);
    }
  });

  it('never lets rows cross: the painted offset is strictly increasing', () => {
    let prev = wheelOffset(-2000, HALF, PITCH);
    for (let d = -1999; d <= 2000; d += 1) {
      const next = wheelOffset(d, HALF, PITCH);
      expect(next).toBeGreaterThan(prev);
      prev = next;
    }
  });

  it('grows only the rows within one pitch of the centre', () => {
    expect(wheelPose(PITCH, HALF, PITCH).focus).toBe(0);
    expect(wheelPose(PITCH * 3, HALF, PITCH).focus).toBe(0);
    expect(wheelPose(PITCH / 2, HALF, PITCH).focus).toBeGreaterThan(0);
  });

  it('stops turning at the edge of the viewport', () => {
    const edge = wheelPose(HALF, HALF, PITCH);
    const beyond = wheelPose(HALF * 3, HALF, PITCH);
    expect(edge.tilt).toBeCloseTo(-WHEEL_TUNING.maxTilt);
    expect(beyond.tilt).toBeCloseTo(edge.tilt);
    expect(beyond.scale).toBeCloseTo(WHEEL_TUNING.minScale);
  });

  it('keeps every card at least a touch target tall', () => {
    for (let d = -1000; d <= 1000; d += 4) {
      expect(wheelCardHeight(wheelPose(d, HALF, PITCH), SLOT)).toBeGreaterThanOrEqual(44);
    }
  });

  it('keeps the centred card clear of its neighbours at rest and mid-turn', () => {
    for (let shift = 0; shift < PITCH; shift += 4) {
      const a = -shift;
      const b = PITCH - shift;
      const poseA = wheelPose(a, HALF, PITCH);
      const poseB = wheelPose(b, HALF, PITCH);
      const gap =
        b +
        poseB.y -
        (a + poseA.y) -
        wheelCardHeight(poseA, SLOT) / 2 -
        wheelCardHeight(poseB, SLOT) / 2;
      expect(gap).toBeGreaterThan(2);
    }
  });

  it('butts adjacent rail segments together exactly', () => {
    for (let d = -700; d <= 700; d += 13) {
      const upper = wheelPose(d, HALF, PITCH);
      const lower = wheelPose(d + PITCH, HALF, PITCH);
      const upperBottom = d + upper.y + upper.railY + (PITCH * upper.railScale) / 2;
      const lowerTop = d + PITCH + lower.y + lower.railY - (PITCH * lower.railScale) / 2;
      expect(upperBottom).toBeCloseTo(lowerTop, 6);
    }
  });

  it('is flat when there is no viewport to measure against', () => {
    expect(wheelPose(120, 0, PITCH).y).toBe(0);
    expect(wheelPose(120, HALF, 0).scale).toBe(1);
  });
});
