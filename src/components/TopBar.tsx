import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Menu as MenuIcon,
  SlidersHorizontal,
  Share2,
  BarChart3,
  Trophy,
  History,
} from 'lucide-react';
import { shareApp } from '../utils/share';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { Toast } from './Toast';
import { UpdatePopup } from './UpdatePopup';
import Menu from './Menu';
import { GameMode } from '../types';

interface TopBarProps {
  showHome?: boolean;
  showTitle?: boolean;
  onHomeClick?: () => void;
  gameMode?: GameMode | null;
  showFilter?: boolean;
  onFilterClick?: () => void;
  dailyTheme?: string;
  /** Show the Stats + Achievements + Timeline buttons (navigate to their pages). */
  showStatsAchievements?: boolean;
  /** Which nav destination is the current page — that button renders in the active style. */
  activeNav?: 'stats' | 'achievements' | 'timeline';
}

const TopBar: React.FC<TopBarProps> = ({
  showHome = false,
  showTitle = true,
  onHomeClick,
  gameMode,
  showFilter = false,
  onFilterClick,
  dailyTheme,
  showStatsAchievements = false,
  activeNav,
}) => {
  const navigate = useNavigate();
  const { updateAvailable } = useVersionCheck();
  const [showToast, setShowToast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const buttonClass = `
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
    p-2 rounded-xl
    bg-accent
    border border-accent
    transition-colors
    active:scale-95
  `;
  const activeIconClass = 'w-5 h-5 text-white';

  const navBtn = (key: 'stats' | 'achievements' | 'timeline') =>
    activeNav === key ? activeButtonClass : buttonClass;
  const navIcon = (key: 'stats' | 'achievements' | 'timeline') =>
    activeNav === key ? activeIconClass : iconClass;

  const handleShare = async () => {
    const showClipboardToast = await shareApp();
    if (showClipboardToast) setShowToast(true);
  };

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

          {/* Consistent order across screens: Filter · Home · Stats · Achievements · Timeline · Share · Menu.
              The group is right-aligned, so the page-specific Filter sits in the leftmost slot —
              its appearance/absence never shifts the consistent Home…Menu cluster. */}
          <div className="flex items-center gap-2">
            {/* Filter Button - only shows on the timeline page; leftmost so it doesn't shift the rest */}
            {showFilter && onFilterClick && (
              <button onClick={onFilterClick} className={buttonClass} aria-label="Filter timeline">
                <SlidersHorizontal className={iconClass} />
              </button>
            )}

            {/* Home Button - shown off the main menu */}
            {showHome && onHomeClick && (
              <button onClick={onHomeClick} className={buttonClass} aria-label="Go home">
                <Home className={iconClass} />
              </button>
            )}

            {/* Stats + Achievements + Timeline (sibling routes; active one is highlighted) */}
            {showStatsAchievements && (
              <>
                <button
                  onClick={() => navigate('/stats')}
                  className={navBtn('stats')}
                  aria-label="View stats"
                  aria-current={activeNav === 'stats' ? 'page' : undefined}
                >
                  <BarChart3 className={navIcon('stats')} />
                </button>
                <button
                  onClick={() => navigate('/achievements')}
                  className={navBtn('achievements')}
                  aria-label="View achievements"
                  aria-current={activeNav === 'achievements' ? 'page' : undefined}
                >
                  <Trophy className={navIcon('achievements')} />
                </button>
                <button
                  onClick={() => navigate('/timeline')}
                  className={navBtn('timeline')}
                  aria-label="View my timeline"
                  aria-current={activeNav === 'timeline' ? 'page' : undefined}
                >
                  <History className={navIcon('timeline')} />
                </button>
              </>
            )}

            {/* Share Button */}
            <button onClick={handleShare} className={buttonClass} aria-label="Share app">
              <Share2 className={iconClass} />
            </button>

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
