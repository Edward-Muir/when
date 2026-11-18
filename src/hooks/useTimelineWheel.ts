import { RefObject, useLayoutEffect } from 'react';
import { wheelPose } from '../utils/wheelMath';

/**
 * Drives the timeline wheel: the centred card faces the player at full size, and the rows above
 * and below tilt back, shrink and bunch together as if on a drum turning into the page.
 *
 * The maths is `wheelMath.ts` and the paint is `.wheel-row` / `.wheel-card` / `.wheel-rail` in
 * index.css. All this hook does is write each row's pose as CSS custom properties whenever the
 * board scrolls or its rows change.
 *
 * ## Rules this depends on
 *
 * - **Layout is never touched.** The pose is transforms (plus the centred card's height, inside
 *   a fixed slot), so `scrollHeight`, the runways and `offsetTop` are what they were.
 * - **Positions are read with `offsetTop`, never `getBoundingClientRect`.** A rect includes the
 *   wheel's own transform, so reading one back would feed the pose into itself.
 * - **The wheel never shares an element with framer-motion.** Every node in a row already has a
 *   transform framer owns (layout projection, ripple, bounce, `layoutId`), so the pose goes on
 *   the plain row wrapper and on a wrapper of its own around the card.
 * - **It is synchronous.** Scroll, resize and mutation callbacks all run before paint, so the
 *   pose is applied in them directly: a frame of delay would show a new row flat, then posed.
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
  '--wheel-y',
  '--wheel-tilt',
  '--wheel-scale',
  '--wheel-focus',
  '--wheel-dim',
  '--wheel-rail-y',
  '--wheel-rail-scale',
] as const;

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

class Wheel {
  private rows: { el: HTMLElement; centre: number; height: number }[] = [];
  private posed = new Set<HTMLElement>();
  private pitch = 0;

  constructor(
    private scroller: HTMLElement,
    private content: HTMLElement
  ) {}

  /** Re-read the rows and where layout puts them, then pose. */
  measure = () => {
    const els = Array.from(this.content.querySelectorAll<HTMLElement>(`[${WHEEL_ROW_ATTR}]`));
    let pitch = 0;
    this.rows = els.map((el) => {
      const height = el.offsetHeight;
      // The pitch is an ordinary row's height. Rows are uniform, so the smallest one is it.
      if (height > 0 && (pitch === 0 || height < pitch)) pitch = height;
      return { el, centre: layoutTop(el, this.scroller) + height / 2, height };
    });
    this.pitch = pitch;
    this.pose();
  };

  /** Pose the rows near the viewport from the cached layout. Cheap: no layout reads but two. */
  pose = () => {
    const half = this.scroller.clientHeight / 2;
    const centre = this.scroller.scrollTop + half;
    // Rows bunch towards the edge, so more than one viewport of layout is on screen.
    const reach = half * 2.2 + this.pitch;
    const next = new Set<HTMLElement>();
    for (const { el: row, centre: rowCentre, height } of this.rows) {
      const d = rowCentre - centre;
      if (Math.abs(d) > reach) continue;
      const pose = wheelPose(d, half, this.pitch, height);
      const s = row.style;
      s.setProperty('--wheel-y', `${round(pose.y)}px`);
      s.setProperty('--wheel-tilt', `${round(pose.tilt)}deg`);
      s.setProperty('--wheel-scale', `${round(pose.scale)}`);
      s.setProperty('--wheel-focus', `${round(pose.focus)}`);
      s.setProperty('--wheel-dim', `${round(pose.dim)}`);
      s.setProperty('--wheel-rail-y', `${round(pose.railY)}px`);
      s.setProperty('--wheel-rail-scale', `${round(pose.railScale)}`);
      next.add(row);
    }
    this.posed.forEach((row) => {
      if (!next.has(row)) clear(row);
    });
    this.posed = next;
  };

  flatten() {
    this.posed.forEach(clear);
    this.posed.clear();
  }
}

function clear(row: HTMLElement) {
  for (const name of VARS) row.style.removeProperty(name);
}

const wheels = new Set<Wheel>();

/**
 * Bring every mounted wheel up to date with the DOM as it is right now. For code that measures
 * board rows in a layout effect or straight after a commit; see the rules above.
 */
export function flushWheels(): void {
  wheels.forEach((wheel) => wheel.measure());
}

export function useTimelineWheel(
  scrollRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  enabled: boolean
): void {
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!enabled || !scroller || !content) return;

    const wheel = new Wheel(scroller, content);
    wheels.add(wheel);
    wheel.measure();

    scroller.addEventListener('scroll', wheel.pose, { passive: true });
    // Absent in jsdom; the wheel still follows scrolls and row changes without it.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(wheel.measure);
    ro?.observe(scroller);
    ro?.observe(content);
    // Rows are direct children of the content, or one wrapper down; a swap of two rows of the
    // same height resizes nothing, so the resize observer alone would miss it.
    const mo = new MutationObserver(wheel.measure);
    mo.observe(content, { childList: true, subtree: true });

    return () => {
      scroller.removeEventListener('scroll', wheel.pose);
      ro?.disconnect();
      mo.disconnect();
      wheels.delete(wheel);
      wheel.flatten();
    };
  }, [scrollRef, contentRef, enabled]);
}
