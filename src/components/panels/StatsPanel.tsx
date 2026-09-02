import React, { useEffect, useState } from 'react';
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
import { loadAllEvents } from '../../utils/eventLoader';
import {
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
import AchievementsTile from '../stats/AchievementsTile';

const badgeName = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)?.name ?? id;

/**
 * Stats content panel: records, the year calendar, daily score bars, the achievements
 * link, lifetime totals and the collection meter — all derived from the localStorage
 * primitives. Rendered both by the `/stats` route (under a TopBar) and as a tab inside the
 * home-screen pager, each of which owns the scroll container. Everything reads zero-defaults
 * on empty storage, so a fresh player sees clean zeros with no crash.
 *
 * Storage is re-read every render, like the Archive tab: a game just finished writes here
 * and the pager re-renders on return without any of this panel's deps changing. The
 * derivations are a few hundred cells and renders are rare, so nothing is memoised.
 */
const StatsPanel: React.FC = () => {
  const today = useToday();
  const [totalEvents, setTotalEvents] = useState(0);
  useEffect(() => {
    loadAllEvents().then((events) => setTotalEvents(events.length));
  }, []);

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
  const unlockedCount = ACHIEVEMENTS.filter((a) => !!achievements.unlocked[a.id]).length;

  const collected = collection.placedEventIds.length;
  const collectionPct = totalEvents > 0 ? Math.round((collected / totalEvents) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-sm px-3">
      {/* Header — the Daily, Custom and Archive pages' heading, so the tabs read alike */}
      <div className="text-left mb-3">
        <h1 className="text-5xl font-bold text-text font-display leading-none">Stats</h1>
        <p className="text-text-muted text-sm mt-1 font-body">
          Your records, daily calendar and collection
        </p>
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

        <AchievementsTile unlocked={unlockedCount} total={ACHIEVEMENTS.length} />

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
