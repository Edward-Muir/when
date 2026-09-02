import React, { useEffect, useState } from 'react';
import { ACHIEVEMENTS, type AchievementDef } from '../../data/achievements';
import AchievementCard from '../AchievementCard';
import AchievementDetailPopup from '../AchievementDetailPopup';
import { preloadEventImages } from '../../utils/preloadImage';
import type { HistoricalEvent } from '../../types';
import { StatCard } from './primitives';

interface Props {
  /** `getAchievements().unlocked`: badge id → ISO date of the unlock. */
  unlockedMap: Record<string, string>;
  /** Event catalogue keyed by `name`; undefined until loaded → cards render without art. */
  eventsByName?: Map<string, HistoricalEvent>;
  /** Whether the Stats tab is the one on screen. Gates the badge-art warm only. */
  active: boolean;
}

/**
 * The badge case, inline on the Stats page: the unlocked badges (most recent first) and a
 * "Show all" expander that reveals the locked ones. Replaces the standalone Achievements
 * page, which nobody found in the burger menu.
 *
 * Two rules keep this from stalling the home pager, learned when the full grid was a tab of
 * its own (60 cards of real event art plus an image burst, mounted mid-swipe on iOS):
 * - the locked grid is mounted only while expanded, never pre-rendered;
 * - art is warmed only for the unlocked badges, and only once the tab is actually on screen
 *   (the pager pre-mounts this panel at idle for every home-screen visitor). Expanding warms
 *   the rest.
 */
const BadgesSection: React.FC<Props> = ({ unlockedMap, eventsByName, active }) => {
  const [expanded, setExpanded] = useState(false);
  // The tapped badge shown in the inspection popup (null = closed).
  const [selected, setSelected] = useState<AchievementDef | null>(null);

  // eslint-disable-next-line security/detect-object-injection -- id is an AchievementDef id from our own config
  const unlockedOn = (id: string): string | undefined => unlockedMap[id];
  const isUnlocked = (id: string) => !!unlockedOn(id);

  // Most recent unlock first; same-day unlocks keep catalogue order.
  const unlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).sort((a, b) =>
    (unlockedOn(b.id) ?? '').localeCompare(unlockedOn(a.id) ?? '')
  );
  const locked = ACHIEVEMENTS.filter((a) => !isUnlocked(a.id));

  // Warm the unlocked badges' thumbnails once the tab is on screen, and the rest on expand.
  // Deduplicated by preloadImage, so re-firing on revisits is free.
  useEffect(() => {
    if (!eventsByName || !active) return;
    const wanted = expanded ? ACHIEVEMENTS : unlocked;
    preloadEventImages(
      wanted.map((a) => eventsByName.get(a.eventName)),
      ['thumbnail'],
      'low'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `unlocked` is derived from unlockedMap
  }, [eventsByName, active, expanded, unlockedMap]);

  const grid = (items: AchievementDef[]) => (
    <div className="grid grid-cols-2 gap-3">
      {items.map((a) => (
        <button
          key={a.id}
          onClick={() => setSelected(a)}
          aria-label={`View ${a.name} achievement`}
          className="h-full text-left touch-manipulation active:scale-95"
        >
          <AchievementCard
            achievement={a}
            unlocked={isUnlocked(a.id)}
            eventsByName={eventsByName}
          />
        </button>
      ))}
    </div>
  );

  return (
    <StatCard>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-body text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Badges
        </h2>
        <p className="font-body text-sm text-text-muted">
          <span className="font-mono">{unlocked.length}</span> of{' '}
          <span className="font-mono">{ACHIEVEMENTS.length}</span> unlocked
        </p>
      </div>

      {unlocked.length > 0 ? (
        grid(unlocked)
      ) : (
        <p className="font-body text-sm text-text-muted">Finish a game to earn your first badge.</p>
      )}

      {expanded && locked.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-3 font-display text-lg font-bold text-text">Locked</h3>
          {grid(locked)}
        </section>
      )}

      {locked.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-4 w-full rounded-lg border border-border bg-bg py-2.5 font-body text-sm font-semibold text-text transition-colors hover:bg-border active:scale-[0.98]"
        >
          {expanded ? 'Show fewer' : `Show all ${ACHIEVEMENTS.length}`}
        </button>
      )}

      <AchievementDetailPopup
        achievement={selected}
        unlocked={selected ? isUnlocked(selected.id) : false}
        eventsByName={eventsByName}
        onDismiss={() => setSelected(null)}
      />
    </StatCard>
  );
};

export default BadgesSection;
