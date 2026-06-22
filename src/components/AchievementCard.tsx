import React from 'react';
import { Lock } from 'lucide-react';
import type { AchievementDef } from '../data/achievements';
import { TIER_STYLES, LOCKED_RING } from '../data/achievementTiers';
import { getImageUrl } from '../utils/cloudinaryImage';

interface AchievementCardProps {
  achievement: AchievementDef;
  unlocked: boolean;
}

/**
 * Wingspan-style achievement card: a frosted portrait card with a circular badge.
 * Unlocked = full-colour event art + a tier-tinted metallic ring.
 * Locked = darkened/desaturated art behind a lock icon, with a muted neutral ring.
 *
 * Session 1 is visual-only; real unlock state gets wired in later.
 */
const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, unlocked }) => {
  const tier = TIER_STYLES[achievement.tier];
  const imageSrc = getImageUrl(achievement.imageUrl, 'detail');

  return (
    <div className="flex flex-col items-center text-center rounded-2xl border border-border bg-surface/60 backdrop-blur-md shadow-sm px-3 pt-3 pb-4">
      {/* Badge: ring + circular art + (locked) lock overlay */}
      <div className="relative w-28 h-28">
        {/* Metallic tier ring (its own layer so it can shimmer without spinning the art) */}
        <div
          className={`absolute inset-0 rounded-full ${
            unlocked && tier.shimmer ? 'animate-tier-spin' : ''
          }`}
          style={{
            background: unlocked ? tier.ring : LOCKED_RING,
            boxShadow: unlocked ? tier.glow : undefined,
          }}
        />

        {/* Circular event art, inset to reveal the ring as a band */}
        <div className="absolute inset-[5px] rounded-full overflow-hidden bg-black/20">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={unlocked ? achievement.name : ''}
              loading="lazy"
              className={`w-full h-full object-cover transition-[filter] ${
                unlocked ? '' : 'grayscale brightness-[0.62] contrast-[0.82] opacity-85'
              }`}
            />
          )}
          {!unlocked && (
            <>
              {/* Dormant veil so the colour pop on unlock feels earned */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/50" />
              {/* Lock chip: a frosted disc reads as a deliberate affordance, not a stray icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-black/35 backdrop-blur-[2px] ring-1 ring-white/30 shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
                  <Lock className="w-[18px] h-[18px] text-white/95" strokeWidth={2} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        className={`mt-3 font-display font-bold leading-tight text-[0.95rem] ${
          unlocked ? 'text-text' : 'text-text-muted'
        }`}
      >
        {achievement.name}
      </h3>

      {/* How-to-unlock / criterion (shown in both states) */}
      <p className="mt-1 font-body text-xs leading-snug text-text-muted">
        {achievement.unlockCriteria}
      </p>
    </div>
  );
};

export default AchievementCard;
