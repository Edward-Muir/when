import React from 'react';
import { HistoricalEvent } from '../types';
import TopBar from './TopBar';
import TimelinePanel from './panels/TimelinePanel';

interface ViewTimelineProps {
  allEvents: HistoricalEvent[];
  onHomeClick: () => void;
}

/**
 * Standalone My Timeline view (route: /timeline). Renders the shared TopBar plus the
 * TimelinePanel content; the same panel is embedded as a tab in the home-screen pager.
 */
const ViewTimeline: React.FC<ViewTimelineProps> = ({ allEvents, onHomeClick }) => {
  return (
    <div className="h-screen-safe flex flex-col bg-bg">
      <TopBar
        showTitle={false}
        showHome={true}
        onHomeClick={onHomeClick}
        showStatsAchievements
        activeNav="timeline"
        gameMode={null}
      />
      <div className="pt-topbar-fixed flex flex-1 min-h-0 flex-col">
        <TimelinePanel allEvents={allEvents} />
      </div>
    </div>
  );
};

export default ViewTimeline;
