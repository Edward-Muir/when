import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import AchievementsPanel from '../components/panels/AchievementsPanel';

/**
 * Achievements page (route: /achievements). Renders the shared TopBar plus the
 * AchievementsPanel content; the same panel is embedded as a tab in the home-screen pager.
 */
const Achievements: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg">
      <TopBar
        showHome
        showStatsAchievements
        showTitle={false}
        activeNav="achievements"
        onHomeClick={() => navigate('/')}
      />

      <div className="px-4 pt-topbar-fixed pb-safe">
        <AchievementsPanel />
      </div>
    </div>
  );
};

export default Achievements;
