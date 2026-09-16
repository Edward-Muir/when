import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAnimationTuning } from './animationTuning';
import { RAIL_TO_TICK, type Point } from './tickLanding';
import type { Rect } from './useInsertionMarker';

/**
 * The insertion marker: one lit node that runs along the rail for the whole of a drag and
 * settles into the gap the card will land in.
 *
 * It is deliberately ONE persistent element rather than something drawn per row. That is the
 * trick that lets it glide: a node born and destroyed with each ghost row can only ever pop
 * between slots. The same node is what you see at the ends of the board, where the rail grows
 * out to meet it — the rail draws no tip of its own, so there is one glowing thing.
 *
 * ## Why it is portalled
 *
 * Drawn inside the board it was almost never visible where it mattered. The card being dragged
 * is centred on the pointer, and the pointer sits on the insertion boundary — which is exactly
 * where the marker is — so dnd-kit's drag overlay (`z-index: 999`, portalled to `body`) covered
 * it for most of a drag. The "Earlier"/"Later" scrims cover it near the board's ends too, since
 * they sit above the scroller. Both go away by rendering it to `body` in viewport coordinates,
 * above the overlay. Nothing about how it looks changes.
 *
 * ## How it ends
 *
 * It does not fade out any more; it hands over. On a correct drop the tick on the new row takes
 * its place in the very same commit, so the marker has to be gone on that frame — a fade would
 * leave a second glowing thing sitting behind the first. On a wrong one it stays put and
 * SNUFFS: the glow goes out, it drops to the tombstone dash's opacity, and it steps off the rail
 * into the gutter, all over the red flash — so what sets off for the card's true slot 400ms later
 * is a dead grey dot travelling down the bare gutter. That step is not decoration: an unlit dot
 * on top of a full-strength accent rail is invisible, and the point of the trip is to watch it.
 * Only a drag that ends without a placement still simply fades.
 *
 * ## Why it is also clipped
 *
 * It has to be above the drag overlay but never over the hand bar or the top bar, and z-index
 * alone cannot say that: `#root` is its own stacking context at `z-index: 1`, so the overlay on
 * `body` is above every piece of app chrome, and anything that clears the overlay clears the
 * chrome too. So the marker lives inside a fixed clip box the size of the board. Within it the
 * marker is free; at the board's edges it — and its glow — are simply cut off, which against the
 * opaque hand bar is indistinguishable from passing behind it.
 */

/**
 * Softer and less damped than the rail's own growth spring: the node should trail the pointer a
 * little and overshoot into each gap. Stiffening this turns the glide back into the flicking it
 * exists to replace.
 */
const TRAVEL_SPRING = { stiffness: 260, damping: 22, mass: 1 };
/** Size of the node in px — `h-2 w-1.5` below. Kept here so the centring maths stays honest. */
const MARKER_H = 8;
const MARKER_W = 6;
/** Clears dnd-kit's drag overlay, which defaults to 999. */
const ABOVE_DRAG_OVERLAY = 1001;

/**
 * `drag` — following the pointer. `snuff` — a wrong drop: hold position, go out. `gone` — a
 * correct drop: the tick has it now, leave the frame immediately. `idle` — no drag, fade away.
 */
export type MarkerPhase = 'drag' | 'snuff' | 'gone' | 'idle';

/** What the marker dims to when it snuffs — the tombstone dash's `opacity-40`. */
const SNUFFED_OPACITY = 0.4;

interface TimelineMarkerProps {
  x: number;
  y: number;
  /** The board's bounds; the marker is clipped to these. */
  clip: Rect;
  phase: MarkerPhase;
  /**
   * Called every frame with the dot's PAINTED viewport centre. The tick a placement lands as
   * grows out of that point, and it has to be where the dot actually is: `x`/`y` above are the
   * spring's target, and on a quick drop the dot is still tens of pixels behind it.
   */
  onPosition?: (p: Point) => void;
  /** Stretches the travel in time for the screenshot rig, exactly as TimelineRail's does. */
  timeScale?: number;
}

function opacityFor(phase: MarkerPhase): number {
  if (phase === 'drag') return 1;
  if (phase === 'snuff') return SNUFFED_OPACITY;
  return 0;
}

/**
 * A handover has to be instant: the replacement tick is already on screen this frame, and any
 * fade at all would show the two of them overlapping. The dim on a snuff rides the red flash.
 */
function fadeDuration(
  phase: MarkerPhase,
  shouldReduceMotion: boolean | null,
  snuffS: number
): number {
  if (shouldReduceMotion || phase === 'gone') return 0;
  if (phase === 'snuff') return snuffS;
  return 0.18;
}

function travelSpring(timeScale: number) {
  return {
    type: 'spring' as const,
    stiffness: TRAVEL_SPRING.stiffness / (timeScale * timeScale),
    damping: TRAVEL_SPRING.damping / timeScale,
    mass: TRAVEL_SPRING.mass,
  };
}

const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  x,
  y,
  clip,
  phase,
  onPosition,
  timeScale = 1,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const tuning = useAnimationTuning();
  const visible = phase === 'drag' || phase === 'snuff';
  const snuffS = shouldReduceMotion ? 0 : tuning.tick.snuffS * timeScale;

  // One key per drag, so the node persists and glides WITHIN a drag but is re-created between
  // them. Without this it would fly across the board from wherever the last drag left it.
  const session = useRef(0);
  const wasVisible = useRef(false);
  if (visible && !wasVisible.current) session.current += 1;
  wasVisible.current = visible;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed overflow-hidden"
      style={{
        left: clip.left,
        top: clip.top,
        width: clip.width,
        height: clip.height,
        zIndex: ABOVE_DRAG_OVERLAY,
      }}
    >
      <motion.div
        key={session.current}
        data-insertion-marker={phase}
        className={`tl-rail-tip pointer-events-none absolute left-0 top-0 h-2 w-1.5 rounded-full ${
          phase === 'snuff' ? 'tl-rail-tip-snuffed' : ''
        }`}
        initial={false}
        // The clip box's origin put these in local space; undo it on the way back out.
        onUpdate={(latest) =>
          onPosition?.({
            x: clip.left + Number(latest.x) + MARKER_W / 2,
            y: clip.top + Number(latest.y) + MARKER_H / 2,
          })
        }
        // Positions are measured in viewport space; the clip box's origin brings them local.
        animate={{
          x: x - clip.left - MARKER_W / 2 - (phase === 'snuff' ? RAIL_TO_TICK : 0),
          y: y - clip.top - MARKER_H / 2,
          opacity: opacityFor(phase),
        }}
        transition={{
          // Instant while dragging — x only changes on a resize — but the step off the rail is
          // part of the snuff and has to be seen happening.
          x: phase === 'snuff' ? { duration: snuffS } : { duration: 0 },
          y: shouldReduceMotion ? { duration: 0 } : travelSpring(timeScale),
          opacity: { duration: fadeDuration(phase, shouldReduceMotion, snuffS) },
        }}
      />
    </div>,
    document.body
  );
};

export default TimelineMarker;
