import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import StatsPanel from '../components/panels/StatsPanel';

/**
 * Stats page (route: /stats). Renders the shared TopBar plus the StatsPanel content; the
 * same panel is embedded as a tab in the home-screen pager.
 */
const Stats: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg">
      <TopBar
        showHome
        showStatsAchievements
        showTitle={false}
        activeNav="stats"
        onHomeClick={() => navigate('/')}
      />

      <div className="pt-topbar-fixed pb-safe">
        <StatsPanel />
      </div>
    </div>
  );
};

export default Stats;
