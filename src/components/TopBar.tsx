import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Menu as MenuIcon, BarChart3, Settings, Archive, Hourglass } from 'lucide-react';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { hasSeenNav, markNavSeen, NavKey } from '../utils/playerStorage';
import { Toast } from './Toast';
import { UpdatePopup } from './UpdatePopup';
import Menu from './Menu';
import { GameMode } from '../types';

/**
 * Every nav destination, in the order the home pager shows them. Also the home pager's tab
 * key type, so the two cannot drift apart. Achievements is not one: the badges live on the
 * Stats tab (`stats/BadgesSection.tsx`).
 */
export type NavDest = 'home' | 'archive' | 'custom' | 'stats' | 'timeline';

/**
 * The path that opens the home screen on each tab. Every tab is addressable, so the top bar
 * can show the same five buttons on every page: in the pager they scroll, elsewhere they
 * navigate here and the home screen opens on that tab (`src/pages/Home.tsx`).
 */
const NAV_PATHS: Record<NavDest, string> = {
  home: '/',
  archive: '/archive',
  custom: '/custom',
  stats: '/stats',
  timeline: '/timeline',
};

// eslint-disable-next-line security/detect-object-injection -- key is the NavDest union
export const pathForNav = (key: NavDest): string => NAV_PATHS[key];

/** The tab a path names, or null for any other path. */
export function navForPath(pathname: string): NavDest | null {
  const entry = Object.entries(NAV_PATHS).find(([, path]) => path === pathname);
  return entry ? (entry[0] as NavDest) : null;
}

interface TopBarProps {
  showHome?: boolean;
  showTitle?: boolean;
  onHomeClick?: () => void;
  gameMode?: GameMode | null;
  dailyTheme?: string;
  /** Show the Archive, Custom, Stats and Timeline buttons. */
  showStatsAchievements?: boolean;
  /** Which nav destination is the current page — that button renders in the active style. */
  activeNav?: NavDest;
  /**
   * When provided, nav buttons call this with the destination key instead of routing — the
   * home screen uses it to scroll its unified pager. When absent, buttons navigate to the
   * tab's path, which opens the home screen on that tab.
   */
  onNavClick?: (key: NavDest) => void;
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

  const navBtn = (key: NavDest) => {
    if (activeNav !== key) return buttonClass;
    return key === 'custom' ? activeButtonClassCustom : activeButtonClass;
  };
  const navIcon = (key: NavDest) => (activeNav === key ? activeIconClass : iconClass);
  const ariaCurrent = (key: NavDest): 'page' | undefined =>
    activeNav === key ? 'page' : undefined;

  // One-time "new" dots until first visited, on the Archive, Stats and Timeline buttons. The
  // Stats dot is also re-armed whenever a badge unlocks (`useGameStatsRecorder`).
  const [seenNav, setSeenNav] = useState(() => ({
    archive: hasSeenNav('archive'),
    stats: hasSeenNav('stats'),
    timeline: hasSeenNav('timeline'),
  }));

  // Switch-based updates avoid dynamic key indexing (security/detect-object-injection).
  const markSeen = (key: NavKey) => {
    markNavSeen(key);
    setSeenNav((prev) => {
      switch (key) {
        case 'archive':
          return { ...prev, archive: true };
        case 'stats':
          return { ...prev, stats: true };
        case 'timeline':
          return { ...prev, timeline: true };
      }
    });
  };
  const isSeen = (key: NavKey) => {
    switch (key) {
      case 'archive':
        return seenNav.archive;
      case 'stats':
        return seenNav.stats;
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
  // it routes. Archive/Stats clear their one-time "new" dot on first visit.
  const handleNav = (key: NavDest) => {
    if (key !== 'home' && key !== 'custom' && !isSeen(key)) markSeen(key);
    if (onNavClick) {
      onNavClick(key);
    } else if (key === 'home') {
      onHomeClick?.();
    } else {
      navigate(pathForNav(key));
    }
  };

  // Gold "new" dot; the bg ring separates it from the button edge.
  const newDot = (
    <span
      role="img"
      aria-label="New"
      className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg"
    />
  );
  const newDotFor = (key: NavKey) => (isSeen(key) ? null : newDot);

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
                    // max-w + truncate because curated theme names run to 20 characters
                    // ("Crowns & Coronations") against a longest category name of 12
                    // ("Architecture"). Unconstrained, the pill pushes into the nav row on a
                    // 320px screen. The full name is on the Daily hero card either way.
                    className="mt-1 max-w-[9.5rem] truncate px-2 py-0.5 text-xs font-body font-medium bg-accent text-white rounded-full whitespace-nowrap"
                    title={dailyTheme}
                  >
                    {dailyTheme}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div />
          )}

          {/* Navigation only: Home · Archive · Custom · Stats · Timeline · Menu. The current
              destination is rendered in the active (accent-filled) style. Six buttons fit a
              320px phone at gap-2 / p-2 (6 × 38px + 5 × 8px + 16px = 284px); seven did not. */}
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

            {/* Archive — the past-decks tab */}
            {showStatsAchievements && (
              <button
                onClick={() => handleNav('archive')}
                className={navBtn('archive')}
                aria-label="Past decks"
                aria-current={ariaCurrent('archive')}
              >
                <Archive className={navIcon('archive')} />
                {newDotFor('archive')}
              </button>
            )}

            {/* Custom (cog) */}
            {showStatsAchievements && (
              <button
                onClick={() => handleNav('custom')}
                className={navBtn('custom')}
                aria-label="Custom game"
                aria-current={ariaCurrent('custom')}
              >
                <Settings className={navIcon('custom')} />
              </button>
            )}

            {/* Stats */}
            {showStatsAchievements && (
              <button
                onClick={() => handleNav('stats')}
                className={navBtn('stats')}
                aria-label="View stats"
                aria-current={ariaCurrent('stats')}
              >
                <BarChart3 className={navIcon('stats')} />
                {newDotFor('stats')}
              </button>
            )}

            {/* My Timeline — the collection tab */}
            {showStatsAchievements && (
              <button
                onClick={() => handleNav('timeline')}
                className={navBtn('timeline')}
                aria-label="View my timeline"
                aria-current={ariaCurrent('timeline')}
              >
                <Hourglass className={navIcon('timeline')} />
                {newDotFor('timeline')}
              </button>
            )}

            {/* Menu Button — never dotted: every "new" destination is a nav button now */}
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
