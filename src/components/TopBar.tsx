import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Menu as MenuIcon, BarChart3, Trophy, Hourglass, Settings } from 'lucide-react';
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
  activeNav?: 'home' | 'custom' | 'stats' | 'achievements' | 'timeline';
  /**
   * When provided, nav buttons call this with the destination key instead of routing — the
   * home screen uses it to scroll its unified pager. A Custom (cog) button is shown only in
   * this mode (Custom has no standalone route). When absent, buttons navigate to routes.
   */
  onNavClick?: (key: 'home' | 'custom' | 'stats' | 'achievements' | 'timeline') => void;
}

const TopBar: React.FC<TopBarProps> = ({
  showHome = false,
  showTitle = true,
  onHomeClick,
  gameMode,
  dailyTheme,
  showStatsAchievements = false,
  activeNav,
  onNavClick,
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

  // Custom's active style is blue (accent-secondary), matching the Custom screen's theme,
  // while the other tabs stay gold.
  const activeButtonClassCustom = `
    relative
    p-2 rounded-xl
    bg-accent-secondary
    border border-accent-secondary
    transition-colors
    active:scale-95
  `;

  type NavDest = 'home' | 'custom' | 'stats' | 'achievements' | 'timeline';
  const navBtn = (key: NavDest) => {
    if (activeNav !== key) return buttonClass;
    return key === 'custom' ? activeButtonClassCustom : activeButtonClass;
  };
  const navIcon = (key: NavDest) => (activeNav === key ? activeIconClass : iconClass);
  const ariaCurrent = (key: NavDest): 'page' | undefined =>
    activeNav === key ? 'page' : undefined;

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

  // Being on a nav tab/page counts as seeing it — clear its dot. Also fires when the home
  // pager is swiped to a tab (activeNav follows the active page). Home/Custom have no dot.
  useEffect(() => {
    if (activeNav && activeNav !== 'home' && activeNav !== 'custom' && !isSeen(activeNav)) {
      markSeen(activeNav);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav]);

  // Unified nav handler. In pager mode (onNavClick set) it scrolls the home pager; otherwise
  // it routes. Stats/Achievements/Timeline clear their one-time "new" dot on first visit.
  const handleNav = (key: NavDest) => {
    if (key !== 'home' && key !== 'custom' && !isSeen(key)) markSeen(key);
    if (onNavClick) {
      onNavClick(key);
    } else if (key === 'home') {
      onHomeClick?.();
    } else if (key !== 'custom') {
      // Custom has no standalone route — its button only renders in pager mode.
      navigate(`/${key}`);
    }
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
              {onHomeClick ? (
                <button
                  onClick={onHomeClick}
                  aria-label="Go home"
                  className="appearance-none bg-transparent p-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <h1 className="text-3xl font-display font-semibold text-text">
                    When<span className="text-accent">?</span>
                  </h1>
                </button>
              ) : (
                <h1 className="text-3xl font-display font-semibold text-text">
                  When<span className="text-accent">?</span>
                </h1>
              )}
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
                onClick={() => handleNav('home')}
                className={navBtn('home')}
                aria-label="Go home"
                aria-current={ariaCurrent('home')}
              >
                <Home className={navIcon('home')} />
              </button>
            )}

            {/* Custom (cog) — pager mode only; jumps to the Custom tab (no standalone route) */}
            {showStatsAchievements && onNavClick && (
              <button
                onClick={() => handleNav('custom')}
                className={navBtn('custom')}
                aria-label="Custom game"
                aria-current={ariaCurrent('custom')}
              >
                <Settings className={navIcon('custom')} />
              </button>
            )}

            {/* Stats + Achievements + Timeline (sibling tabs/routes; active one is highlighted) */}
            {showStatsAchievements && (
              <>
                <button
                  onClick={() => handleNav('stats')}
                  className={navBtn('stats')}
                  aria-label="View stats"
                  aria-current={ariaCurrent('stats')}
                >
                  <BarChart3 className={navIcon('stats')} />
                  {!seenNav.stats && newDot}
                </button>
                <button
                  onClick={() => handleNav('achievements')}
                  className={navBtn('achievements')}
                  aria-label="View achievements"
                  aria-current={ariaCurrent('achievements')}
                >
                  <Trophy className={navIcon('achievements')} />
                  {!seenNav.achievements && newDot}
                </button>
                <button
                  onClick={() => handleNav('timeline')}
                  className={navBtn('timeline')}
                  aria-label="View my timeline"
                  aria-current={ariaCurrent('timeline')}
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
