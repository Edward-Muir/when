import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import AchievementCard from './AchievementCard';
import { useHaptics } from '../hooks/useHaptics';

export type RevealVariant = 'slam' | 'flip' | 'glow' | 'stagger';

/** Human labels for the dev preview harness. */
export const REVEAL_VARIANTS: { key: RevealVariant; label: string; blurb: string }[] = [
  { key: 'slam', label: 'Trophy Slam', blurb: 'Oversized drop + squash/stretch overshoot' },
  { key: 'flip', label: 'Badge Flip', blurb: '3D coin-flip reveal' },
  { key: 'glow', label: 'Rise & Glow', blurb: 'Lift up + radiating golden halo' },
  { key: 'stagger', label: 'Staggered Shine', blurb: 'Scale-pop + light-sweep shimmer' },
];

interface AchievementRevealProps {
  variant: RevealVariant;
  achievement: AchievementDef;
  eventsByName: Map<string, HistoricalEvent>;
  /** Bump to re-trigger the reveal (the motion + confetti + haptic all key off this). */
  replayKey?: number;
  /** Fire a haptic pulse on each reveal (mobile; no-op on desktop). */
  haptic?: boolean;
  /** Add a brief halo flash behind the badge (independent of the "glow" variant). */
  glowFlash?: boolean;
  /** Force the reduced-motion fallback (the harness toggle); ORed with the OS setting. */
  forceReduced?: boolean;
}

/** Per-variant framer-motion config for the badge wrapper. */
function useRevealMotion(variant: RevealVariant, reduced: boolean) {
  return useMemo(() => {
    if (reduced) {
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };
    }
    switch (variant) {
      case 'slam':
        // Drops in oversized, squashes wide/short on impact, then settles (squash & stretch).
        return {
          initial: { scaleX: 1.7, scaleY: 1.7, opacity: 0 },
          animate: {
            scaleX: [1.7, 0.92, 1.08, 1],
            scaleY: [1.7, 0.84, 1.03, 1],
            opacity: [0, 1, 1, 1],
          },
          transition: { duration: 0.5, times: [0, 0.5, 0.78, 1], ease: 'easeOut' as const },
        };
      case 'flip':
        return {
          initial: { rotateY: 180, opacity: 0, scale: 0.85 },
          animate: { rotateY: 0, opacity: 1, scale: 1 },
          transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
          style: { transformPerspective: 800 },
        };
      case 'glow':
        return {
          initial: { y: 28, opacity: 0, scale: 0.9 },
          animate: { y: 0, opacity: 1, scale: 1 },
          transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
        };
      case 'stagger':
        return {
          initial: { scale: 0.85, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { type: 'spring' as const, stiffness: 300, damping: 22 },
        };
    }
  }, [variant, reduced]);
}

/** Confetti burst that (re)fires on replayKey, optionally delayed to a variant's impact frame. */
const Burst: React.FC<{ replayKey?: number; delayMs: number }> = ({ replayKey, delayMs }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [replayKey, delayMs]);
  return show ? (
    <ConfettiExplosion key={replayKey} force={0.6} duration={2200} particleCount={90} width={900} />
  ) : null;
};

/**
 * Variant-switched celebratory reveal for a single achievement badge. Wraps
 * `AchievementCard` (always unlocked) with one of several entrance animations so the
 * same component powers both the `/unlock-preview` comparison harness and the real
 * post-game `AchievementUnlock` modal once a variant is chosen.
 */
const AchievementReveal: React.FC<AchievementRevealProps> = ({
  variant,
  achievement,
  eventsByName,
  replayKey,
  haptic = false,
  glowFlash = false,
  forceReduced = false,
}) => {
  const reduced = (useReducedMotion() ?? false) || forceReduced;
  const m = useRevealMotion(variant, reduced);
  const { haptics } = useHaptics();
  const burstDelay = variant === 'slam' ? 180 : 0;
  const showHalo = (variant === 'glow' || glowFlash) && !reduced;

  // Fire a haptic pulse aligned with the reveal (heavier on the slam's impact).
  useEffect(() => {
    if (!haptic) return;
    const fire = () => (variant === 'slam' ? haptics.impact() : haptics.medium());
    const t = setTimeout(fire, burstDelay);
    return () => clearTimeout(t);
  }, [replayKey, haptic, variant, burstDelay, haptics]);

  const card = <AchievementCard achievement={achievement} unlocked eventsByName={eventsByName} />;

  return (
    <div className="relative flex items-center justify-center" style={{ perspective: 800 }}>
      {/* Confetti, behind the badge */}
      {!reduced && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-0 -translate-x-1/2">
          <Burst replayKey={replayKey} delayMs={burstDelay} />
        </div>
      )}

      {/* Radiating halo, behind the badge */}
      {showHalo && (
        <div
          key={`halo-${replayKey}`}
          className="animate-halo-pulse pointer-events-none absolute z-0 h-28 w-28 rounded-full"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 55%, transparent), transparent 70%)',
          }}
        />
      )}

      <motion.div
        key={replayKey}
        className="relative z-[1]"
        initial={m.initial}
        animate={m.animate}
        transition={m.transition}
        style={'style' in m ? m.style : undefined}
      >
        {variant === 'stagger' && !reduced ? (
          <div className="relative overflow-hidden rounded-2xl">
            {card}
            <div
              key={`shine-${replayKey}`}
              className="animate-shine-sweep pointer-events-none absolute inset-0 z-[2]"
              style={{
                // Base opacity 0 so once the sweep finishes (no animation fill-mode) the
                // element reverts to invisible — leaving no gradient parked on the card.
                opacity: 0,
                background:
                  'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
              }}
            />
          </div>
        ) : (
          card
        )}
      </motion.div>
    </div>
  );
};

export default AchievementReveal;
