import React, { useState } from 'react';
import { Download, Share2, Sun, Moon, Home, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { shareApp } from '../utils/share';
import { Toast } from './Toast';

interface TopBarProps {
  showHome?: boolean;
  onHomeClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ showHome = false, onHomeClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { canInstall, canShowInstallButton, isIOSSafari, promptInstall } = usePWAInstall();
  const [showToast, setShowToast] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

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
        <div className="flex items-center justify-end gap-2 p-2">
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
              aria-label="Install app"
            >
              <Download className={iconClass} />
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

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={buttonClass}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className={iconClass} />
            ) : (
              <Moon className={iconClass} />
            )}
          </button>

          {/* Home Button - only shows during gameplay */}
          {showHome && onHomeClick && (
            <button
              onClick={onHomeClick}
              className={buttonClass}
              aria-label="Go home"
            >
              <Home className={iconClass} />
            </button>
          )}
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
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setShowInstallModal(false)}
          />
          <div className="relative bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-light-border dark:hover:bg-dark-border transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-light-muted dark:text-dark-muted" />
            </button>

            <h2 className="text-lg font-display text-light-text dark:text-dark-text mb-4">
              Install When?
            </h2>

            {isIOSSafari ? (
              <div className="space-y-3 text-sm text-light-muted dark:text-dark-muted font-body">
                <p>To install on your iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the <strong>Share</strong> button in Safari's toolbar</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> to confirm</li>
                </ol>
                <p className="text-xs mt-4 text-light-muted/70 dark:text-dark-muted/70">
                  The app will appear on your home screen and work offline.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-light-muted dark:text-dark-muted font-body">
                <p>To install this app:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Chrome/Edge:</strong> Look for the install icon in the address bar, or use the browser menu → "Install app"</li>
                  <li><strong>Firefox:</strong> PWA install not supported - bookmark the page instead</li>
                  <li><strong>Safari (Mac):</strong> File → "Add to Dock"</li>
                </ul>
                <p className="text-xs mt-4 text-light-muted/70 dark:text-dark-muted/70">
                  Installing adds the app to your device for quick access and offline play.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-6 py-2 px-4 bg-accent dark:bg-accent-dark text-white rounded-xl font-medium transition-colors hover:bg-accent/90 dark:hover:bg-accent-dark/90 active:scale-95 font-body"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
