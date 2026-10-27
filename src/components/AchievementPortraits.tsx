import React, { useEffect, useMemo } from 'react';
import { Lock } from 'lucide-react';
import Portrait from './ui/Portrait';
import { getAchievements } from '../utils/statsStorage';
import { getSeenPortraits, markPortraitsSeen } from '../utils/playerStorage';
import { EARNED_PORTRAITS, newEarnedPortraits, ownedEarnedPortraits } from '../utils/avatar';

interface AchievementPortraitsProps {
  /** Whether the picker is open: ownership is read, and new ones marked seen, per opening. */
  open: boolean;
  /** The tile drawn as selected: the saved pick, or the locked one being previewed. */
  selectedId: string;
  /** Wear an unlocked portrait. */
  onPick: (id: string) => void;
  /** Preview a locked one. */
  onPeek: (id: string) => void;
  headingClass: string;
  gridClass: string;
  tileClass: string;
  selectedClass: string;
  lockedArtClass: string;
}

/**
 * The avatar picker's Achievements section: one portrait per achievement. New ones (owned but
 * never shown) lead with a "New" tag, then the other unlocked ones, then every locked one;
 * catalogue order within each. Opening marks them all seen, so the tags last the visit and
 * are gone the next time. See docs/avatars/index.md.
 */
const AchievementPortraits: React.FC<AchievementPortraitsProps> = ({
  open,
  selectedId,
  onPick,
  onPeek,
  headingClass,
  gridClass,
  tileClass,
  selectedClass,
  lockedArtClass,
}) => {
  // Read once per opening: badges are only earned at the end of a game, never while this is up.
  const { owned, fresh } = useMemo(() => {
    if (!open) return { owned: new Set<string>(), fresh: new Set<string>() };
    const { unlocked } = getAchievements();
    return {
      owned: ownedEarnedPortraits(unlocked),
      fresh: newEarnedPortraits(unlocked, getSeenPortraits()),
    };
  }, [open]);

  useEffect(() => {
    if (open) markPortraitsSeen(owned);
  }, [open, owned]);

  const ordered = useMemo(() => {
    const rank = (id: string) => (fresh.has(id) ? 0 : owned.has(id) ? 1 : 2);
    return [...EARNED_PORTRAITS].sort((a, b) => rank(a.id) - rank(b.id));
  }, [owned, fresh]);

  return (
    <section>
      <h3 className={headingClass}>
        Achievements{' '}
        <span className="normal-case tracking-normal font-normal">
          · {owned.size} of {EARNED_PORTRAITS.length}
        </span>
      </h3>
      <div className={gridClass} role="radiogroup" aria-label="Achievements">
        {ordered.map((portrait) => {
          const unlocked = owned.has(portrait.id);
          const isNew = fresh.has(portrait.id);
          const selected = portrait.id === selectedId;
          const label = isNew
            ? `${portrait.label}, new`
            : unlocked
              ? portrait.label
              : `${portrait.label}, locked`;
          return (
            <button
              key={portrait.id}
              type="button"
              role="radio"
              aria-checked={unlocked && selected}
              aria-label={label}
              onClick={() => (unlocked ? onPick(portrait.id) : onPeek(portrait.id))}
              className={`${tileClass} ${selected ? selectedClass : ''}`}
            >
              <span className="relative flex">
                <Portrait
                  animal={portrait.id}
                  size={44}
                  className={unlocked ? '' : lockedArtClass}
                />
                {isNew && (
                  <span
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-accent px-1 text-[9px] font-semibold leading-[14px] text-white font-body ring-2 ring-bg"
                    aria-hidden
                  >
                    New
                  </span>
                )}
                {!unlocked && (
                  <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-surface border border-border">
                    <Lock className="w-2.5 h-2.5 text-text-muted" aria-hidden />
                  </span>
                )}
              </span>
              <span className="text-[10px] leading-tight text-text-muted font-body truncate max-w-full">
                {portrait.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default AchievementPortraits;
