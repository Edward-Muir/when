import React, { useState } from 'react';
import { Sun, Moon, Home, Menu as MenuIcon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Toast } from './Toast';
import Menu from './Menu';
import { GameMode } from '../types';

// Re-export GameRules for backwards compatibility
export { GameRules } from './Menu';

interface TopBarProps {
  showHome?: boolean;
  onHomeClick?: () => void;
  gameMode?: GameMode | null;
}

const TopBar: React.FC<TopBarProps> = ({ showHome = false, onHomeClick, gameMode }) => {
  const { isDark, toggleTheme } = useTheme();
  const [showToast, setShowToast] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const buttonClass = `
    p-2 rounded-xl
    bg-light-card dark:bg-dark-card
    border border-light-border dark:border-dark-border
    hover:bg-light-border dark:hover:bg-dark-border
    transition-colors
    active:scale-95
  `;

  const iconClass = 'w-5 h-5 text-accent dark:text-accent-dark';

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-light-bg dark:bg-dark-bg pt-safe border-b border-light-border dark:border-dark-border transition-colors">
        <div className="flex items-center justify-between gap-2 p-2">
          {/* Game Title */}
          <h1 className="text-3xl font-display font-semibold text-accent dark:text-accent-dark pl-2">
            When?
          </h1>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={buttonClass}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className={iconClass} /> : <Moon className={iconClass} />}
            </button>

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
      />
    </>
  );
};

export default TopBar;
