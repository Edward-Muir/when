import React, { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import ConfettiExplosion from 'react-confetti-explosion';
import type { AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import { TIER_STYLES, leadAchievement } from '../data/achievementTiers';
import { getImageUrl } from '../utils/cloudinaryImage';
import ContinueButton from './ui/ContinueButton';

/**
 * A badge as a bare ring: the tier's metal around the event's art, at any diameter. The
 * summary's two sizes (132 and 60) are well under the `thumbnail` rung the stats grid already
 * fetches, so that is the only size asked for. Never `detail`, never a new size
 * (docs/cloudinary-cost-controls.md).
 */
export const BadgeRing: React.FC<{
  achievement: AchievementDef;
  eventsByName: Map<string, HistoricalEvent>;
  /** Diameter in px. */
  size: number;
}> = ({ achievement, eventsByName, size }) => {
  const tier = TIER_STYLES[achievement.tier];
  const src = getImageUrl(eventsByName.get(achievement.eventName)?.image_url, 'thumbnail');
  // The band scales with the badge: 6px at 132, 3px at 60, as `AchievementCard` does at 256/112.
  const band = Math.max(3, Math.round(size / 22));
  return (
    <span
      aria-hidden
      className="relative block shrink-0 rounded-full"
      style={{ width: size, height: size, boxShadow: tier.glow }}
    >
      <span
        className={`absolute inset-0 rounded-full ${tier.shimmer ? 'animate-tier-spin' : ''}`}
        style={{ background: tier.ring }}
      />
      <span className="absolute rounded-full overflow-hidden bg-black/20" style={{ inset: band }}>
        {src && (
          <img
            src={src}
            alt=""
            data-testid="summary-badge-art"
            decoding="async"
            className="w-full h-full object-cover"
          />
        )}
      </span>
    </span>
  );
};

interface AchievementsSummaryProps {
  /** Two or more badges, in unlock order. */
  achievements: AchievementDef[];
  eventsByName: Map<string, HistoricalEvent>;
  /** A badge was tapped: open its detail. */
  onSelect: (achievement: AchievementDef) => void;
  onContinue: () => void;
}

/**
 * Every badge a game unlocked, on one screen. It replaced a reveal per badge, which made a
 * first Daily (five badges) five taps long.
 *
 * The rarest leads (`leadAchievement`: tier, then later in the catalogue) at 132px with its
 * name and how it was earned; the rest follow in unlock order as 60px rings with names, four to
 * a row. Every badge is a button that opens `AchievementDetailPopup`, where the large card and
 * its portrait live. One confetti burst, behind the lead.
 */
const AchievementsSummary: React.FC<AchievementsSummaryProps> = ({
  achievements,
  eventsByName,
  onSelect,
  onContinue,
}) => {
  const reduced = useReducedMotion() ?? false;
  const lead = useMemo(() => leadAchievement(achievements), [achievements]);
  const rest = useMemo(() => achievements.filter((a) => a !== lead), [achievements, lead]);
  if (!lead) return null;

  return (
    <div className="flex flex-col items-center text-center" data-testid="achievements-summary">
      <h2 className="font-display font-bold text-lg text-accent">
        {achievements.length} achievements unlocked
      </h2>

      <div className="relative mt-4 flex justify-center">
        {!reduced && (
          <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2">
            <ConfettiExplosion force={0.6} duration={2200} particleCount={90} width={900} />
          </div>
        )}
        <button
          type="button"
          onClick={() => onSelect(lead)}
          aria-label={`${lead.name}: ${lead.unlockCriteria}`}
          className="flex flex-col items-center rounded-2xl px-2 pt-1 pb-2 transition-transform active:scale-[0.97]"
        >
          <BadgeRing achievement={lead} eventsByName={eventsByName} size={132} />
          <span className="mt-3 font-display font-bold text-lg leading-tight text-text">
            {lead.name}
          </span>
          <span className="mt-1 font-body text-sm leading-snug text-text-muted">
            {lead.unlockCriteria}
          </span>
        </button>
      </div>

      <ul className="mt-3 flex w-full flex-wrap justify-center gap-y-2 list-none p-0">
        {rest.map((achievement) => (
          <li key={achievement.id} className="w-1/4">
            <button
              type="button"
              onClick={() => onSelect(achievement)}
              aria-label={achievement.name}
              className="flex w-full min-h-[44px] flex-col items-center rounded-xl px-0.5 py-1 transition-transform active:scale-[0.95]"
            >
              <BadgeRing achievement={achievement} eventsByName={eventsByName} size={60} />
              <span className="mt-1.5 font-body text-[11px] font-semibold leading-tight text-text line-clamp-2">
                {achievement.name}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <ContinueButton onClick={onContinue} className="mt-5" />
    </div>
  );
};

export default AchievementsSummary;
