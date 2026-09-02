import React from 'react';
import { HistoricalEvent } from '../types';
import TopBar from './TopBar';
import TimelinePanel from './panels/TimelinePanel';

interface ViewTimelineProps {
  allEvents: HistoricalEvent[];
  onHomeClick: () => void;
}

/**
 * Standalone My Timeline view (route: /timeline). Renders the shared TopBar (full navigation)
 * plus the TimelinePanel content. Reached from the burger menu; it is not a home-pager tab.
 */
const ViewTimeline: React.FC<ViewTimelineProps> = ({ allEvents, onHomeClick }) => {
  return (
    <div className="h-screen-safe flex flex-col bg-bg">
      <TopBar
        showTitle={false}
        showHome={true}
        showStatsAchievements
        onHomeClick={onHomeClick}
        gameMode={null}
      />
      <div className="pt-topbar-wide flex flex-1 min-h-0 flex-col">
        <TimelinePanel allEvents={allEvents} />
      </div>
    </div>
  );
};

export default ViewTimeline;
