import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';

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
 * it for most of a drag. The board's own top and bottom bands fade it out too, because the
 * scroller carries `.tl-edge-mask`. Both go away by rendering it to `body` in viewport
 * coordinates, above the overlay. Nothing about how it looks changes.
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

interface TimelineMarkerProps {
  x: number;
  y: number;
  visible: boolean;
  /** Stretches the travel in time for the screenshot rig, exactly as TimelineRail's does. */
  timeScale?: number;
}

function travelSpring(timeScale: number) {
  return {
    type: 'spring' as const,
    stiffness: TRAVEL_SPRING.stiffness / (timeScale * timeScale),
    damping: TRAVEL_SPRING.damping / timeScale,
    mass: TRAVEL_SPRING.mass,
  };
}

const TimelineMarker: React.FC<TimelineMarkerProps> = ({ x, y, visible, timeScale = 1 }) => {
  const shouldReduceMotion = useReducedMotion();

  // One key per drag, so the node persists and glides WITHIN a drag but is re-created between
  // them. Without this it would fly across the board from wherever the last drag left it.
  const session = useRef(0);
  const wasVisible = useRef(false);
  if (visible && !wasVisible.current) session.current += 1;
  wasVisible.current = visible;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      key={session.current}
      aria-hidden
      data-insertion-marker={visible ? 'on' : 'off'}
      className="tl-rail-tip pointer-events-none fixed left-0 top-0 h-2 w-1.5 rounded-full"
      style={{ zIndex: ABOVE_DRAG_OVERLAY }}
      initial={false}
      animate={{ x: x - MARKER_W / 2, y: y - MARKER_H / 2, opacity: visible ? 1 : 0 }}
      transition={{
        x: { duration: 0 },
        y: shouldReduceMotion ? { duration: 0 } : travelSpring(timeScale),
        opacity: { duration: shouldReduceMotion ? 0 : 0.18 * timeScale },
      }}
    />,
    document.body
  );
};

export default TimelineMarker;
