import { RefObject, useLayoutEffect, useRef } from 'react';
import {
  WHEEL_TUNING,
  WheelGeometry,
  wheelCardShape,
  wheelGeometry,
  wheelPose,
} from '../utils/wheelMath';
import { LANDSCAPE_CARD } from '../utils/cardSize';
import { useHaptics } from './useHaptics';

/**
 * Drives the timeline wheel: the card at the centre of the viewport opens a little, is slightly
 * magnified and faces the player, and the rows above and below lean back a few degrees on a
 * very large cylinder. Scrolling spins it, with a light haptic tick as each event passes the centre.
 *
 * The maths is `wheelMath.ts` and the paint is the `.wheel-*` rules in index.css. This hook
 * writes each row's pose whenever the board scrolls or its rows change.
 *
 * ## Rules this depends on
 *
 * - **The board is laid out tall and the pose only corrects it.** Rows are laid out at
 *   `--wheel-pitch`, the centred card's grown height, so the correction is zero at the centre:
 *   native scrolling moves the centred card and this hook has nothing to add there. That is
 *   what keeps the wheel smooth although the pose arrives a frame after the scroll.
 * - **One perspective for the whole board.** `perspective` is set on the content element, whose
 *   direct children are the rows, and its origin follows the viewport's centre. A perspective
 *   per card would give every card its own vanishing point and they would not read as one
 *   surface.
 * - **Positions are read with `offsetTop`, never `getBoundingClientRect`.** A rect includes the
 *   wheel's own transform, so reading one back would feed the pose into itself.
 * - **The row's transform is the wheel's alone.** It is written straight to the row wrapper,
 *   which nothing else transforms; every node inside a row already has a transform that
 *   framer-motion owns. Rows out of reach are left untransformed, so a long list (My Timeline is
 *   not virtualised) does not become thousands of compositor layers.
 * - **It is synchronous.** Scroll, resize and mutation callbacks all run before paint, so the
 *   pose is applied in them directly.
 * - **Each value is written to the one element that uses it, as a real property.** The card's
 *   slot gets its scale and opacity, the card its opening, the rail and the year their own
 *   transforms. The first build put them on the row as CSS custom properties and let the
 *   children read them with `var()`. Custom properties inherit, so every scroll frame
 *   restyled every element of every posed row: measured, style recalculation was the largest
 *   single cost of a scroll, several times the layout and the script together.
 * - **Values are quantised and only written when they change.** A row far from the centre has
 *   nothing left to change but its position, so it costs one transform a frame. The steps are
 *   under a tenth of a device pixel on screen.
 * - **Code that measures the board right after a commit calls `flushWheels()` first.** A layout
 *   effect runs before the mutation observer does, so a row that has just mounted has no pose
 *   yet; the drag marker and the landing tick would measure it where it is not going to be.
 *
 * A drag needs no special case: the board freezes its own scrolling for the length of one, so
 * the wheel holds its shape and only re-poses when the ghost row changes the layout.
 */

/** Marks one row of a wheel. On the element that is a direct, in-flow child of the content. */
export const WHEEL_ROW_ATTR = 'data-wheel-row';

/** One row of the wheel: where layout puts it, and the elements the wheel writes to. */
interface RowParts {
  el: HTMLElement;
  centre: number;
  height: number;
  /**
   * The elements below are looked up the first time the row is posed after a measure, not for
   * every row at every measure: My Timeline is not virtualised, and only the rows near the
   * viewport are ever posed. Any may be missing: the Archive has no display year, and a row
   * mid-swap may briefly have no card.
   */
  found: boolean;
  /** `.wheel-card`: scaled and dimmed. */
  slot: HTMLElement | null;
  /** `.wheel-card-face`, the slot's direct children: opened past the slot. */
  faces: HTMLElement[];
  rail: HTMLElement | null;
  year: HTMLElement | null;
  /** How much this row's year may grow: `--wheel-year-max`, set per label by YearLabel. */
  yearMax: number;
  /** The last values written, so an unchanged one is not written again. */
  last: {
    transform: string;
    scale: number;
    dim: number;
    open: number;
    rail: number;
    year: number;
    yearDim: number;
  };
}

