import React from 'react';
import { Lock } from 'lucide-react';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import { TIER_STYLES, LOCKED_RING } from '../data/achievementTiers';
import { getImageUrl } from '../utils/cloudinaryImage';

interface AchievementCardProps {
  achievement: AchievementDef;
  unlocked: boolean;
  /**
   * Event catalogue keyed by `name`. The card's art is resolved from the linked
   * event (`achievement.eventName`) so the image URL has a single source of truth
   * (the event JSON). Undefined while the catalogue is still loading → no image.
   */
  eventsByName?: Map<string, HistoricalEvent>;
  /**
   * Badge/text scale. `'sm'` (default) is the grid/preview size; `'lg'` doubles the
   * circular image diameter for the post-game unlock celebration.
   */
  size?: 'sm' | 'lg';
}

// Darkening veil + frosted lock chip layered over locked badge art.
function LockedOverlay() {
  return (
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
  );
}

// The circular badge: metallic tier ring + inset event art + (locked) overlay.
function Badge({
  achievement,
  unlocked,
  imageSrc,
  placeholderSrc,
  large,
}: {
  achievement: AchievementDef;
  unlocked: boolean;
  imageSrc?: string;
  /** Already-cached lower-res URL shown under the art while it loads (large popup only). */
  placeholderSrc?: string;
  large: boolean;
}) {
  const tier = TIER_STYLES[achievement.tier];
  return (
    <div className={`relative ${large ? 'w-64 h-64' : 'w-28 h-28'}`}>
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
      <div
        className={`absolute ${large ? 'inset-[10px]' : 'inset-[5px]'} rounded-full overflow-hidden bg-black/20`}
      >
        {imageSrc && (
          <img
            src={imageSrc}
            alt={unlocked ? achievement.name : ''}
            loading="lazy"
            className={`w-full h-full object-cover transition-[filter] ${
              unlocked ? '' : 'grayscale brightness-[0.62] contrast-[0.82] opacity-85'
            }`}
            style={
              placeholderSrc
                ? { backgroundImage: `url(${placeholderSrc})`, backgroundSize: 'cover' }
                : undefined
            }
          />
        )}
        {!unlocked && <LockedOverlay />}
      </div>
    </div>
  );
}

/**
 * Wingspan-style achievement card: a frosted portrait card with a circular badge.
 * Unlocked = full-colour event art + a tier-tinted metallic ring.
 * Locked = darkened/desaturated art behind a lock icon, with a muted neutral ring.
 *
 * Session 1 is visual-only; real unlock state gets wired in later.
 */
const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  unlocked,
  eventsByName,
  size = 'sm',
}) => {
  const event = eventsByName?.get(achievement.eventName);
  const large = size === 'lg';
  // The small grid badge (112px circle) uses the width-capped thumbnail — the uncapped
  // detail variant is reserved for the large popup/celebration render, which layers the
  // (already-cached) thumbnail underneath so the popup shows art instantly.
  const imageSrc = getImageUrl(event?.image_url, large ? 'detail' : 'thumbnail');
  const placeholderSrc = large ? getImageUrl(event?.image_url, 'thumbnail') : undefined;

  return (
    <div className="flex h-full flex-col items-center text-center rounded-2xl border border-border bg-surface/60 backdrop-blur-md shadow-sm px-3 pt-3 pb-4">
      <Badge
        achievement={achievement}
        unlocked={unlocked}
        imageSrc={imageSrc}
        placeholderSrc={placeholderSrc}
        large={large}
      />

      {/* Title */}
      <h3
        className={`mt-3 font-display font-bold leading-tight ${large ? 'text-lg' : 'text-[0.95rem]'} ${
          unlocked ? 'text-text' : 'text-text-muted'
        }`}
      >
        {achievement.name}
      </h3>

      {/* How-to-unlock / criterion (shown in both states) */}
      <p className={`mt-1 font-body ${large ? 'text-sm' : 'text-xs'} leading-snug text-text-muted`}>
        {achievement.unlockCriteria}
      </p>
    </div>
  );
};

export default AchievementCard;
