import React, { useState } from 'react';
import {
  Apple,
  FileText,
  LifeBuoy,
  Mail,
  RotateCcw,
  Share2,
  Shield,
  Sparkles,
  SquarePlus,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { shareApp } from '../../utils/share';
import { resetHintsSeen } from '../../utils/playerStorage';
import { APP_VERSION } from '../../version';
import { pathForNav } from '../homeTabs';
import InstallInstructions from '../InstallInstructions';
import Modal from '../ui/Modal';
import { RowCard, RowChevron, rowClass, rowIconClass } from './rows';

interface MoreCardProps {
  /** Say something happened, in the tab's toast: a copied link, hints coming back. */
  onNotice: (message: string) => void;
}

/** Where an info page's Back returns to: this tab, not the Daily (`InfoPageLayout`). */
const backToSettings = { from: pathForNav('stats') };

/**
 * The rest of what the burger menu held, at the foot of the Settings tab: sharing and
 * installing the app, Reset Hints, the info pages and the version.
 */
const MoreCard: React.FC<MoreCardProps> = ({ onNotice }) => {
  const { canInstall, canShowInstallButton, installScenario, promptInstall } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);

  // The App Store link is for iOS users on the web only: not inside the native app
  // (redundant) and not on Android or desktop.
  const isIosWeb = installScenario.startsWith('ios-') && !Capacitor.isNativePlatform();

  const handleShare = async () => {
    if (await shareApp()) onNotice('Copied to clipboard!');
  };

  const handleInstall = () => {
    if (canInstall) promptInstall();
    else setShowInstallModal(true);
  };

  // No confirm: nothing is lost, the hints just come back.
  const handleResetHints = () => {
    resetHintsSeen();
    onNotice('Hints will show again');
  };

  return (
    <>
      <RowCard>
        <button type="button" onClick={handleShare} className={rowClass}>
          <Share2 className={rowIconClass} />
          <span>Share App</span>
        </button>

        {isIosWeb && (
          <a
            href="https://apps.apple.com/app/id6760845006"
            target="_blank"
            rel="noopener noreferrer"
            className={rowClass}
          >
            <Apple className={rowIconClass} />
            <span>Download the App</span>
            <RowChevron />
          </a>
        )}

        {canShowInstallButton && (
          <button type="button" onClick={handleInstall} className={rowClass}>
            <SquarePlus className={rowIconClass} />
            <span>Add to Home Screen</span>
          </button>
        )}

        <button type="button" onClick={handleResetHints} className={rowClass}>
          <RotateCcw className={rowIconClass} />
          <span>Reset Hints</span>
        </button>

        <Link to="/changelog" state={backToSettings} className={rowClass}>
          <Sparkles className={rowIconClass} />
          <span>What&apos;s New</span>
          <RowChevron />
        </Link>

        <Link to="/support" state={backToSettings} className={rowClass}>
          <LifeBuoy className={rowIconClass} />
          <span>Help & FAQ</span>
          <RowChevron />
        </Link>

        <a href="mailto:feedback@play-when.com?subject=When%20Feedback" className={rowClass}>
          <Mail className={rowIconClass} />
          <span>Send Feedback</span>
        </a>

        <Link to="/privacy" state={backToSettings} className={rowClass}>
          <Shield className={rowIconClass} />
          <span>Privacy Policy</span>
          <RowChevron />
        </Link>

        <Link to="/terms" state={backToSettings} className={rowClass}>
          <FileText className={rowIconClass} />
          <span>Terms of Service</span>
          <RowChevron />
        </Link>
      </RowCard>

      {/* The version line is where someone looks to ask what they are on and what is in it,
          so it is the second way into the same page. */}
      <Link
        to="/changelog"
        state={backToSettings}
        className="flex min-h-[44px] items-center justify-center font-body text-sm text-text-muted"
      >
        v{APP_VERSION}
      </Link>

      <Modal
        open={showInstallModal}
        onDismiss={() => setShowInstallModal(false)}
        size="compact"
        header="Add to Home Screen"
      >
        <div className="p-4">
          <InstallInstructions scenario={installScenario} />
        </div>
      </Modal>
    </>
  );
};

export default MoreCard;
