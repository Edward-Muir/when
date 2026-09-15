import { DEFAULT_TUNING, getMissTravelMs, TRAVEL_EASE } from './animationTuning';
import {
  RAIL_TO_TICK,
  dotStart,
  landingKeyframes,
  landingTransition,
  DOT_H,
  DOT_W,
  TICK_H,
  TICK_W,
} from './tickLanding';

/** A dash at rest where the board column actually puts it: board-left 84→96, 12×4. */
const restAt = (left: number, top: number) => ({ left, top, width: TICK_W, height: TICK_H });

describe('dotStart', () => {
  // The whole design rests on this: the 8px between the dash's centre and the rail's is never
  // written down anywhere, it falls out of measuring both ends. Move the board column and the
  // landing follows it instead of quietly pointing at the wrong place.
  it('derives the offset from the two measurements, not from a constant', () => {
    // Marker on the rail's centre (board-left + 98), dash at board-left 84→96. The dot's left
    // edge wants to be at 95, and the inner box's own left is 84, so the transform is +11.
    expect(dotStart({ x: 98, y: 302 }, restAt(84, 300))).toEqual({ x: 11, y: -2 });
    // The same drop against a gutter widened by 16px gives the same transform, because both
    // ends moved together. Nothing here knows the gutter is 96px.
    expect(dotStart({ x: 114, y: 302 }, restAt(100, 300))).toEqual({ x: 11, y: -2 });
  });

  it('accounts for the dot and the dash having different sizes', () => {
    // Dot centred exactly on the dash's rest centre: the offset is not zero, because the two
    // boxes are anchored top-left and the dot is 6px narrower and 4px taller.
    const start = dotStart({ x: 90, y: 302 }, restAt(84, 300));
    expect(start).toEqual({ x: (TICK_W - DOT_W) / 2, y: (TICK_H - DOT_H) / 2 });
    expect(start).toEqual({ x: 3, y: -2 });
  });

  it('carries a vertical miss through, so the dot can travel a row', () => {
    // A drop gap that already held a tombstone can put the new row a whole row away.
    expect(dotStart({ x: 98, y: 302 }, restAt(84, 388)).y).toBe(-90);
  });
});

describe('RAIL_TO_TICK', () => {
  // The step the marker takes off the rail as it snuffs. It falls out of the board column
  // invariant — tick.right === rail.left, a 12px dash and a 4px rail — and is the one number
  // here that cannot be measured, because it is needed before the dash exists.
  it('is half a dash plus half a rail', () => {
    expect(RAIL_TO_TICK).toBe(8);
    // The same distance the measured path arrives at, from a marker on the rail's centre.
    expect(dotStart({ x: 98, y: 302 }, restAt(84, 300)).x - (TICK_W - DOT_W) / 2).toBe(
      RAIL_TO_TICK
    );
  });
});

describe('landingKeyframes', () => {
  it('starts as the marker and ends as the dash', () => {
    const k = landingKeyframes({ x: 11, y: -2 });
    expect(k.x).toEqual([11, 0]);
    expect(k.y).toEqual([-2, 0]);
    expect(k.width).toEqual([DOT_W, TICK_W]);
    expect(k.height).toEqual([DOT_H, TICK_H]);
    expect(k.borderRadius[1]).toBe(0);
  });
});

describe('landingTransition', () => {
  const { tick } = DEFAULT_TUNING;

  it('is one morph when there is no travel', () => {
    const t = landingTransition(tick, undefined);
    expect(t.default).toEqual({ type: 'spring', ...tick.morphSpring });
    expect('x' in t).toBe(false);
  });

  // The dot escorts the rejected card to its true slot. If these two clocks ever drift apart
  // the dot arrives before or after the card it is supposed to be travelling with, which reads
  // worse than not escorting it at all. Same tripwire as TRAVEL_EASE/invTravelEase.
  it('rides the reveal FLIP on the same clock and ease, then grows on arrival', () => {
    const travelMs = getMissTravelMs(3);
    const t = landingTransition(tick, travelMs);
    expect(t.x).toEqual({ type: 'tween', duration: travelMs / 1000, ease: TRAVEL_EASE });
    expect(t.y).toEqual(t.x);
    expect(t.default).toEqual({
      type: 'spring',
      ...tick.morphSpring,
      delay: travelMs / 1000,
    });
  });
});
