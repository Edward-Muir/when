import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACHIEVEMENTS } from '../data/achievements';
import AchievementCard from '../components/AchievementCard';
import TopBar from '../components/TopBar';
import { loadAllEvents } from '../utils/eventLoader';
import { buildEventsByName, getAchievements } from '../utils/statsStorage';
import type { HistoricalEvent } from '../types';

/**
 * Trophy case (route: /achievements). The production counterpart to /cards-preview:
 * the same badge grid, driven by real unlock state from localStorage instead of a
 * placeholder. Card art is resolved from the linked event, so the catalogue is loaded
 * once and the name->event map passed down (undefined until loaded → cards render
 * without art).
 */
const Achievements: React.FC = () => {
  const navigate = useNavigate();

  const [eventsByName, setEventsByName] = useState<Map<string, HistoricalEvent>>();
  useEffect(() => {
    loadAllEvents().then((events) => setEventsByName(buildEventsByName(events)));
  }, []);

  // Unlock state is a snapshot read on mount — this page is reached fresh each visit.
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
            <AchievementCard
              key={a.id}
              achievement={a}
              unlocked={isUnlocked(a.id)}
              eventsByName={eventsByName}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg">
      <TopBar
        showHome
        showStatsAchievements
        showTitle={false}
        activeNav="achievements"
        onHomeClick={() => navigate('/')}
      />

      {/* Decorative gradient backdrop so the frosted-glass card shell reads well. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 0%, var(--color-accent-secondary), transparent 55%), radial-gradient(120% 80% at 90% 20%, var(--color-accent), transparent 55%)',
        }}
      />

      <div className="mx-auto max-w-5xl px-4 pt-topbar-fixed pb-safe">
        <div className="flex flex-wrap items-baseline justify-between gap-2 py-5">
          <h1 className="font-display text-2xl font-bold text-text">Achievements</h1>
          <span className="font-mono text-sm text-text-muted">
            {unlocked.length} / {ACHIEVEMENTS.length} unlocked
          </span>
        </div>

        <Section title="Unlocked" items={unlocked} />
        <Section title="Locked" items={locked} />
      </div>
    </div>
  );
};

export default Achievements;
