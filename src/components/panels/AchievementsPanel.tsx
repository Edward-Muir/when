import React, { useEffect, useState } from 'react';
import { ACHIEVEMENTS, type AchievementDef } from '../../data/achievements';
import AchievementCard from '../AchievementCard';
import AchievementDetailPopup from '../AchievementDetailPopup';
import { loadAllEvents, getCachedEvents } from '../../utils/eventLoader';
import { buildEventsByName, getAchievements } from '../../utils/statsStorage';
import { preloadEventImages } from '../../utils/preloadImage';
import type { HistoricalEvent } from '../../types';

/**
 * Trophy-case content panel: the badge grid driven by real unlock state from localStorage.
 * Rendered both by the `/achievements` route (wrapped in a TopBar) and as a tab inside the
 * home-screen pager. Card art is resolved from the linked event, so the catalogue is loaded
 * once and the name->event map passed down (undefined until loaded → cards render without art).
 * Tapping a badge opens the large-format inspection popup.
 */
const AchievementsPanel: React.FC = () => {
  // Seed synchronously from the module-level catalogue cache (populated during the app's
  // loading phase) so remounts render art immediately instead of flashing art-less cards.
  const [eventsByName, setEventsByName] = useState<Map<string, HistoricalEvent> | undefined>(() => {
    const cached = getCachedEvents();
    return cached ? buildEventsByName(cached) : undefined;
  });
  useEffect(() => {
    if (eventsByName) return;
    loadAllEvents().then((events) => setEventsByName(buildEventsByName(events)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback fetch, run once on mount
  }, []);

  // Warm every badge thumbnail at low priority so the grid renders from cache on first
  // view (the panel is pre-mounted at idle by the pager). Deduplicated by preloadImage.
  useEffect(() => {
    if (!eventsByName) return;
    preloadEventImages(
      ACHIEVEMENTS.map((a) => eventsByName.get(a.eventName)),
      ['thumbnail'],
      'low'
    );
  }, [eventsByName]);

  // The tapped badge shown in the inspection popup (null = closed).
  const [selected, setSelected] = useState<AchievementDef | null>(null);

  // Unlock state is a snapshot read on mount.
  const unlockedMap = getAchievements().unlocked;
  // eslint-disable-next-line security/detect-object-injection -- id is an AchievementDef id from our own config
  const isUnlocked = (id: string) => !!unlockedMap[id];

  const unlocked = ACHIEVEMENTS.filter((a) => isUnlocked(a.id));
  const locked = ACHIEVEMENTS.filter((a) => !isUnlocked(a.id));

  const Section = ({ title, items }: { title: string; items: typeof ACHIEVEMENTS }) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-bold text-text">{title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
      </section>
    );
  };

  return (
    // `relative` so the decorative gradient stays scoped to this panel (it's `absolute`,
    // not `fixed`) and doesn't bleed across other pager tabs.
    <div className="relative mx-auto w-full max-w-sm px-3">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 0%, var(--color-accent-secondary), transparent 55%), radial-gradient(120% 80% at 90% 20%, var(--color-accent), transparent 55%)',
        }}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2 py-5">
        <h1 className="font-display text-2xl font-bold text-text">Achievements</h1>
        <span className="font-mono text-sm text-text-muted">
          {unlocked.length} / {ACHIEVEMENTS.length} unlocked
        </span>
      </div>

      <Section title="Unlocked" items={unlocked} />
      <Section title="Locked" items={locked} />

      <AchievementDetailPopup
        achievement={selected}
        unlocked={selected ? isUnlocked(selected.id) : false}
        eventsByName={eventsByName}
        onDismiss={() => setSelected(null)}
      />
    </div>
  );
};

export default AchievementsPanel;
