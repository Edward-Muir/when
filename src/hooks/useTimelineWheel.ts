import { RefObject, useLayoutEffect, useRef } from 'react';
import { WHEEL_TUNING, WheelGeometry, wheelGeometry, wheelPose } from '../utils/wheelMath';
import { useHaptics } from './useHaptics';

/**
 * Drives the timeline wheel: the card at the centre of the viewport opens to show more of its
 * painting and faces the player, and the rows above and below lean back a few degrees on a very
 * large cylinder. Scrolling spins it, with a light haptic tick as each event passes the centre.
 *
 * The maths is `wheelMath.ts` and the paint is the `.wheel-*` rules in index.css. This hook
 * writes each row's pose whenever the board scrolls or its rows change.
 *
 * ## Rules this depends on
 *
 * - **The board is laid out tall and the pose only corrects it.** Rows are laid out at
 *   `--wheel-pitch`, the centred card's opened height, so the correction is zero at the centre:
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
 * - **Code that measures the board right after a commit calls `flushWheels()` first.** A layout
 *   effect runs before the mutation observer does, so a row that has just mounted has no pose
 *   yet; the drag marker and the landing tick would measure it where it is not going to be.
 *
 * A drag needs no special case: the board freezes its own scrolling for the length of one, so
 * the wheel holds its shape and only re-poses when the ghost row changes the layout.
 */

/** Marks one row of a wheel. On the element that is a direct, in-flow child of the content. */
export const WHEEL_ROW_ATTR = 'data-wheel-row';

const VARS = [
  '--wheel-grow',
  '--wheel-dim',
  '--wheel-rail-scale',
  '--wheel-focus',
  '--wheel-year-dim',
] as const;

/** How long after a touch or wheel event a scroll still counts as the player's own. */
const GESTURE_MS = 400;
/** The least time between two ticks, so a fling is a purr rather than a buzz. */
const TICK_GAP_MS = 45;

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

/**
 * The `scrollTop` that puts `el`'s centre at the centre of `scroller`. From layout, so it is the
 * same answer whether or not the wheel is currently posing the row.
 */
export function centredScrollTop(scroller: HTMLElement, el: HTMLElement): number {
  return layoutTop(el, scroller) + el.offsetHeight / 2 - scroller.clientHeight / 2;
}

function clear(row: HTMLElement) {
  row.style.removeProperty('transform');
  for (const name of VARS) row.style.removeProperty(name);
}

class Wheel {
  private rows: { el: HTMLElement; centre: number; height: number }[] = [];
  private posed = new Set<HTMLElement>();
  private contentTop = 0;
  private rowHeight = 0;
  private slot = 80;
  private cardWidth = 240;
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
    let rowHeight = 0;
    this.rows = els.map((el) => {
      const height = el.offsetHeight;
      // Rows are uniform, so the smallest one is the ordinary row.
      if (height > 0 && (rowHeight === 0 || height < rowHeight)) rowHeight = height;
      return { el, centre: layoutTop(el, this.scroller) + height / 2, height };
    });
    this.rowHeight = rowHeight;
    this.contentTop = layoutTop(this.content, this.scroller);
    const slot = this.content.querySelector<HTMLElement>('.wheel-card');
    if (slot && slot.offsetHeight > 0) {
      this.slot = slot.offsetHeight;
      this.cardWidth = slot.offsetWidth;
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
    const next = new Set<HTMLElement>();
    let nearest: HTMLElement | null = null;
    let nearestBy = Infinity;
    for (const { el, centre: rowCentre, height } of this.rows) {
      const x = rowCentre - centre;
      const by = Math.abs(x);
      if (by < nearestBy) {
        nearestBy = by;
        nearest = el;
      }
      if (by > reach) continue;
      const pose = wheelPose(x, this.geo, height);
      const s = el.style;
      s.transform = `translate3d(0,${round(pose.y)}px,${round(pose.z)}px) rotateX(${round(pose.tilt)}rad)`;
      s.setProperty('--wheel-grow', `${round(pose.grow)}px`);
      s.setProperty('--wheel-dim', `${round(pose.dim)}`);
      s.setProperty('--wheel-rail-scale', `${round(pose.railScale)}`);
      s.setProperty('--wheel-focus', `${round(pose.focus)}`);
      s.setProperty('--wheel-year-dim', `${round(pose.yearDim)}`);
      next.add(el);
    }
    this.posed.forEach((row) => {
      if (!next.has(row)) clear(row);
    });
    this.posed = next;
    this.tick(nearest, spun);
  };

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
