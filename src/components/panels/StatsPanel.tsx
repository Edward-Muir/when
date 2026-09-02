import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Flame,
  Gamepad2,
  Layers,
  Library,
  Medal,
  Ruler,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { loadAllEvents, getCachedEvents } from '../../utils/eventLoader';
import {
  buildEventsByName,
  getAchievements,
  getCollectionState,
  getDailyCadence,
  getLifetimeStats,
} from '../../utils/statsStorage';
import { getTodayResult } from '../../utils/playerStorage';
import {
  buildHeatmapWeeks,
  dailyAverage,
  formatShortDate,
  lifetimeFrom,
  recordsFrom,
  scoreBuckets,
} from '../../utils/statsDerived';
import { ACHIEVEMENTS } from '../../data/achievements';
import { useToday } from '../../hooks/useToday';
import { StatCard, StatRow, SectionHeading, iconClass } from '../stats/primitives';
import CalendarHeatmap from '../stats/CalendarHeatmap';
import ScoreDistribution from '../stats/ScoreDistribution';
import BadgesSection from '../stats/BadgesSection';
import type { HistoricalEvent } from '../../types';

const badgeName = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;

interface StatsPanelProps {
  /**
   * Whether this panel is the visible pager tab. The pager pre-mounts it at idle, so the
   * badge-art warm waits for the tab to actually be shown (see `BadgesSection`).
   */
  active?: boolean;
}

/**
 * Stats content panel: records, the year calendar, daily score bars, the badge case,
 * lifetime totals and the collection meter — all derived from the localStorage primitives.
 * Mounted by the home-screen pager's Stats tab (which `/stats` opens directly); the pager
 * page owns the scroll container. Everything reads zero-defaults on empty storage, so a
 * fresh player sees clean zeros with no crash.
 *
 * Storage is re-read every render, like the Archive tab: a game just finished writes here
 * and the pager re-renders on return without any of this panel's deps changing. The
 * derivations are a few hundred cells and renders are rare, so nothing is memoised.
 */
const StatsPanel: React.FC<StatsPanelProps> = ({ active = true }) => {
  const today = useToday();
  // The catalogue, for the collection total and the badges' art. Seeded synchronously from
  // the module-level cache (populated during the app's loading phase) so remounts render
  // badge art immediately instead of flashing art-less cards.
  const [events, setEvents] = useState<HistoricalEvent[]>(() => getCachedEvents() ?? []);
  useEffect(() => {
    if (events.length > 0) return;
    loadAllEvents().then(setEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback fetch, run once on mount
  }, []);
  const totalEvents = events.length;
  const eventsByName = useMemo(
    () => (events.length > 0 ? buildEventsByName(events) : undefined),
    [events]
  );

  const lifetime = getLifetimeStats();
  const cadence = getDailyCadence();
  const collection = getCollectionState();
  const achievements = getAchievements();
  const todayResult = getTodayResult();

  const records = recordsFrom(lifetime, cadence);
  const totals = lifetimeFrom(lifetime, cadence);
  const heatmap = buildHeatmapWeeks({
    playedDates: cadence.playedDates,
    unlocked: achievements.unlocked,
    firstPlayedDate: lifetime.firstPlayedDate || undefined,
    today,
  });
  const buckets = scoreBuckets(cadence.dailyCorrectHistogram, todayResult?.correctCount);

  const collected = collection.placedEventIds.length;
  const collectionPct = totalEvents > 0 ? Math.round((collected / totalEvents) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-sm px-3">
      {/* Header — the Daily, Custom and Archive pages' heading, so the tabs read alike */}
      <div className="text-left mb-3">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Stats</h1>
        <p className="text-text-muted text-sm mt-1 font-body">How you've played, day by day</p>
      </div>

      <div className="flex flex-col gap-3 pb-4">
        <StatCard>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <StatRow
              icon={<Ruler className={iconClass} />}
              value={records.longestTimeline}
              label="Longest timeline"
            />
            <StatRow
              icon={<Zap className={iconClass} />}
              value={records.bestStreak}
              label="Best streak"
            />
            <StatRow
              icon={<Flame className={iconClass} />}
              value={records.longestDailyRun}
              label="Longest daily run"
            />
            <StatRow
              icon={<Medal className={iconClass} />}
              value={records.bestDailyScore}
              label="Best daily score"
            />
          </div>
        </StatCard>

        <StatCard>
          <SectionHeading>Your year</SectionHeading>
          <CalendarHeatmap model={heatmap} badgeName={badgeName} />
        </StatCard>

        <StatCard>
          <SectionHeading>Daily scores</SectionHeading>
          <ScoreDistribution
            buckets={buckets}
            todayCorrect={todayResult?.correctCount}
            average={dailyAverage(cadence)}
          />
        </StatCard>

        <BadgesSection
          unlockedMap={achievements.unlocked}
          eventsByName={eventsByName}
          active={active}
        />

        <StatCard>
          <SectionHeading>Lifetime</SectionHeading>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <StatRow
              icon={<Gamepad2 className={iconClass} />}
              value={totals.gamesPlayed}
              label="Games played"
            />
            <StatRow
              icon={<CalendarDays className={iconClass} />}
              value={totals.dailyGames}
              label="Daily games"
            />
            <StatRow
              icon={<Layers className={iconClass} />}
              value={totals.eventsPlaced.toLocaleString()}
              label="Events placed"
            />
            <StatRow
              icon={<TrendingUp className={iconClass} />}
              value={totals.averageTimeline ?? '—'}
              label="Average timeline"
            />
          </div>
          {lifetime.firstPlayedDate && (
            <p className="mt-3 font-body text-xs text-text-muted">
              Playing since {formatShortDate(lifetime.firstPlayedDate)}
            </p>
          )}
        </StatCard>

        <StatCard>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg">
              <Library className={iconClass} />
            </div>
            <div className="flex-1">
              <div className="font-mono text-2xl font-bold text-text">
                {collected.toLocaleString()}
                <span className="text-base text-text-muted">
                  {' '}
                  / {totalEvents ? totalEvents.toLocaleString() : '…'}
                </span>
              </div>
              <div className="font-body text-sm text-text-muted">Events collected</div>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${collectionPct}%` }}
            />
          </div>
        </StatCard>
      </div>
    </div>
  );
};

export default StatsPanel;
