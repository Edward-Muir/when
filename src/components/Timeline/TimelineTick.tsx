import React, { RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useAnimate, useReducedMotion } from 'framer-motion';
import { useAnimationTuning } from './animationTuning';
import { dotStart, landingKeyframes, landingTransition, Point } from './tickLanding';

/**
 * The dash that terminates every gutter and butts against the rail — and, when a card has just
 * landed, the thing the drag marker turns into.
 *
 * One component for all four board variants so the shape lives in one place. The BOARD COLUMN
 * invariant in index.css is checkable as `tick.right === rail.left`, which only holds while every
 * surface draws the same 12×4 box.
 *
 * ## The landing
 *
 * Given `landing`, the dash mounts as the marker and animates into itself: 6×8 and round becomes
 * 12×4 and square, sliding the ~8px off the rail into the gutter. On a correct drop that is the
 * whole animation, because the card lands in the gap the dot was already sitting in. On a wrong
 * one `travelMs` is set and the snuffed dot first rides to the card's true slot on the FLIP's own
 * tween, then grows there.
 *
 * ## Two boxes
 *
 * The outer box is the dash's 12×4 footprint and never changes. Animating the real thing would
 * re-flow the gutter and shove the year label about on every placement — and the board's content
 * is under two ResizeObservers (`usePaperField`, `useInsertionMarker`), so a per-frame layout
 * change there would drive both of them. The inner box is what you see: absolutely positioned, so
 * it is free to be 6×8, to overhang the footprint on the way in, and to carry a glow that spills.
 *
 * Size is animated rather than scaled on purpose. Scaling a 12×4 box to 6×8 is anisotropic, which
 * would render the glow as an ellipse and the corner radius as a lozenge at exactly the moment
 * the shape is meant to match the marker's.
 *
 * `variant="none"` keeps the outer box and drops the inner one: the footprint with nothing in it.
 * That is what the drag's insertion gap draws, so the only mark there is the travelling dot and
 * the dash's first appearance is the landing itself. It cannot be an omitted element — the gutter
 * is a fixed 96px column ending in this box, so removing it would shove the row's label 12px
 * right, against the rail, on every gap the drag previews.
 *
 * ## Why the origin is a ref, and why it is read imperatively
 *
 * `originRef` carries where the marker was last *painted*. Not where it was heading:
 * `useInsertionMarker` reports the target, and the marker trails it on a soft under-damped
 * spring, so on a quick drop the two are tens of pixels apart and seeding from the target starts
 * the dash where the dot visibly wasn't.
 *
 * And the animation is started from a layout effect rather than framer's `initial`, because the
 * starting offset can only be known once the element is in the DOM. Rendering, measuring and
 * re-rendering would paint one frame of the dash at rest before the marker had handed over, which
 * is exactly the seam this whole feature exists to remove. Both ends are measured in that one
 * effect, so no scroll can happen between them — which is what makes plain viewport coordinates
 * safe here, and why neither end is ever stored.
 */

export type TickVariant = 'normal' | 'muted' | 'none';

interface TimelineTickProps {
  variant?: TickVariant;
  /** Live viewport centre of the drag marker, written per frame by TimelineMarker. */
  originRef?: RefObject<Point | null>;
  /** This is the dash the placement just landed as: grow it out of the marker. */
  landing?: boolean;
  /** Arrive carrying the marker's glow and give it up. Correct placements only. */
  glow?: boolean;
  /** Ride the miss reveal's travel tween before growing. Omit for a correct placement. */
  travelMs?: number;
}

/** Tombstones draw a fainter dash. NOT `bg-accent/40` — see index.css. */
function variantClass(variant: TickVariant): string {
  return variant === 'muted' ? 'opacity-40' : '';
}

const TimelineTick: React.FC<TimelineTickProps> = ({
  variant = 'normal',
  originRef,
  landing = false,
  glow = false,
  travelMs,
}) => {
  const [scope, animate] = useAnimate();
  const box = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const tuning = useAnimationTuning();
  // Mount-time snapshot: the flags that say "this row just landed" clear a few hundred ms later,
  // while the animation is still in flight, and re-reading them would cut it short.
  const [arming] = useState(landing);
  const [arriving] = useState(travelMs);
  const [lit] = useState(glow && landing);
  const played = useRef(false);
  // An empty footprint: no dash to grow, and nothing for the marker to hand over to.
  const blank = variant === 'none';

  useLayoutEffect(() => {
    const el = scope.current;
    const origin = originRef?.current ?? null;
    // No origin means no drag produced this placement — a replay, or one of the dev harnesses
    // driving the board directly. The dash is already right at rest, so that is the failure.
    if (blank || !arming || !el || !box.current || origin === null || shouldReduceMotion) return;
    // StrictMode double-invokes mount effects; restarting the morph would show its first frame
    // twice.
    if (played.current) return;
    played.current = true;
    const rest = box.current.getBoundingClientRect();
    animate(el, landingKeyframes(dotStart(origin, rest)), landingTransition(tuning.tick, arriving));
    // Mount only, by design — see the snapshot note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // `data-tick-body` marks the painted dash, so the screenshot rig can read the one that is
    // mid-landing rather than guessing which of a board's ticks is moving.
    <div
      ref={box}
      aria-hidden
      data-tick={variant}
      className={`relative w-3 h-1 shrink-0 ${variantClass(variant)}`}
    >
      {!blank && (
        <div
          ref={scope}
          data-tick-body
          className={`absolute left-0 top-0 h-full w-full bg-accent ${lit ? 'tl-tick-glow' : ''}`}
        />
      )}
    </div>
  );
};

export default TimelineTick;