/** The default for `--wheel-year-max` where a label does not set one. */
const YEAR_SWELL = 0.42;
/**
 * Each posed row is its own tilted layer, so two rail segments that meet exactly still show a
 * hairline where their antialiased ends touch. A pixel and a half of overlap hides it; the
 * segments are one opaque colour, so the overlap itself cannot be seen.
 */
const RAIL_OVERLAP = 0.012;
const NEVER = {
  transform: '',
  scale: NaN,
  dim: NaN,
  open: NaN,
  rail: NaN,
  year: NaN,
  yearDim: NaN,
};

/** Rounds to a step: coarse enough that most rows repeat their last value, too fine to see. */
const quantise = (n: number, step: number) => Math.round(n / step) * step;

/** How long after a touch or wheel event a scroll still counts as the player's own. */
const GESTURE_MS = 400;
/** The least time between two ticks, so a fling is a purr rather than a buzz. */
const TICK_GAP_MS = 45;
/** The least gap a magnified card keeps from the scroller's right edge, px. */
const EDGE_MARGIN = 6;

const round = (n: number) => Math.round(n * 1000) / 1000;

/** `el`'s top edge in `ancestor`'s scroll content, from layout alone (no transforms). */
export function layoutTop(el: HTMLElement, ancestor: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

/** `el`'s left edge in `ancestor`, from layout alone (no transforms). */
function layoutLeft(el: HTMLElement, ancestor: HTMLElement): number {
  let left = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return left;
}

/**
 * The `scrollTop` that puts `el`'s centre at the centre of `scroller`. From layout, so it is the
 * same answer whether or not the wheel is currently posing the row.
 */
export function centredScrollTop(scroller: HTMLElement, el: HTMLElement): number {
  return layoutTop(el, scroller) + el.offsetHeight / 2 - scroller.clientHeight / 2;
}

function clear(row: RowParts) {
  row.el.style.removeProperty('transform');
  row.slot?.style.removeProperty('transform');
  row.slot?.style.removeProperty('opacity');
  for (const face of row.faces) {
    face.style.removeProperty('top');
    face.style.removeProperty('height');
  }
  row.rail?.style.removeProperty('transform');
  row.year?.style.removeProperty('transform');
  row.year?.style.removeProperty('opacity');
  row.last = { ...NEVER };
}

function readRow(el: HTMLElement, scroller: HTMLElement): RowParts {
  const height = el.offsetHeight;
  return {
    el,
    centre: layoutTop(el, scroller) + height / 2,
    height,
    found: false,
    slot: null,
    faces: [],
    rail: null,
    year: null,
    yearMax: YEAR_SWELL,
    last: { ...NEVER },
  };
}

function findParts(row: RowParts) {
  const slot = row.el.querySelector<HTMLElement>('.wheel-card');
  const year = row.el.querySelector<HTMLElement>('.wheel-year');
  const yearMax = Number.parseFloat(year?.style.getPropertyValue('--wheel-year-max') ?? '');
  row.slot = slot;
  row.faces = slot
    ? Array.from(slot.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && child.classList.contains('wheel-card-face')
      )
    : [];
  row.rail = row.el.querySelector<HTMLElement>('.wheel-rail');
  row.year = year;
  row.yearMax = Number.isFinite(yearMax) ? yearMax : YEAR_SWELL;
  row.found = true;
}

class Wheel {
  private rows: RowParts[] = [];
  private posed = new Set<RowParts>();
  private contentTop = 0;
  private rowHeight = 0;
  private slot: number = LANDSCAPE_CARD.base.h;
  private cardWidth: number = LANDSCAPE_CARD.base.w;
  /** How far a card can scale before it reaches the scroller's right edge. */
  private fit = 1;
  private geo: WheelGeometry | null = null;
  /** The row nearest the centre, for the tick. */
  private nearest: HTMLElement | null = null;
  private gestureUntil = 0;
  private lastTick = 0;

  constructor(
    private scroller: HTMLElement,
    private content: HTMLElement,
    private onTick: () => void
  ) {
    content.style.perspective = `${WHEEL_TUNING.perspective}px`;
  }

  /** Re-read the rows and where layout puts them, then pose. */
  measure = () => {
    const els = Array.from(this.content.querySelectorAll<HTMLElement>(`[${WHEEL_ROW_ATTR}]`));
    // The parts of a row are re-read each time: a card can be swapped for a new element with
    // its row left in place. A row that has left the board takes its styles with it.
    const before = this.posed;
    let rowHeight = 0;
    this.rows = els.map((el) => {
      const row = readRow(el, this.scroller);
      // Rows are uniform, so the smallest one is the ordinary row.
      if (row.height > 0 && (rowHeight === 0 || row.height < rowHeight)) rowHeight = row.height;
      return row;
    });
    // Every value is written afresh after a measure, to the elements that are there now.
    before.forEach((row) => {
      if (row.el.isConnected) clear(row);
    });
    this.posed = new Set();
    this.rowHeight = rowHeight;
    this.contentTop = layoutTop(this.content, this.scroller);
    const slot = this.content.querySelector<HTMLElement>('.wheel-card');
    if (slot && slot.offsetHeight > 0 && slot.offsetWidth > 0) {
      this.slot = slot.offsetHeight;
      this.cardWidth = slot.offsetWidth;
      // A card grows away from the rail, so the room it has is what lies to its right.
      const room = this.scroller.clientWidth - layoutLeft(slot, this.scroller) - EDGE_MARGIN;
      this.fit = room / slot.offsetWidth;
    }
    this.geo = null;
    // A layout change moves rows under a still viewport; that is not the wheel being spun.
    this.pose(false);
  };

  /** Pose the rows near the viewport from the cached layout. Two layout reads, no more. */
  pose = (spun = true) => {
    const half = this.scroller.clientHeight / 2;
    const centre = this.scroller.scrollTop + half;
    if (!this.geo || this.geo.frame.half !== half) {
      this.geo = wheelGeometry({
        half,
        slot: this.slot,
        cardWidth: this.cardWidth,
        rowHeight: this.rowHeight,
      });
    }
    this.content.style.perspectiveOrigin = `50% ${round(centre - this.contentTop)}px`;
    // Rows bunch towards the edge, so more than one viewport of layout is on screen.
    const reach = half * 2.4 + this.rowHeight;
    const next = new Set<RowParts>();
    let nearest: HTMLElement | null = null;
    let nearestBy = Infinity;
    for (const row of this.rows) {
      const x = row.centre - centre;
      const by = Math.abs(x);
      if (by < nearestBy) {
        nearestBy = by;
        nearest = row.el;
      }
      if (by > reach) continue;
      this.write(row, wheelPose(x, this.geo, row.height));
      next.add(row);
    }
    this.posed.forEach((row) => {
      if (!next.has(row)) clear(row);
    });
    this.posed = next;
    this.tick(nearest, spun);
  };

  /** Write one row's pose, each value to the element that uses it and only if it has changed. */
  private write(row: RowParts, pose: ReturnType<typeof wheelPose>) {
    if (!this.geo) return;
    if (!row.found) findParts(row);
    const { last } = row;
    const transform = `translate3d(0,${round(pose.y)}px,${round(pose.z)}px) rotateX(${round(pose.tilt)}rad)`;
    if (transform !== last.transform) {
      row.el.style.transform = transform;
      last.transform = transform;
    }
    const shape = wheelCardShape(pose.grow, this.geo, this.fit);
    if (row.slot) {
      const scale = quantise(shape.scale, 0.0005);
      if (scale !== last.scale) {
        row.slot.style.transform = `scale(${round(scale)})`;
        last.scale = scale;
      }
      const dim = quantise(pose.dim, 0.005);
      if (dim !== last.dim) {
        row.slot.style.opacity = `${round(dim)}`;
        last.dim = dim;
      }
    }
    // The card opens past its slot, half above and half below, before the slot scales it.
    const open = quantise(shape.open, 0.25);
    if (open !== last.open) {
      for (const face of row.faces) {
        face.style.top = `${-open / 2}px`;
        face.style.height = `calc(100% + ${open}px)`;
      }
      last.open = open;
    }
    if (row.rail) {
      const rail = quantise(pose.railScale + RAIL_OVERLAP, 0.001);
      if (rail !== last.rail) {
        row.rail.style.transform = `scaleY(${round(rail)})`;
        last.rail = rail;
      }
    }
    if (row.year) {
      const year = quantise(1 + row.yearMax * pose.focus, 0.002);
      if (year !== last.year) {
        row.year.style.transform = `scale(${round(year)})`;
        last.year = year;
      }
      const yearDim = quantise(pose.yearDim, 0.01);
      if (yearDim !== last.yearDim) {
        row.year.style.opacity = `${round(yearDim)}`;
        last.yearDim = yearDim;
      }
    }
  }

  /** A tick when a different event takes the centre, but only while the player is spinning. */
  private tick(nearest: HTMLElement | null, spun: boolean) {
    const changed = nearest !== this.nearest;
    this.nearest = nearest;
    if (!spun) return;
    const now = performance.now();
    if (now > this.gestureUntil) return;
    // A scroll that follows a gesture keeps the gesture alive, which carries a fling's momentum.
    this.gestureUntil = now + GESTURE_MS;
    if (!changed || now - this.lastTick < TICK_GAP_MS) return;
    this.lastTick = now;
    this.onTick();
  }

  onScroll = () => this.pose(true);

  onGesture = () => {
    this.gestureUntil = performance.now() + GESTURE_MS;
  };

  flatten() {
    this.posed.forEach(clear);
    this.posed.clear();
    this.content.style.removeProperty('perspective');
    this.content.style.removeProperty('perspective-origin');
  }
}

const wheels = new Set<Wheel>();

/**
 * Bring every mounted wheel up to date with the DOM as it is right now. For code that measures
 * board rows in a layout effect or straight after a commit; see the rules above.
 */
export function flushWheels(): void {
  wheels.forEach((wheel) => wheel.measure());
}

/**
 * `enabled` must match the `wheel-on` class on the content element: the class lays the rows out
 * tall, and this hook poses them. One without the other is a board of oversized flat rows, or a
 * wheel whose centre card does not track the finger.
 */
export function useTimelineWheel(
  scrollRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  enabled: boolean
): void {
  const { haptics } = useHaptics();
  const tickRef = useRef(haptics.select);
  tickRef.current = haptics.select;

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!enabled || !scroller || !content) return;

    const wheel = new Wheel(scroller, content, () => tickRef.current());
    wheels.add(wheel);
    wheel.measure();

    const passive = { passive: true } as const;
    scroller.addEventListener('scroll', wheel.onScroll, passive);
    scroller.addEventListener('touchstart', wheel.onGesture, passive);
    scroller.addEventListener('touchmove', wheel.onGesture, passive);
    scroller.addEventListener('wheel', wheel.onGesture, passive);
    // Absent in jsdom; the wheel still follows scrolls and row changes without it.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(wheel.measure);
    ro?.observe(scroller);
    ro?.observe(content);
    // A swap of two rows of the same height resizes nothing, so the resize observer alone
    // would miss it.
    const mo = new MutationObserver(wheel.measure);
    mo.observe(content, { childList: true, subtree: true });

    return () => {
      scroller.removeEventListener('scroll', wheel.onScroll);
      scroller.removeEventListener('touchstart', wheel.onGesture);
      scroller.removeEventListener('touchmove', wheel.onGesture);
      scroller.removeEventListener('wheel', wheel.onGesture);
      ro?.disconnect();
      mo.disconnect();
      wheels.delete(wheel);
      wheel.flatten();
    };
  }, [scrollRef, contentRef, enabled]);
}
