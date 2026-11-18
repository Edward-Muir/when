import {
  WHEEL_TUNING,
  stripPosition,
  wheelCardScale,
  wheelGeometry,
  wheelPose,
  wheelRowHeight,
  wheelScreenY,
} from './wheelMath';

// The two card sizes the board has, with the `--wheel-pitch` index.css gives each.
const PHONE = { slot: 70, rowHeight: 83 };
const WIDE = { slot: 96, rowHeight: 111 };
const HALF = 290;
const geo = wheelGeometry({ half: HALF, ...PHONE });

describe('wheelRowHeight', () => {
  it('matches --wheel-pitch in index.css for both card sizes', () => {
    expect(wheelRowHeight(PHONE.slot)).toBe(PHONE.rowHeight);
    expect(wheelRowHeight(WIDE.slot)).toBe(WIDE.rowHeight);
  });
});

describe('wheelCardScale', () => {
  it('is the height the pose gives the card over its resting height', () => {
    expect(wheelCardScale(17.5, 70, Infinity)).toBeCloseTo(1.25);
    expect(wheelCardScale(0, 70, Infinity)).toBe(1);
  });

  it('stops where the card would reach the edge of the screen', () => {
    // A 360px phone has room for about 8% beside a 228px card.
    expect(wheelCardScale(17.5, 70, 1.08)).toBeCloseTo(1.08);
  });

  it('never shrinks a card, even one already too wide for the screen', () => {
    expect(wheelCardScale(17.5, 70, 0.9)).toBe(1);
    expect(wheelCardScale(17.5, 0, 2)).toBe(1);
  });
});

