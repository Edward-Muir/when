import React, { useState } from 'react';
import { Sun, Moon, Home, Menu as MenuIcon, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useVersionCheck } from '../hooks/useVersionCheck';
import { Toast } from './Toast';
import Menu from './Menu';
import { GameMode } from '../types';

// Re-export GameRules for backwards compatibility
export { GameRules } from './Menu';

interface TopBarProps {
  showHome?: boolean;
  showTitle?: boolean;
  onHomeClick?: () => void;
  gameMode?: GameMode | null;
  showFilter?: boolean;
  onFilterClick?: () => void;
  onViewTimeline?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  showHome = false,
  showTitle = true,
  onHomeClick,
  gameMode,
  showFilter = false,
  onFilterClick,
  onViewTimeline,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { updateAvailable } = useVersionCheck();
  const [showToast, setShowToast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const buttonClass = `
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
            <h1 className="text-3xl font-display font-semibold text-text pl-2">When?</h1>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {/* Update Available Button */}
            {updateAvailable && (
              <button
                onClick={() => window.location.reload()}
                className={`${buttonClass} bg-accent text-white border-accent hover:bg-accent/90`}
                aria-label="Update available - click to refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={buttonClass}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className={iconClass} /> : <Moon className={iconClass} />}
            </button>

            {/* Filter Button - only shows on View Timeline */}
            {showFilter && onFilterClick && (
              <button onClick={onFilterClick} className={buttonClass} aria-label="Filter timeline">
                <SlidersHorizontal className={iconClass} />
              </button>
            )}

            {/* Home Button - only shows during gameplay */}
            {showHome && onHomeClick && (
              <button onClick={onHomeClick} className={buttonClass} aria-label="Go home">
                <Home className={iconClass} />
              </button>
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
        onViewTimeline={onViewTimeline}
      />
    </>
  );
};

export default TopBar;
