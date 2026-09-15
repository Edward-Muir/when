import React, { CSSProperties, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * The timeline rail, drawn one segment per row instead of as one full-height bar.
 *
 * Two reasons it is per row rather than absolute:
 *
 * - **It grows.** The rail then exists only between the first and last card on the board,
 *   so the empty runway above and below is bare paper and the line is the thing you have
 *   built rather than page furniture.
 * - **It cannot detach.** The board column invariant (see index.css) puts the rail at
 *   board-left + 96px, butted against the tick that terminates every gutter. A segment that
 *   lives inside the row is aligned by construction, whatever height the row takes.
 *
 * Nothing is drawn on it — no nodes, no beads, no colour but the accent.
 *
 * ## The extension preview
 *
 * When a drag hovers past either end of the board, the ghost row gets a segment too and
 * `extending` says which way. That segment springs out of the existing rail (scaleY from
 * the anchored end, never a fade) and carries a glowing tip that settles once the spring
 * lands — the one moment where making the timeline longer is something you feel. On a
 * correct drop the ghost row becomes a real row, so the segment is already at full length
 * and only the tip fades: no second animation, no snap.
 */

export type RailExtension = 'earlier' | 'later';

interface TimelineRailProps {
  /** Cap the top / bottom so the rail begins and ends on a tick, not mid-row. */
  first?: boolean;
  last?: boolean;
  /** Set on a drag ghost sitting past an end: which way the rail is reaching. */
  extending?: RailExtension | null;
  /**
   * Stretch the extension in time without changing its shape — 1 in the game, and larger only
   * for the screenshot rig, where a 320ms spring is quicker than a screenshot round-trip.
   * Scaling a spring's time by k is exactly stiffness/k² and damping/k, so what a slowed
   * capture shows is the real curve, not a reconstruction of it.
   */
  timeScale?: number;
}

/**
 * Spring for the extension. Deliberately under-damped (ζ ≈ 0.6): the rail overshoots the
 * ghost's tick by a hair and settles back, which is the whole point — a critically damped
 * version arrives so fast (~150ms) that nothing registers as having happened.
 */
const GROW_SPRING = { stiffness: 240, damping: 17, mass: 0.9 };

function growSpring(timeScale: number) {
  return {
    type: 'spring' as const,
    stiffness: GROW_SPRING.stiffness / (timeScale * timeScale),
    damping: GROW_SPRING.damping / timeScale,
    mass: GROW_SPRING.mass,
  };
}
/** How long the tip stays lit — long enough to ride the overshoot, not long enough to linger. */
const TIP_SETTLE_MS = 560;

const TimelineRail: React.FC<TimelineRailProps> = ({
  first = false,
  last = false,
  extending = null,
  timeScale = 1,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [tipLit, setTipLit] = useState(true);

  // Relight on every new extension, then let it settle.
  useEffect(() => {
    if (!extending) return;
    setTipLit(true);
    const t = window.setTimeout(() => setTipLit(false), TIP_SETTLE_MS * timeScale);
    return () => window.clearTimeout(t);
  }, [extending, timeScale]);

  // Two mask-image declarations cannot both apply, so a board of one card takes a combined
  // cap that leaves a single node at the tick rather than a full-height bar.
  const caps =
    first && last
      ? 'tl-rail-cap-both'
      : first
        ? 'tl-rail-cap-top'
        : last
          ? 'tl-rail-cap-bottom'
          : '';

  if (!extending) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-24 z-0 w-1">
        <div className={`tl-rail h-full w-full ${caps}`} />
      </div>
    );
  }

  // Grow out of the rail that is already there: reaching earlier means the new segment is
  // above the board, so it has to be anchored at its BOTTOM edge, and vice versa.
  const earlier = extending === 'earlier';
  const origin = earlier ? 'bottom' : 'top';

  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-24 z-0 w-1">
      <motion.div
        className="tl-rail h-full w-full origin-bottom"
        style={{ transformOrigin: origin } as CSSProperties}
        initial={shouldReduceMotion ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        exit={shouldReduceMotion ? undefined : { scaleY: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : growSpring(timeScale)}
      />
      {!shouldReduceMotion && (
        <motion.div
          className="tl-rail-tip absolute left-1/2 h-2 w-1.5 -translate-x-1/2 rounded-full"
          style={earlier ? { top: -2 } : { bottom: -2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: tipLit ? 1 : 0 }}
          transition={{ duration: (tipLit ? 0.12 : 0.32) * timeScale }}
        />
      )}
    </div>
  );
};

export default TimelineRail;
