import React, { CSSProperties, RefObject, useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { useAnimationTuning } from './animationTuning';
import { shockDelayS, shockPeakS, shockReach } from './shockwave';
import type { ShockPulse } from './useTimelineWaves';

/**
 * The light that runs along the rail with the success shockwave: one each way from the card
 * just placed, fading as it goes. One pulse per placement at every streak; the streak makes it
 * bigger, never more numerous.
 *
 * It is one element per direction laid over the board, not something each rail segment draws.
 * `TimelineRail` is per row and deliberately draws nothing on itself, and rows are not all the
 * same height (a tombstone can sit between two events). So on each pulse this measures where
 * the event rows actually are and tweens through those points, arriving at each row at the
 * moment `shockwave.ts` says that row is at full kick. Being in step with the rows is the whole
 * point: a light that passes before the card moves reads as two unrelated effects.
 *
 * Mounted inside the board's content wrapper, so it scrolls with the rows.
 */

/** The rail is 4px wide at board-left + 96px (the BOARD COLUMN invariant in index.css). */
const RAIL_CENTRE_X = 98;
/** Stop once the light is this faint. */
const MIN_ALPHA = 0.04;

interface Path {
  times: number[];
  y: number[];
  opacity: number[];
}

/** Centre of each event row, by display index, relative to the content wrapper. */
function measureRows(content: HTMLElement): Map<number, number> {
  const top = content.getBoundingClientRect().top;
  const centres = new Map<number, number>();
  content.querySelectorAll<HTMLElement>('[data-timeline-index]').forEach((el) => {
    const rect = el.getBoundingClientRect();
    centres.set(Number(el.dataset.timelineIndex), rect.top - top + rect.height / 2);
  });
  return centres;
}

/** The light's journey one way: where it is, when, and how bright. Null if there is no row. */
function buildPath(
  centres: Map<number, number>,
  placedIndex: number,
  step: -1 | 1,
  shock: ReturnType<typeof useAnimationTuning>['shock']
): Path | null {
  const start = centres.get(placedIndex);
  if (start === undefined || !centres.has(placedIndex + step)) return null;
  const peak = shockPeakS(shock);
  const bright = Math.min(1, shock.lightBrightness);
  // It swells out of the tick while the nearest rows wind up, then sets off.
  const path: Path = { times: [0, peak], y: [start, start], opacity: [0, bright] };
  let last = start;
  let rowStep = 0;
  for (let d = 1; ; d++) {
    const centre = centres.get(placedIndex + step * d);
    // Slower to fade than the kick, so the light is still visible on rows that barely move.
    const alpha = bright * Math.pow(shockReach(d, shock), 1 / 1.6);
    if (centre === undefined || alpha < MIN_ALPHA) break;
    rowStep = centre - last;
    last = centre;
    path.times.push(peak + shockDelayS(d, shock));
    path.y.push(centre);
    path.opacity.push(alpha);
  }
  // Run out half a row past the last one it reached and go dark, rather than stopping dead.
  const end = path.times.length;
  path.times.push(
    path.times[end - 1] + (shockDelayS(end - 1, shock) - shockDelayS(end - 2, shock))
  );
  path.y.push(last + rowStep / 2);
  path.opacity.push(0);
  return path;
}

const ShockwaveLight: React.FC<{
  contentRef: RefObject<HTMLElement | null>;
  pulse: ShockPulse | null;
}> = ({ contentRef, pulse }) => {
  const up = useRef<HTMLDivElement>(null);
  const down = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const shock = useAnimationTuning().shock;
  const trigger = pulse?.trigger;
  const placedIndex = pulse?.placedIndex;

  useEffect(() => {
    const content = contentRef.current;
    if (trigger === undefined || placedIndex === undefined || !content || shouldReduceMotion) {
      return;
    }
    const centres = measureRows(content);
    const playing = (
      [
        [up.current, -1],
        [down.current, 1],
      ] as const
    ).map(([el, step]) => {
      const path = el ? buildPath(centres, placedIndex, step, shock) : null;
      if (!el || !path) return null;
      const duration = path.times[path.times.length - 1];
      return animate(
        el,
        { y: path.y, opacity: path.opacity },
        {
          duration,
          times: path.times.map((t) => t / duration),
          ease: 'linear',
          delay: shock.landDelayS,
        }
      );
    });
    return () => playing.forEach((p) => p?.stop());
    // `trigger` is the wave instance: one run per correct placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const style = {
    left: RAIL_CENTRE_X,
    '--shock-color': pulse?.color ?? 'var(--color-success)',
    '--shock-light': pulse?.scale ?? 1,
  } as CSSProperties;

  return (
    <>
      <div ref={up} aria-hidden data-shock-light="earlier" className="shock-light" style={style} />
      <div ref={down} aria-hidden data-shock-light="later" className="shock-light" style={style} />
    </>
  );
};

export default ShockwaveLight;
