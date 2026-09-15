import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * The insertion marker: one lit node that runs along the rail for the whole of a drag and
 * settles into the gap the card will land in.
 *
 * It is deliberately ONE persistent element rather than something drawn per row. That is the
 * entire trick: a node born and destroyed with each ghost row can only ever pop between slots,
 * whereas a single node whose `y` is animated glides between them. It also means the same node
 * is what you see at the ends of the board, where the rail grows out to meet it — the rail used
 * to draw its own tip, and now there is one glowing thing and one code path.
 */

/**
 * Softer and less damped than the rail's own growth spring: the node should trail the pointer a
 * little and overshoot into each gap. Stiffening this turns the glide back into the flicking it
 * exists to replace.
 */
const TRAVEL_SPRING = { type: 'spring' as const, stiffness: 260, damping: 22, mass: 1 };
/** Height of the node in px — `h-2` below. Kept here so the centring maths stays honest. */
const MARKER_H = 8;

interface TimelineMarkerProps {
  /** Centre of the target gap, in content-wrapper coordinates. */
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

const TimelineMarker: React.FC<TimelineMarkerProps> = ({ y, visible, timeScale = 1 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      data-insertion-marker={visible ? 'on' : 'off'}
      // `left-24` is the rail's own offset; the -1px nudge centres a 6px node on the 4px rail.
      // framer owns the whole transform, so the offset is a motion value rather than a class.
      className="tl-rail-tip pointer-events-none absolute left-24 top-0 z-20 h-2 w-1.5 rounded-full"
      style={{ x: -1 }}
      initial={false}
      animate={{ y: y - MARKER_H / 2, opacity: visible ? 1 : 0 }}
      transition={{
        y: shouldReduceMotion ? { duration: 0 } : travelSpring(timeScale),
        opacity: { duration: shouldReduceMotion ? 0 : 0.18 * timeScale },
      }}
    />
  );
};

export default TimelineMarker;
