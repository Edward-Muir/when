import { useEffect, useRef } from 'react';
import type { AnimationTuning } from './animationTuning';
import { sampleShock, shockDurationS } from './shockwave';
import type { RippleSpec } from './TimelineEvent';

/**
 * The landing of a correctly placed card: it dips and squashes into the rail, and glows.
 *
 * This is ONE gesture and is built so nothing can interrupt it. It is two Web Animations
 * started in the same tick with the same delay (a `transform` track on a wrapper around the
 * card, an `opacity` track on a glow element behind it), so both run on the compositor from one
 * clock. Neither element is the card button, and neither is touched by React after mount: the
 * game re-renders this row when the flash phase ends, when `isNew` clears and when the wave is
 * cleaned up, and none of those can change a class or a style that the landing depends on.
 *
 * It used to be four things on the button itself (the carried card fading out over it, a framer
 * transform animation, a CSS box-shadow animation, and class and style changes from those
 * re-renders), each ending at a different moment, and on an iPhone the card blinked once the
 * wave had finished. See docs/gameplay-feel/index.md.
 */

/** The dip as keyframes for one linear tween: down into the rail, a small rebound, still. */
export function impactKeyframes(dipPx: number, shock: AnimationTuning['shock']): Keyframe[] {
  const squash = 0.012 * dipPx;
  return sampleShock(1, shock).map((p) => ({
    transform: `translateY(${(p * dipPx).toFixed(2)}px) scale(${(1 + 0.5 * squash * p).toFixed(4)}, ${(1 - squash * p).toFixed(4)})`,
  }));
}

/** The glow: a fast flare, then a fade that takes the rest of the time. */
export const GLOW_KEYFRAMES: Keyframe[] = [
  { opacity: 0 },
  { opacity: 1, offset: 0.12 },
  { opacity: 0 },
];

export function useImpact(
  impact: RippleSpec | null,
  shouldReduceMotion: boolean | null,
  tuning: AnimationTuning
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const trigger = impact?.trigger;
  const dipPx = impact?.amplitudePx ?? 0;
  const delayMs = (impact?.delay ?? 0) * 1000;
  const glowScale = impact?.glowScale ?? 1;
  const color = impact?.color ?? 'var(--color-success)';
  const shock = tuning.shock;
  const glowMs = tuning.success.glowDurS * 1000;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const glow = glowRef.current;
    // jsdom has no Web Animations; the card is simply at rest there.
    if (trigger === undefined || !wrapper || !glow || typeof glow.animate !== 'function') return;
    // Set once, here, and left alone: these outlive the wave's own state.
    glow.style.setProperty('--shock-color', color);
    glow.style.setProperty('--shock-glow', String(glowScale));
    glow.animate(GLOW_KEYFRAMES, { duration: glowMs, delay: delayMs, easing: 'ease-out' });
    // The glow does not move, so it stays under reduced motion; the dip does not play.
    if (shouldReduceMotion || dipPx === 0) return;
    wrapper.animate(impactKeyframes(dipPx, shock), {
      duration: shockDurationS(shock) * 1000,
      delay: delayMs,
      easing: 'linear',
    });
    // `trigger` is the wave instance: one landing per correct placement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return { wrapperRef, glowRef };
}
