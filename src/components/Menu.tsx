import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  SquarePlus,
  HelpCircle,
  X,
  Mail,
  Shield,
  FileText,
  Sun,
  Moon,
  Apple,
  Bell,
  BellOff,
  LifeBuoy,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '../hooks/usePWAInstall';
import InstallInstructions from './InstallInstructions';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { useTheme } from '../hooks/useTheme';
import { shareApp } from '../utils/share';
import { APP_VERSION } from '../version';
import HowToPlayModal from './HowToPlayModal';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: () => void;
}

// Daily-reminder toggle row (native app only) — kept open like the theme row
// so the user sees the state change. "On" means it will actually fire: user
// intent AND OS permission.
const DailyReminderMenuItem: React.FC<{ itemClass: string; iconClass: string }> = ({
  itemClass,
  iconClass,
}) => {
  const reminder = useDailyReminder();
  const [showSettingsHint, setShowSettingsHint] = React.useState(false);

  if (!reminder.isSupported) return null;

  const reminderOn = reminder.enabled && reminder.permission === 'granted';

  const handleToggle = () => {
    if (reminderOn) {
      reminder.disable();
    } else if (reminder.permission === 'denied') {
      setShowSettingsHint(true);
    } else if (reminder.permission === 'granted') {
      reminder.enable();
    } else {
      reminder.requestAndEnable();
    }
  };

  return (
    <>
      <button onClick={handleToggle} className={itemClass}>
        {reminderOn ? <Bell className={iconClass} /> : <BellOff className={iconClass} />}
        <span className="font-body">Daily Reminder (8 AM) {reminderOn ? 'On' : 'Off'}</span>
      </button>
      {showSettingsHint && (
        <p className="px-4 pb-2 -mt-1 text-sm text-text-muted font-body">
          Notifications are off for When? — enable them in iOS Settings.
        </p>
      )}
    </>
  );
};

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onShowToast }) => {
  const { canInstall, canShowInstallButton, installScenario, promptInstall } = usePWAInstall();
  const { isDark, toggleTheme } = useTheme();
  const [showInstallModal, setShowInstallModal] = React.useState(false);
  const [showRulesModal, setShowRulesModal] = React.useState(false);

  // Show the App Store link only to iOS users on the web — not inside the
  // native Capacitor app (redundant) and not on Android/desktop (iOS-only app).
  const isIosWeb = installScenario.startsWith('ios-') && !Capacitor.isNativePlatform();

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
    text-left text-text
    hover:bg-border/50
    transition-colors
    min-h-[48px]
  `;

  const iconClass = 'w-5 h-5 text-text flex-shrink-0';

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
              className="fixed top-0 right-0 bottom-0 w-64 bg-surface border-l border-border shadow-sm z-[56] pt-safe flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, bounce: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) onClose();
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-display font-semibold text-lg text-text">Menu</span>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg hover:bg-border/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="py-2 flex-1">
                {/* Theme toggle — kept open so the user sees the switch and can toggle back. */}
                <button onClick={toggleTheme} className={menuItemClass}>
                  {isDark ? <Sun className={iconClass} /> : <Moon className={iconClass} />}
                  <span className="font-body">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <DailyReminderMenuItem itemClass={menuItemClass} iconClass={iconClass} />

                <button onClick={handleShare} className={menuItemClass}>
                  <Share2 className={iconClass} />
                  <span className="font-body">Share App</span>
                </button>

                {isIosWeb && (
                  <a
                    href="https://apps.apple.com/app/id6760845006"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={menuItemClass}
                    onClick={onClose}
                  >
                    <Apple className={iconClass} />
                    <span className="font-body">Download the App</span>
                  </a>
                )}

                {canShowInstallButton && (
                  <button onClick={handleInstall} className={menuItemClass}>
                    <SquarePlus className={iconClass} />
                    <span className="font-body">Add to Home Screen</span>
                  </button>
                )}

                {/* Always here, not only in a game: the rules used to be unreachable from
                    the home screen, which is where a new player looks for them. */}
                <button onClick={handleRules} className={menuItemClass}>
                  <HelpCircle className={iconClass} />
                  <span className="font-body">How to Play</span>
                </button>

                <Link to="/support" className={menuItemClass} onClick={onClose}>
                  <LifeBuoy className={iconClass} />
                  <span className="font-body">Help & FAQ</span>
                </Link>

                <a
                  href="mailto:feedback@play-when.com?subject=When%20Feedback"
                  className={menuItemClass}
                  onClick={onClose}
                >
                  <Mail className={iconClass} />
                  <span className="font-body">Send Feedback</span>
                </a>

                <Link to="/privacy" className={menuItemClass} onClick={onClose}>
                  <Shield className={iconClass} />
                  <span className="font-body">Privacy Policy</span>
                </Link>

                <Link to="/terms" className={menuItemClass} onClick={onClose}>
                  <FileText className={iconClass} />
                  <span className="font-body">Terms of Service</span>
                </Link>
              </div>

              {/* Version */}
              <div className="border-t border-border px-4 py-1 mb-1 pb-safe">
                <p className="text-center font-body text-text-muted">v{APP_VERSION}</p>
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
              className="absolute inset-0 bg-black/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallModal(false)}
            />
            <motion.div
              className="relative w-[85vw] max-w-[320px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-lg font-display font-semibold text-text">Add to Home Screen</h2>
              </div>
              <div className="p-4">
                <InstallInstructions scenario={installScenario} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* How to Play. Above the drawer (reveal layer) so it opens over the open menu. */}
      <HowToPlayModal open={showRulesModal} onDismiss={() => setShowRulesModal(false)} />
    </>
  );
};

export default Menu;
