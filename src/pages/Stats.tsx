import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Ruler,
  Flame,
  CalendarDays,
  Zap,
  Layers,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import { loadAllEvents } from '../utils/eventLoader';
import { getLifetimeStats, getDailyCadence, getCollectionState } from '../utils/statsStorage';

/** One stat: icon tile + big mono value + muted label (mirrors StatsPopup's rows). */
const StatRow: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg">{icon}</div>
    <div className="min-w-0 flex-1">
      <div className="font-mono text-2xl font-bold text-text">{value}</div>
      <div className="font-body text-sm text-text-muted">{label}</div>
    </div>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`rounded-lg border border-border bg-surface p-4 ${className}`}>{children}</div>
);

const iconClass = 'h-5 w-5 text-text-muted';

/**
 * Stats page (route: /stats). Read-only lifetime / daily / collection stats derived
 * from the localStorage primitives. Everything reads zero-defaults on empty storage,
 * so a fresh player sees clean zeros with no crash.
 */
const Stats: React.FC = () => {
  const navigate = useNavigate();

  const [totalEvents, setTotalEvents] = useState(0);
  useEffect(() => {
    loadAllEvents().then((events) => setTotalEvents(events.length));
  }, []);

  const lifetime = getLifetimeStats();
  const cadence = getDailyCadence();
  const collection = getCollectionState();

  const gamesPlayed =
    lifetime.gamesPlayed.daily + lifetime.gamesPlayed.suddenDeath + lifetime.gamesPlayed.freeplay;
  const longestTimeline = Math.max(
    lifetime.longestTimeline.daily,
    lifetime.longestTimeline.suddenDeath,
    lifetime.longestTimeline.freeplay
  );
  const totalTimelineLength =
    lifetime.timelineLengthSum.daily +
    lifetime.timelineLengthSum.suddenDeath +
    lifetime.timelineLengthSum.freeplay;
  const avgTimeline = gamesPlayed > 0 ? (totalTimelineLength / gamesPlayed).toFixed(1) : '—';

  const totalPlacements = lifetime.eventsPlacedCorrect + lifetime.eventsPlacedWrong;
  const accuracy =
    totalPlacements > 0
      ? `${Math.round((lifetime.eventsPlacedCorrect / totalPlacements) * 100)}%`
      : '—';

  const collected = collection.placedEventIds.length;
  const collectionPct = totalEvents > 0 ? Math.round((collected / totalEvents) * 100) : 0;

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg">
      <TopBar showHome showTitle={false} onHomeClick={() => navigate('/')} />

      <div className="mx-auto max-w-2xl px-4 pt-topbar-fixed pb-safe">
        <h1 className="py-5 font-display text-2xl font-bold text-text">Stats</h1>

        {/* Headline trio */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card>
            <StatRow
              icon={<Gamepad2 className={iconClass} />}
              value={gamesPlayed}
              label="Games played"
            />
          </Card>
          <Card>
            <StatRow
              icon={<Ruler className={iconClass} />}
              value={longestTimeline}
              label="Longest timeline"
            />
          </Card>
          <Card>
            <StatRow
              icon={<Flame className={iconClass} />}
              value={cadence.maxDailyStreak}
              label="Max daily streak"
            />
          </Card>
        </div>

        {/* Collection meter */}
        <Card className="mb-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg">
              <Trophy className={iconClass} />
            </div>
            <div className="flex-1">
              <div className="font-mono text-2xl font-bold text-text">
                {collected}
                <span className="text-base text-text-muted"> / {totalEvents || '…'}</span>
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
        </Card>

        {/* Secondary stats */}
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatRow
              icon={<CalendarDays className={iconClass} />}
              value={cadence.currentDailyStreak}
              label="Current daily streak"
            />
            <StatRow
              icon={<CalendarDays className={iconClass} />}
              value={cadence.playedDates.length}
              label="Days played"
            />
            <StatRow
              icon={<Zap className={iconClass} />}
              value={lifetime.bestInGameStreakEver}
              label="Best in-game streak"
            />
            <StatRow
              icon={<Layers className={iconClass} />}
              value={lifetime.eventsPlacedCorrect}
              label="Events placed correctly"
            />
            <StatRow
              icon={<Target className={iconClass} />}
              value={accuracy}
              label="Placement accuracy"
            />
            <StatRow
              icon={<TrendingUp className={iconClass} />}
              value={avgTimeline}
              label="Average timeline length"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
