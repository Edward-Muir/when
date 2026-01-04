import React, { useState } from 'react';
import { SquarePlus, Share2, Sun, Moon, Home, Info } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { usePWAInstall, InstallScenario } from '../hooks/usePWAInstall';
import { shareApp } from '../utils/share';
import { Toast } from './Toast';
import { GameMode } from '../types';

interface TopBarProps {
  showHome?: boolean;
  onHomeClick?: () => void;
  gameMode?: GameMode | null;
}

// Separate component to reduce complexity
const InstallInstructions: React.FC<{ scenario: InstallScenario }> = ({ scenario }) => {
  const baseClass = 'space-y-3 text-sm text-light-muted dark:text-dark-muted font-body';
  const noteClass = 'text-xs mt-4 text-light-muted/70 dark:text-dark-muted/70';

  switch (scenario) {
    case 'ios-safari':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>Share</strong> button (□↑) in Safari
            </li>
            <li>
              Tap <strong>"Add to Home Screen"</strong>
            </li>
            <li>
              Tap <strong>"Add"</strong>
            </li>
          </ol>
        </div>
      );
    case 'ios-chrome':
    case 'ios-firefox':
    case 'ios-other':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>Share</strong> button in your browser
            </li>
            <li>
              Tap <strong>"Add to Home Screen"</strong>
            </li>
            <li>
              Tap <strong>"Add"</strong>
            </li>
          </ol>
          <p className={noteClass}>Requires iOS 16.4 or later.</p>
        </div>
      );
    case 'android-chrome':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>menu button</strong> (⋮)
            </li>
            <li>
              Tap <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong>
            </li>
            <li>
              Tap <strong>"Install"</strong>
            </li>
          </ol>
        </div>
      );
    case 'android-firefox':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>menu button</strong> (⋮)
            </li>
            <li>
              Tap <strong>"Install"</strong>
            </li>
          </ol>
        </div>
      );
    case 'android-samsung':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap the <strong>menu button</strong> (☰)
            </li>
            <li>
              Tap <strong>"Add page to"</strong>
            </li>
            <li>
              Tap <strong>"Home screen"</strong>
            </li>
          </ol>
        </div>
      );
    case 'android-other':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Tap your browser's <strong>menu button</strong>
            </li>
            <li>
              Look for <strong>"Add to Home Screen"</strong> or <strong>"Install"</strong>
            </li>
          </ol>
        </div>
      );
    case 'desktop-chrome':
    case 'desktop-edge':
      return (
        <div className={baseClass}>
          <p>
            Look for the <strong>install icon</strong> (⊕) in the address bar, or:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Open the browser <strong>menu</strong>
            </li>
            <li>
              Click <strong>"Install app"</strong>
            </li>
          </ol>
        </div>
      );
    case 'desktop-safari':
      return (
        <div className={baseClass}>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Click <strong>File</strong> in the menu bar
            </li>
            <li>
              Click <strong>"Add to Dock"</strong>
            </li>
          </ol>
        </div>
      );
    case 'desktop-firefox':
      return (
        <div className={baseClass}>
          <p>Firefox doesn't support installing web apps.</p>
          <p className="text-xs mt-2 text-light-muted/70 dark:text-dark-muted/70">
            Try Chrome, Edge, or Safari, or bookmark this page.
          </p>
        </div>
      );
    case 'desktop-other':
    default:
      return (
        <div className={baseClass}>
          <p>
            Check your browser's menu for an <strong>"Install"</strong> or{' '}
            <strong>"Add to Home Screen"</strong> option.
          </p>
          <p className="text-xs mt-2 text-light-muted/70 dark:text-dark-muted/70">
            Chrome and Edge have the best support for web apps.
          </p>
        </div>
      );
  }
};

export const GameRules: React.FC<{ gameMode: GameMode }> = ({ gameMode }) => {
  const textClass = 'text-sm text-light-text dark:text-dark-text font-body leading-relaxed';

  // Daily and sudden death share the same mechanics
  if (gameMode === 'suddenDeath' || gameMode === 'daily') {
    return (
      <div className="text-center space-y-3">
        <p className={textClass}>Build the longest timeline!</p>
        <p className={textClass}>Draw a new card if you place correctly.</p>
      </div>
    );
  }

  // freeplay only
  return (
    <div className="text-center space-y-3">
      <p className={textClass}>Place all your cards in the timeline to win.</p>
      <p className={textClass}>Draw a card if you place incorrectly.</p>
    </div>
  );
};

const TopBar: React.FC<TopBarProps> = ({ showHome = false, onHomeClick, gameMode }) => {
  const { isDark, toggleTheme } = useTheme();
  const { canInstall, canShowInstallButton, installScenario, promptInstall } = usePWAInstall();
  const [showToast, setShowToast] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

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
            {/* Install Button - shows when install is available or to provide instructions */}
            {canShowInstallButton && (
              <button
                onClick={() => {
                  if (canInstall) {
                    promptInstall();
                  } else {
                    setShowInstallModal(true);
                  }
                }}
                className={buttonClass}
                aria-label="Add to Home Screen"
              >
                <SquarePlus className={iconClass} />
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={async () => {
                const showClipboardToast = await shareApp();
                if (showClipboardToast) setShowToast(true);
              }}
              className={buttonClass}
              aria-label="Share game"
            >
              <Share2 className={iconClass} />
            </button>

            {/* Info Button - only during gameplay */}
            {gameMode && (
              <button
                onClick={() => setShowInfoModal(true)}
                className={buttonClass}
                aria-label="Game rules"
              >
                <Info className={iconClass} />
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

            {/* Home Button - only shows during gameplay */}
            {showHome && onHomeClick && (
              <button onClick={onHomeClick} className={buttonClass} aria-label="Go home">
                <Home className={iconClass} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast for clipboard copy */}
      <Toast
        message="Copied to clipboard!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Install Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/25 dark:bg-black/50"
            onClick={() => setShowInstallModal(false)}
          />
          <div className="relative w-[85vw] max-w-[320px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card shadow-xl">
            {/* Header with accent background */}
            <div className="bg-accent dark:bg-accent-dark px-4 py-3">
              <h2 className="text-lg font-display text-white text-center">Add to Home Screen</h2>
            </div>

            {/* Instructions content */}
            <div className="px-5 py-5">
              <InstallInstructions scenario={installScenario} />
            </div>

            {/* Footer hint */}
            <div
              className="px-4 py-3 border-t border-light-border/50 dark:border-dark-border/50 cursor-pointer"
              onClick={() => setShowInstallModal(false)}
            >
              <p className="text-light-muted/60 dark:text-dark-muted/60 text-xs text-center font-body">
                Tap anywhere to close
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game Rules Modal */}
      {showInfoModal && gameMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/25 dark:bg-black/50"
            onClick={() => setShowInfoModal(false)}
          />
          <div className="relative w-[85vw] max-w-[320px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card shadow-xl">
            {/* Header with accent background */}
            <div className="bg-accent dark:bg-accent-dark px-4 py-3">
              <h2 className="text-lg font-display text-white text-center">How to Play</h2>
            </div>

            {/* Rules content */}
            <div className="px-5 py-5">
              <GameRules gameMode={gameMode} />
            </div>

            {/* Footer hint */}
            <div
              className="px-4 py-3 border-t border-light-border/50 dark:border-dark-border/50 cursor-pointer"
              onClick={() => setShowInfoModal(false)}
            >
              <p className="text-light-muted/60 dark:text-dark-muted/60 text-xs text-center font-body">
                Tap anywhere to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