describe('wheelPose', () => {
  it('leaves the centred row where layout put it, upright and fully magnified', () => {
    const pose = wheelPose(0, geo);
    expect(pose.y).toBeCloseTo(0);
    expect(pose.z).toBeCloseTo(0);
    expect(pose.tilt).toBe(0);
    expect(pose.focus).toBe(1);
    expect(pose.yearDim).toBe(1);
    expect(pose.dim).toBe(1);
    // The room a card scaled by `magnify` needs over its resting slot.
    expect(pose.grow).toBeCloseTo(PHONE.slot * (WHEEL_TUNING.magnify - 1));
    expect(wheelCardScale(pose.grow, PHONE.slot, Infinity)).toBeCloseTo(WHEEL_TUNING.magnify);
  });

  it('moves the centred card exactly with the scroll', () => {
    // The whole point of laying rows out tall: one px of scroll is one px on screen there.
    const moved = wheelPose(1, geo).y + 1 - (wheelPose(-1, geo).y - 1);
    expect(moved / 2).toBeCloseTo(1, 2);
  });

  it('moves the rows further out more slowly than the scroll', () => {
    const x = 2.5 * PHONE.rowHeight;
    const speed = (wheelPose(x + 1, geo).y + 1 - (wheelPose(x - 1, geo).y - 1)) / 2;
    // By about the ratio of a resting row to a laid-out one (78 / 83): the softer the
    // magnifier, the nearer the outer rows come to the scroll's own speed.
    expect(speed).toBeLessThan(0.97);
    expect(speed).toBeGreaterThan(0.5);
  });

  it('is symmetric about the centre, with the tilt mirrored', () => {
    for (const x of [10, 60, 83, 166, 400, 900]) {
      const below = wheelPose(x, geo);
      const above = wheelPose(-x, geo);
      expect(above.y).toBeCloseTo(-below.y);
      expect(above.tilt).toBeCloseTo(-below.tilt);
      expect(above.grow).toBeCloseTo(below.grow);
      expect(above.focus).toBeCloseTo(below.focus);
      // Rows above the centre lean their top edge away.
      expect(above.tilt).toBeGreaterThan(0);
    }
  });

  it('magnifies as a bell: each row out is smaller than the last, and never under rest', () => {
    const grows = [0, 1, 2, 3, 4, 5].map((i) => wheelPose(i * PHONE.rowHeight, geo).grow);
    grows.reduce((previous, grow) => {
      expect(grow).toBeLessThan(previous);
      expect(grow).toBeGreaterThanOrEqual(-0.001);
      return grow;
    }, Infinity);
    // The neighbours are part-magnified, which is what makes the growth gradual.
    expect(grows[1] / grows[0]).toBeGreaterThan(0.4);
    expect(grows[5]).toBeLessThan(0.5);
  });

  it('never lets rows cross: the strip is strictly increasing, and so is its painting', () => {
    let prevStrip = stripPosition(-1500, geo);
    let prevScreen = wheelScreenY(prevStrip, geo);
    for (let d = -1499; d <= 1500; d += 1) {
      const strip = stripPosition(d, geo);
      const screen = wheelScreenY(strip, geo);
      expect(strip).toBeGreaterThan(prevStrip);
      // The painting only has to keep its order where it can be seen: far round the cylinder
      // the surface turns away, well outside the viewport.
      const visible = Math.abs(screen) <= HALF * 1.5 && Math.abs(prevScreen) <= HALF * 1.5;
      expect(!visible || screen > prevScreen).toBe(true);
      prevStrip = strip;
      prevScreen = screen;
    }
  });

  it('gives each row exactly the room its neighbours make: opened rows butt together', () => {
    const h = PHONE.rowHeight;
    const toStrip = geo.pitch / h;
    for (let shift = 0; shift < h; shift += 7) {
      for (let i = -4; i < 4; i += 1) {
        const x = i * h - shift;
        const upper = wheelPose(x, geo);
        const lower = wheelPose(x + h, geo);
        // Each row's opened extent, from its own pose.
        const upperExtent = upper.railScale * h;
        const lowerExtent = lower.railScale * h;
        const upperBottom = stripPosition((x + h / 2) * toStrip, geo);
        const lowerTop = stripPosition((x + h / 2) * toStrip, geo);
        expect(upperBottom).toBeCloseTo(lowerTop, 9);
        // A card is its row's extent less the gap, so two cards are always a gap apart.
        expect(upper.grow + PHONE.slot).toBeCloseTo(upperExtent - WHEEL_TUNING.gap, 6);
        expect(lower.grow + PHONE.slot).toBeCloseTo(lowerExtent - WHEEL_TUNING.gap, 6);
      }
    }
  });

  it('stays subtle: a few degrees of lean and a few percent of depth at the edge', () => {
    const edge = wheelPose(2.6 * PHONE.rowHeight, geo);
    expect(Math.abs(edge.tilt)).toBeLessThan((15 * Math.PI) / 180);
    expect(Math.abs(edge.z)).toBeLessThan(WHEEL_TUNING.perspective * 0.05);
  });

  it('keeps every card at least a touch target tall', () => {
    for (let x = -1500; x <= 1500; x += 5) {
      const pose = wheelPose(x, geo);
      // Only the rows that are on screen can be touched.
      if (Math.abs(x + pose.y) > HALF) continue;
      const depth = WHEEL_TUNING.perspective / (WHEEL_TUNING.perspective - pose.z);
      const painted = (PHONE.slot + pose.grow) * Math.cos(pose.tilt) * depth;
      expect(painted).toBeGreaterThanOrEqual(44);
    }
  });

  it('keeps the years legible away from the centre', () => {
    expect(wheelPose(900, geo).yearDim).toBeCloseTo(WHEEL_TUNING.yearFloor);
    expect(WHEEL_TUNING.yearFloor).toBeGreaterThanOrEqual(0.6);
  });

  it('is flat when there is nothing to measure against', () => {
    expect(wheelPose(120, wheelGeometry({ half: 0, ...PHONE })).y).toBe(0);
    expect(wheelPose(120, wheelGeometry({ half: HALF, ...PHONE, rowHeight: 0 })).grow).toBe(0);
  });
});
