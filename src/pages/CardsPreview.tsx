import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/achievements';
import AchievementCard from '../components/AchievementCard';
import { useTheme } from '../hooks/useTheme';
import { loadAllEvents } from '../utils/eventLoader';
import { buildEventsByName } from '../utils/statsStorage';
import type { HistoricalEvent } from '../types';

type Mode = 'mixed' | 'unlocked' | 'locked';

/**
 * Dev-only harness (route: /cards-preview) for iterating on the achievement-card
 * look before the real achievements page + stats tracking are built. Not linked
 * from the game UI.
 */
const CardsPreview: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>('mixed');

  // Card art is resolved from the linked event, so load the catalogue once and pass
  // the name->event map down. Undefined until loaded → cards render without art.
  const [eventsByName, setEventsByName] = useState<Map<string, HistoricalEvent>>();
  useEffect(() => {
    loadAllEvents().then((events) => setEventsByName(buildEventsByName(events)));
  }, []);

  // In "mixed" mode, treat every other badge as unlocked so both states show together.
  const isUnlocked = (index: number) => {
    if (mode === 'unlocked') return true;
    if (mode === 'locked') return false;
    return index % 2 === 0;
  };

  const unlocked = ACHIEVEMENTS.filter((_, i) => isUnlocked(i));
  const locked = ACHIEVEMENTS.filter((_, i) => !isUnlocked(i));

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
              unlocked={unlocked.includes(a)}
              eventsByName={eventsByName}
            />
          ))}
        </div>
      </section>
    );
  };

  const modeButton = (value: Mode, label: string) => (
    <button
      onClick={() => setMode(value)}
      className={`rounded-xl border px-3 py-1.5 text-sm transition-colors active:scale-95 ${
        mode === value
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-surface text-text hover:bg-border'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg pb-safe">
      {/* Decorative gradient backdrop so the frosted-glass card shell is judgeable. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 0%, var(--color-accent-secondary), transparent 55%), radial-gradient(120% 80% at 90% 20%, var(--color-accent), transparent 55%)',
        }}
      />

      <div className="mx-auto max-w-5xl px-4 pt-safe">
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <h1 className="font-display text-2xl font-bold text-text">Achievement Cards — Preview</h1>
          <div className="flex items-center gap-2">
            {modeButton('mixed', 'Mixed')}
            {modeButton('unlocked', 'All unlocked')}
            {modeButton('locked', 'All locked')}
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-border bg-surface p-2 text-text transition-colors hover:bg-border active:scale-95"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Section title="Completed" items={unlocked} />
        <Section title="Locked" items={locked} />
      </div>
    </div>
  );
};

export default CardsPreview;
