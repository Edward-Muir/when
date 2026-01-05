import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, SquarePlus, HelpCircle, X } from 'lucide-react';
import { usePWAInstall, InstallScenario } from '../hooks/usePWAInstall';
import { shareApp } from '../utils/share';
import { GameMode } from '../types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: () => void;
  gameMode?: GameMode | null;
}

// Install instructions component (moved from TopBar)
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

// Game rules component (moved from TopBar)
export const GameRules: React.FC<{ gameMode: GameMode }> = ({ gameMode }) => {
  const textClass = 'text-sm text-light-text dark:text-dark-text font-body leading-relaxed';

  if (gameMode === 'suddenDeath' || gameMode === 'daily') {
    return (
      <div className="text-center space-y-3">
        <p className={textClass}>Build the longest timeline!</p>
        <p className={textClass}>Draw a new card if you place correctly.</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3">
      <p className={textClass}>Place all your cards in the timeline to win.</p>
      <p className={textClass}>Draw a card if you place incorrectly.</p>
    </div>
  );
};

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onShowToast, gameMode }) => {
  const { canInstall, canShowInstallButton, installScenario, promptInstall } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = React.useState(false);
  const [showRulesModal, setShowRulesModal] = React.useState(false);

  const handleShare = async () => {
    const showClipboardToast = await shareApp();
    if (showClipboardToast) onShowToast();
    onClose();
  };

  const handleInstall = () => {
    if (canInstall) {
      promptInstall();
      onClose();
    } else {
      setShowInstallModal(true);
    }
  };

  const handleRules = () => {
    setShowRulesModal(true);
  };

  const menuItemClass = `
    flex items-center gap-3 w-full px-4 py-3
    text-left text-light-text dark:text-dark-text
    hover:bg-light-border/50 dark:hover:bg-dark-border/50
    transition-colors
    min-h-[48px]
  `;

  const iconClass = 'w-5 h-5 text-accent dark:text-accent-dark flex-shrink-0';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/25 dark:bg-black/50 z-[55]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-64 bg-light-card dark:bg-dark-card border-l border-light-border dark:border-dark-border shadow-xl z-[56] pt-safe"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) onClose();
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border">
                <span className="font-display font-semibold text-lg text-accent dark:text-accent-dark">
                  Menu
                </span>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg hover:bg-light-border/50 dark:hover:bg-dark-border/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-light-muted dark:text-dark-muted" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button onClick={handleShare} className={menuItemClass}>
                  <Share2 className={iconClass} />
                  <span className="font-body">Share App</span>
                </button>

                {canShowInstallButton && (
                  <button onClick={handleInstall} className={menuItemClass}>
                    <SquarePlus className={iconClass} />
                    <span className="font-body">Add to Home Screen</span>
                  </button>
                )}

                {gameMode && (
                  <button onClick={handleRules} className={menuItemClass}>
                    <HelpCircle className={iconClass} />
                    <span className="font-body">How to Play</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Install Instructions Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/25 dark:bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallModal(false)}
            />
            <motion.div
              className="relative w-[85vw] max-w-[320px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-accent dark:bg-accent-dark px-4 py-3">
                <h2 className="text-lg font-display text-white text-center">Add to Home Screen</h2>
              </div>
              <div className="px-5 py-5">
                <InstallInstructions scenario={installScenario} />
              </div>
              <div
                className="px-4 py-3 border-t border-light-border/50 dark:border-dark-border/50 cursor-pointer"
                onClick={() => setShowInstallModal(false)}
              >
                <p className="text-light-muted/60 dark:text-dark-muted/60 text-xs text-center font-body">
                  Tap anywhere to close
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Rules Modal */}
      <AnimatePresence>
        {showRulesModal && gameMode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/25 dark:bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRulesModal(false)}
            />
            <motion.div
              className="relative w-[85vw] max-w-[320px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-accent dark:bg-accent-dark px-4 py-3">
                <h2 className="text-lg font-display text-white text-center">How to Play</h2>
              </div>
              <div className="px-5 py-5">
                <GameRules gameMode={gameMode} />
              </div>
              <div
                className="px-4 py-3 border-t border-light-border/50 dark:border-dark-border/50 cursor-pointer"
                onClick={() => setShowRulesModal(false)}
              >
                <p className="text-light-muted/60 dark:text-dark-muted/60 text-xs text-center font-body">
                  Tap anywhere to close
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Menu;
