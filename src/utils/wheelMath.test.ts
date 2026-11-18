import {
  WHEEL_TUNING,
  stripPosition,
  wheelCardShape,
  wheelGeometry,
  wheelPose,
  wheelRowHeight,
  wheelScreenY,
} from './wheelMath';

// The two card sizes the board has, with the `--wheel-pitch` index.css gives each.
const PHONE = { slot: 70, cardWidth: 228, rowHeight: 86 };
const WIDE = { slot: 96, cardWidth: 280, rowHeight: 114 };
const HALF = 290;
const geo = wheelGeometry({ half: HALF, ...PHONE });

describe('wheelRowHeight', () => {
  it('matches --wheel-pitch in index.css for both card sizes', () => {
    expect(wheelRowHeight(PHONE.slot, PHONE.cardWidth)).toBe(PHONE.rowHeight);
    expect(wheelRowHeight(WIDE.slot, WIDE.cardWidth)).toBe(WIDE.rowHeight);
  });
});

describe('wheelCardShape', () => {
  // The centred card's two parts: how far its frame opens, and the scale on the opened card.
  const open = WHEEL_TUNING.reveal * (WHEEL_TUNING.artRatio * PHONE.cardWidth - PHONE.slot);

  it('opens and scales the centred card by the tuning, and adds up to its grow', () => {
    const shape = wheelCardShape(geo.grow, geo, Infinity);
    expect(shape.open).toBeCloseTo(open);
    expect(shape.scale).toBeCloseTo(WHEEL_TUNING.magnify);
    expect((PHONE.slot + shape.open) * shape.scale).toBeCloseTo(PHONE.slot + geo.grow);
  });

  it('gives a part-grown row the same share of each, still adding up to its grow', () => {
    for (const grow of [0, geo.grow * 0.25, geo.grow * 0.6]) {
      const shape = wheelCardShape(grow, geo, Infinity);
      expect(shape.open).toBeCloseTo((open * grow) / geo.grow);
      expect(shape.scale).toBeGreaterThanOrEqual(1);
      expect((PHONE.slot + shape.open) * shape.scale).toBeCloseTo(PHONE.slot + grow);
    }
    expect(wheelCardShape(0, geo, Infinity)).toEqual({ open: 0, scale: 1 });
  });

  it('stops scaling where the card would reach the edge of the screen', () => {
    // Narrower than the tuned scale: the frame still opens, only the scale is held.
    const shape = wheelCardShape(geo.grow, geo, 1.02);
    expect(shape.scale).toBeCloseTo(1.02);
    expect(shape.open).toBeCloseTo(open);
  });

  it('never shrinks a card, even one already too wide for the screen', () => {
    expect(wheelCardShape(geo.grow, geo, 0.9).scale).toBe(1);
  });
});

describe('wheelPose', () => {
  it('leaves the centred row where layout put it, upright and fully grown', () => {
    const pose = wheelPose(0, geo);
    expect(pose.y).toBeCloseTo(0);
    expect(pose.z).toBeCloseTo(0);
    expect(pose.tilt).toBe(0);
    expect(pose.focus).toBe(1);
    expect(pose.yearDim).toBe(1);
    expect(pose.dim).toBe(1);
    // The room the card needs over its resting slot: opened by `reveal`, then scaled.
    const open = WHEEL_TUNING.reveal * (WHEEL_TUNING.artRatio * PHONE.cardWidth - PHONE.slot);
    expect(pose.grow).toBeCloseTo((PHONE.slot + open) * WHEEL_TUNING.magnify - PHONE.slot);
  });

  it('moves the centred card exactly with the scroll', () => {
    // The whole point of laying rows out tall: one px of scroll is one px on screen there.
    const moved = wheelPose(1, geo).y + 1 - (wheelPose(-1, geo).y - 1);
    expect(moved / 2).toBeCloseTo(1, 2);
  });

  it('moves the rows further out more slowly than the scroll', () => {
    const x = 2.5 * PHONE.rowHeight;
    const speed = (wheelPose(x + 1, geo).y + 1 - (wheelPose(x - 1, geo).y - 1)) / 2;
    // By about the ratio of a resting row to a laid-out one (78 / 86): the less the centre
    // grows, the nearer the outer rows come to the scroll's own speed.
    expect(speed).toBeLessThan(0.97);
    expect(speed).toBeGreaterThan(0.5);
  });

  it('is symmetric about the centre, with the tilt mirrored', () => {
    for (const x of [10, 60, 86, 172, 400, 900]) {
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

  it('grows as a bell: each row out is smaller than the last, and never under rest', () => {
    const grows = [0, 1, 2, 3, 4, 5].map((i) => wheelPose(i * PHONE.rowHeight, geo).grow);
    grows.reduce((previous, grow) => {
      expect(grow).toBeLessThan(previous);
      expect(grow).toBeGreaterThanOrEqual(-0.001);
      return grow;
    }, Infinity);
    // The neighbours are part-grown, which is what makes the growth gradual.
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
