import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import App from '../App';
import { navForPath } from '../components/TopBar';

/**
 * The home screen at `/`, `/archive`, `/custom` and `/stats`: one route, one `App`, opened
 * on the tab the path names. One route rather than four so the URL can follow the pager as
 * the player swipes without remounting the whole home screen (`ModeSelect` replaces the
 * path on each tab change). Any other single segment falls back to `/`, as the catch-all
 * route does for deeper paths.
 */
const HomeRoute: React.FC = () => {
  const { tab } = useParams();
  const key = navForPath(`/${tab ?? ''}`);
  if (!key) return <Navigate to="/" replace />;
  return <App initialTab={key} />;
};

export default HomeRoute;
