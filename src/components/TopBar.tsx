import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Menu as MenuIcon, BarChart3, Trophy, Hourglass } from 'lucide-react';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { hasSeenNav, markNavSeen, NavKey } from '../utils/playerStorage';
import { Toast } from './Toast';
import { UpdatePopup } from './UpdatePopup';
import Menu from './Menu';
import { GameMode } from '../types';

interface TopBarProps {
  showHome?: boolean;
  showTitle?: boolean;
  onHomeClick?: () => void;
  gameMode?: GameMode | null;
  dailyTheme?: string;
  /** Show the Stats + Achievements + Timeline buttons (navigate to their pages). */
  showStatsAchievements?: boolean;
  /** Which nav destination is the current page — that button renders in the active style. */
  activeNav?: 'home' | 'stats' | 'achievements' | 'timeline';
}

const TopBar: React.FC<TopBarProps> = ({
  showHome = false,
  showTitle = true,
  onHomeClick,
  gameMode,
  dailyTheme,
  showStatsAchievements = false,
  activeNav,
}) => {
  const navigate = useNavigate();
  const { updateAvailable } = useVersionCheck();
  const [showToast, setShowToast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  // `relative` lets the "new" dot anchor to the top-right of nav buttons.
  const buttonClass = `
    relative
    p-2 rounded-xl
    bg-surface
    border border-border
    hover:bg-border
    transition-colors
    active:scale-95
  `;

  const iconClass = 'w-5 h-5 text-text';

  // Active (current-page) nav button: filled accent + white icon.
  const activeButtonClass = `
    relative
    p-2 rounded-xl
    bg-accent
    border border-accent
    transition-colors
    active:scale-95
  `;
  const activeIconClass = 'w-5 h-5 text-white';

  const navBtn = (key: 'home' | 'stats' | 'achievements' | 'timeline') =>
    activeNav === key ? activeButtonClass : buttonClass;
  const navIcon = (key: 'home' | 'stats' | 'achievements' | 'timeline') =>
    activeNav === key ? activeIconClass : iconClass;

  // One-time "new" dots on the Stats/Achievements/Timeline buttons until first visited.
  const [seenNav, setSeenNav] = useState(() => ({
    stats: hasSeenNav('stats'),
    achievements: hasSeenNav('achievements'),
    timeline: hasSeenNav('timeline'),
  }));

  // Switch-based updates avoid dynamic key indexing (security/detect-object-injection).
  const markSeen = (key: NavKey) => {
    markNavSeen(key);
    setSeenNav((prev) => {
      switch (key) {
        case 'stats':
          return { ...prev, stats: true };
        case 'achievements':
          return { ...prev, achievements: true };
        case 'timeline':
          return { ...prev, timeline: true };
      }
    });
  };
  const isSeen = (key: NavKey) => {
    switch (key) {
      case 'stats':
        return seenNav.stats;
      case 'achievements':
        return seenNav.achievements;
      case 'timeline':
        return seenNav.timeline;
    }
  };

  // Being on a nav page counts as seeing it — clear its dot so it never shows on its own button.
  useEffect(() => {
    if (activeNav && activeNav !== 'home' && !isSeen(activeNav)) {
      markSeen(activeNav);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav]);

  const visitNav = (key: NavKey) => {
    if (!isSeen(key)) markSeen(key);
    navigate(`/${key}`);
  };

  // Gold "new" dot; the bg ring separates it from the button edge.
  const newDot = (
    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />
  );

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-bg pt-safe border-b border-border transition-colors">
        <div className="flex items-center justify-between gap-2 p-2">
          {/* Game Title */}
          {showTitle ? (
            <div className="flex items-start gap-2 pl-2">
              <h1 className="text-3xl font-display font-semibold text-text">
                When<span className="text-accent">?</span>
              </h1>
              <AnimatePresence>
                {dailyTheme && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="mt-1 px-2 py-0.5 text-xs font-body font-medium bg-accent text-white rounded-full"
                  >
                    {dailyTheme}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div />
          )}

          {/* Navigation only: Home · Stats · Achievements · Timeline · Menu.
              The current destination is rendered in the active (accent-filled) style. */}
          <div className="flex items-center gap-2">
            {/* Home Button - a permanent nav destination; active when on the home page */}
            {showHome && onHomeClick && (
              <button
                onClick={onHomeClick}
                className={navBtn('home')}
                aria-label="Go home"
                aria-current={activeNav === 'home' ? 'page' : undefined}
              >
                <Home className={navIcon('home')} />
              </button>
            )}

            {/* Stats + Achievements + Timeline (sibling routes; active one is highlighted) */}
            {showStatsAchievements && (
              <>
                <button
                  onClick={() => visitNav('stats')}
                  className={navBtn('stats')}
                  aria-label="View stats"
                  aria-current={activeNav === 'stats' ? 'page' : undefined}
                >
                  <BarChart3 className={navIcon('stats')} />
                  {!seenNav.stats && newDot}
                </button>
                <button
                  onClick={() => visitNav('achievements')}
                  className={navBtn('achievements')}
                  aria-label="View achievements"
                  aria-current={activeNav === 'achievements' ? 'page' : undefined}
                >
                  <Trophy className={navIcon('achievements')} />
                  {!seenNav.achievements && newDot}
                </button>
                <button
                  onClick={() => visitNav('timeline')}
                  className={navBtn('timeline')}
                  aria-label="View my timeline"
                  aria-current={activeNav === 'timeline' ? 'page' : undefined}
                >
                  <Hourglass className={navIcon('timeline')} />
                  {!seenNav.timeline && newDot}
                </button>
              </>
            )}

            {/* Menu Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className={buttonClass}
              aria-label="Open menu"
            >
              <MenuIcon className={iconClass} />
            </button>
          </div>
        </div>
      </div>

      {/* Toast for clipboard copy */}
      <Toast
        message="Copied to clipboard!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Slide-in Menu */}
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShowToast={() => setShowToast(true)}
        gameMode={gameMode}
      />

      {/* Update Available Popup */}
      <UpdatePopup
        isVisible={updateAvailable && !updateDismissed}
        onDismiss={() => setUpdateDismissed(true)}
      />
    </>
  );
};

export default TopBar;
