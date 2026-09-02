import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import AchievementsPanel from '../components/panels/AchievementsPanel';

/**
 * Achievements page (route: /achievements). Renders the shared TopBar (Home + Menu) plus the
 * AchievementsPanel content. Reached from the burger menu; it is not a home-pager tab.
 */
const Achievements: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg">
      <TopBar showHome showTitle={false} onHomeClick={() => navigate('/')} />

      <div className="pt-topbar-fixed pb-safe">
        <AchievementsPanel />
      </div>
    </div>
  );
};

export default Achievements;
