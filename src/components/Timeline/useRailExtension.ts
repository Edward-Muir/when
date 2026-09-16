import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion';
import type { RailExtension } from './TimelineRail';

/**
 * Spring for the extension. Deliberately under-damped (ζ ≈ 0.6): the rail overshoots the ghost's
 * tick by a hair and settles back, which is the whole point — a critically damped version
 * arrives so fast (~150ms) that nothing registers as having happened. It drives the retract too,
 * so leaving is the growth run backwards rather than a second animation with a feel of its own.
 */
const GROW_SPRING = { stiffness: 240, damping: 17, mass: 0.9 };

/**
 * Scaling a spring's time by k is exactly stiffness/k² and damping/k, so what a slowed capture
 * shows is the real curve rather than a reconstruction of it. 1 everywhere in the app; only the
 * screenshot harness raises it, because the spring is quicker than a screenshot.
 */
function growSpring(timeScale: number) {
  return {
    type: 'spring' as const,
    stiffness: GROW_SPRING.stiffness / (timeScale * timeScale),
    damping: GROW_SPRING.damping / timeScale,
    mass: GROW_SPRING.mass,
  };
}

export interface RailExtensionState {
  /** How far each end is reaching, 0..1. Outlives the elements that draw it. */
  scale: Record<RailExtension, MotionValue<number>>;
  /** The end shrinking back into the rail with no ghost row of its own, or null. */
  retracting: RailExtension | null;
}

/**
 * How far each end of the rail is currently reaching, and which end — if any — is on its way
 * back.
 *
 * ## Why a length, and not a flag
 *
 * The obvious shape is a boolean per end, "does this one still owe its growth", and that is what
 * this was. It cannot express what a drag actually does. The ghost row is rendered in flow, so it
 * unmounts and remounts every time the drag crosses a gap boundary, and an element born knowing
 * only "animate or don't" can only ever start from 0 or from 1. Leave the board halfway through a
 * growth and the retract has to invent a length to start from; turn back halfway through a
 * retract and the growth restarts from nothing, which shows as the rail snapping shut before it
 * re-opens.
 *
 * So the length lives here, in a MotionValue per end, and the elements that draw it come and go
 * around it. Every behaviour then falls out of that one number rather than being a rule:
 *
 * - the first time an end is reached its value is 0, so it springs out to 1;
 * - crossing off an end into a middle gap and back drives nothing, so the remounted segment
 *   paints at 1 and there is no replay — the jitter guard, for free;
 * - the OTHER end still grows on its first visit, because there are two values, not one;
 * - taking the card off the board springs the showing end to 0 — that IS the retract — and
 *   silently zeroes any end that grew earlier in the same trip, re-arming the whole board;
 * - turning back mid-retract springs the same number to 1 again from wherever it got to, so the
 *   rail is caught on the way down and pushed back out, with no frame at zero.
 *
 * ## Why the springs start a frame late
 *
 * The commit that moves the card off an end unmounts the segment drawing that end and mounts the
 * stub in its place, and an animation started inside that commit is silently killed by framer's
 * own mount work — the controls exist, the value never ticks, and nothing errors. Measured, by
 * re-issuing the identical call 500ms later and watching it run. So every spring here is armed on
 * the next frame instead. It costs one frame at the length the value already has, which is the
 * length the stub is already painted at, so there is nothing to see.
 *
 * ## The one thing it must never do
 *
 * Draw a retract over a card that has just landed. A drop at an end is the board genuinely
 * getting longer: the ghost row becomes a real row and keeps its segment at full length. That is
 * why the retract needs `dragging` as well as `previewing` — it fires only for a drag that is
 * still running, never for one that ended. `handleDragEnd` clears both in the same commit, so a
 * drop at an end arrives here as `dragging === false` and produces a silent reset instead.
 */
export function useRailExtension(
  dragging: boolean,
  previewing: boolean,
  extension: RailExtension | null,
  timeScale = 1
): RailExtensionState {
  const earlier = useMotionValue(0);
  const later = useMotionValue(0);
  const scale = useMemo(() => ({ earlier, later }), [earlier, later]);
  // Switched rather than indexed: `scale[end]` is a computed member access, which the
  // security/detect-object-injection rule flags — and a warning is a hard build failure on
  // Vercel, where CI=true. See CLAUDE.md.
  const lengthOf = (end: RailExtension) => (end === 'earlier' ? earlier : later);

  const [retracting, setRetracting] = useState<RailExtension | null>(null);
  // Mirrored so the effect can let an in-flight retract finish without taking a dependency on it
  // and re-running itself mid-spring.
  const retractingRef = useRef<RailExtension | null>(null);
  retractingRef.current = retracting;

  // The end that was showing on the previous commit — i.e. the one that has to come back when
  // the drag leaves the board, since by then `extension` is already null.
  const shown = useRef<RailExtension | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const armed = useRef<number | null>(null);

  useEffect(() => {
    const departed = shown.current;
    shown.current = extension;

    const spring = (end: RailExtension, to: number, onComplete?: () => void) => {
      const length = lengthOf(end);
      if (shouldReduceMotion) {
        length.set(to);
        onComplete?.();
        return;
      }
      // Next frame, never this one — see "Why the springs start a frame late" above.
      armed.current = requestAnimationFrame(() => {
        armed.current = null;
        animate(length, to, { ...growSpring(timeScale), onComplete });
      });
    };

    // At an end, over the board: this end reaches full length, and stops retracting if it was.
    if (extension) {
      if (retractingRef.current === extension) setRetracting(null);
      spring(extension, 1);
      return;
    }
    // Between two cards, still over the board: nothing draws either end, so leave both lengths
    // alone. This is what keeps a gap-to-gap-to-end crossing from replaying the growth.
    if (previewing) return;

    // Off the board. The end that was showing shrinks back into the rail; anything else is
    // re-armed in silence, because nothing is drawing it.
    const shrinking = dragging ? departed : null;
    if (shrinking !== 'earlier' && retractingRef.current !== 'earlier') earlier.set(0);
    if (shrinking !== 'later' && retractingRef.current !== 'later') later.set(0);
    if (!shrinking) return;
    // Under reduced motion the length is set rather than sprung and no stub is ever mounted, so
    // leaving stays the instant removal it has always been.
    if (!shouldReduceMotion) setRetracting(shrinking);
    spring(shrinking, 0, () => setRetracting((r) => (r === shrinking ? null : r)));
    // `lengthOf` is re-made every render and deliberately left out: the effect runs on a drag
    // transition, and `earlier`/`later` are stable for the component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, previewing, extension, timeScale, shouldReduceMotion, earlier, later]);

  // A spring armed for a frame that never came, because the board unmounted first.
  useEffect(
    () => () => {
      if (armed.current !== null) cancelAnimationFrame(armed.current);
    },
    []
  );

  return { scale, retracting };
}
