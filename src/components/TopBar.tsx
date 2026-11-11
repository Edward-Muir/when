import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Menu as MenuIcon, RotateCcw } from 'lucide-react';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { Toast } from './Toast';
import { UpdatePopup } from './UpdatePopup';
import Menu from './Menu';
import RestartConfirmModal from './RestartConfirmModal';

/**
 * Every Home tab, by key; `TABS` in `homeTabs.ts` holds their order, labels and icons.
 * Achievements is not one: the badges live on the Stats tab (`stats/AchievementsSection.tsx`).
 */
export type NavDest = 'home' | 'archive' | 'custom' | 'stats' | 'timeline';

/**
 * The path that opens the home screen on each tab (`src/pages/Home.tsx`), so a refresh or a
 * shared link comes back to the tab it was on.
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
  dailyTheme?: string;
  /** On Home: the menu's "Copied" toast sits above the tab bar. */
  toastAboveTabBar?: boolean;
  /**
   * In a practice game: show a Restart button beside Menu. It asks first, and calls this only
   * once the player confirms.
   */
  onRestart?: () => void;
  /** Restart is held while a placement animates, so it never lands mid-choreography. */
  restartDisabled?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  showHome = false,
  showTitle = true,
  onHomeClick,
  dailyTheme,
  toastAboveTabBar = false,
  onRestart,
  restartDisabled = false,
}) => {
  const { updateAvailable, newVersion, notes: updateNotes } = useVersionCheck();
  const [showToast, setShowToast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);

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
                    // max-w because curated theme names run to 20 characters ("Crowns &
                    // Coronations") and daily pairings to 46 ("Architecture in the Middle East
                    // & North Africa"). Unconstrained, the pill pushes into the nav row on a
                    // 320px screen. It wraps to two lines rather than truncating, because a
                    // pairing's place comes last and is the part a single line cut off; two
                    // lines still fit the nav buttons' 38px row. The full name is on the
                    // Daily hero card either way. `overflow-wrap:anywhere` is for a 320px
                    // screen in a practice game, where Restart makes a third button: it lets
                    // even a one-word name ("Everything") give way rather than push Menu off
                    // the edge. Wider screens never reach it.
                    className="mt-1 max-w-[9.5rem] line-clamp-2 [overflow-wrap:anywhere] px-2 py-0.5 text-xs leading-[1.2] font-body font-medium bg-accent text-white rounded-xl"
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

          {/* Home (in a game), Restart (practice games), Menu. Home's five places are its
              tab bar (`HomeTabBar`), not buttons up here. */}
          <div className="flex items-center gap-2">
            {showHome && onHomeClick && (
              <button onClick={onHomeClick} className={buttonClass} aria-label="Go home">
                <Home className={iconClass} />
              </button>
            )}

            {/* Restart — practice games only (Game decides), behind a confirm */}
            {onRestart && (
              <button
                onClick={() => setIsRestartConfirmOpen(true)}
                disabled={restartDisabled}
                className={`${buttonClass} disabled:opacity-50`}
                aria-label="Restart game"
              >
                <RotateCcw className={iconClass} />
              </button>
            )}

            {/* Menu Button — never dotted: the "new" dots ride on Home's tabs */}
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
        aboveTabBar={toastAboveTabBar}
      />

      {/* Slide-in Menu */}
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onShowToast={() => setShowToast(true)}
      />

      <RestartConfirmModal
        open={isRestartConfirmOpen}
        onClose={() => setIsRestartConfirmOpen(false)}
        onConfirm={() => {
          setIsRestartConfirmOpen(false);
          onRestart?.();
        }}
      />

      {/* Update Available Popup */}
      <UpdatePopup
        isVisible={updateAvailable && !updateDismissed}
        onDismiss={() => setUpdateDismissed(true)}
        version={newVersion}
        notes={updateNotes}
      />
    </>
  );
};

export default TopBar;
