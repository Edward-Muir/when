import React, { CSSProperties } from 'react';
import { motion, type MotionValue } from 'framer-motion';

/**
 * The timeline rail, drawn one segment per row instead of as one full-height bar.
 *
 * Two reasons it is per row rather than absolute:
 *
 * - **It grows.** The rail then exists only over the rows that exist, so the runway above the
 *   first card and below the last is empty and the line is the thing you have built, not page
 *   furniture. Each segment fills its whole row, which means the rail runs half a card-to-card
 *   gap past the first and last tick — it reads as a line with ends rather than one that stops
 *   dead on a card — and a one-card board is a stroke about as tall as the card itself.
 * - **It cannot detach.** The board column invariant (see index.css) puts the rail at
 *   board-left + 96px, butted against the tick that terminates every gutter. A segment that
 *   lives inside the row is aligned by construction, whatever height the row takes.
 *
 * Nothing is drawn on it — no nodes, no beads, no colour but the accent.
 *
 * ## The extension preview
 *
 * When a drag hovers past either end of the board, the ghost row gets a segment too and
 * `extending` says which way. That segment springs out of the existing rail — scaleY from the
 * anchored end, never a fade — which is the one moment where making the timeline longer is
 * something you feel. On a correct drop the ghost row becomes a real row, so the segment is
 * already at full length: no second animation, no snap.
 *
 * Taking the card off the board reverses it: the segment shrinks back into the rail, and coming
 * back springs it out again from wherever it got to. None of that lives here. This component
 * paints a length it does not own — `scale` is a MotionValue shared with every other element
 * that draws the same end, which is exactly what lets a growth be caught halfway and reversed.
 * The rules about when each end reaches and when it comes back are in `useRailExtension`.
 *
 * The glowing node at the growing end is NOT drawn here. It is `TimelineMarker`, one persistent
 * element that travels the whole board for the length of a drag and happens to be parked here
 * when the gap is an end. Drawing a tip locally would mean two glowing things fighting.
 */

export type RailExtension = 'earlier' | 'later';

interface TimelineRailProps {
  /** Round off the open end of the rail. */
  first?: boolean;
  last?: boolean;
  /** Set on a drag ghost sitting past an end: which way the rail is reaching. */
  extending?: RailExtension | null;
  /**
   * How far this end is currently reaching, 0..1, owned by `useRailExtension`. Shared with the
   * retract stub, which is how a half-finished growth can be reversed and a half-finished
   * retract caught, instead of each element starting from whatever it was born knowing.
   */
  scale?: MotionValue<number>;
}

const TimelineRail: React.FC<TimelineRailProps> = ({
  first = false,
  last = false,
  extending = null,
  scale,
}) => {
  // Only the open ends are rounded. Rounding every segment would notch the rail at each row
  // boundary, since the segments butt together.
  const ends = `${first ? 'rounded-t-full' : ''} ${last ? 'rounded-b-full' : ''}`;

  if (!extending) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-24 z-0 w-1">
        <div className={`tl-rail h-full w-full ${ends}`} />
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
        // Marks the one segment that is animating, so the screenshot rig can read its scale
        // rather than guessing which `.tl-rail` in the DOM is the growing one.
        data-rail-extending={extending}
        className={`tl-rail h-full w-full ${ends}`}
        // No `initial`, `animate` or `exit`: binding the MotionValue directly means a segment
        // that mounts mid-flight paints at the length the end has RIGHT NOW and keeps moving.
        // Anything keyframed here would start it over from whatever this element happened to be
        // born with, which is the whole bug — an `exit` used to be declared here and never ran,
        // because nothing puts these rows in an AnimatePresence.
        style={{ transformOrigin: origin, scaleY: scale } as CSSProperties}
      />
    </div>
  );
};

/**
 * The stub a retracting extension shrinks inside, once the ghost row that used to draw it is
 * gone.
 *
 * It cannot be the ghost row animating out. That row holds the dragged card, and the retract
 * only happens once the card has left the board — keeping the row alive would leave the card
 * hanging on the timeline for the length of the shrink, after the player has already pulled it
 * back to their hand.
 *
 * ## Why it takes no space
 *
 * The wrapper is `h-0` and the segment is absolutely positioned out of it, so the board's rows
 * reflow on exactly the frame they do today — the row structure changes at once and the RAIL is
 * the only thing that animates, which is the same division as on the way in (the ghost row
 * appears at full height and the rail sweeps into it). Holding a real row open instead would
 * only defer the board's settle to the end of the animation, where it lands on its own and reads
 * as a lurch; it would also change the content height twice per crossing, under the
 * ResizeObserver that watches it (`useInsertionMarker`), for a row with nothing in it.
 *
 * `height` is therefore given rather than inherited: it is the ghost row's own last measured
 * height, which `useInsertionMarker` already holds. `extending` gives the stub the same
 * `transformOrigin` as the growth had, so it shrinks INTO the rail rather than away from it.
 */
export const RailRetractRow: React.FC<{
  end: RailExtension;
  height: number;
  scale: MotionValue<number>;
}> = ({ end, height, scale }) => (
  <div aria-hidden data-rail-retracting={end} className="relative h-0 w-full">
    <div
      className="absolute inset-x-0"
      style={end === 'earlier' ? { height, bottom: 0 } : { height, top: 0 }}
    >
      <TimelineRail
        first={end === 'earlier'}
        last={end === 'later'}
        extending={end}
        scale={scale}
      />
    </div>
  </div>
);

export default TimelineRail;
