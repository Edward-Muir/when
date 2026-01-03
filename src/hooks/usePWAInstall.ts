import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallScenario =
  | 'ios-safari'
  | 'ios-chrome'
  | 'ios-firefox'
  | 'ios-other'
  | 'android-chrome'
  | 'android-firefox'
  | 'android-samsung'
  | 'android-other'
  | 'desktop-chrome'
  | 'desktop-firefox'
  | 'desktop-safari'
  | 'desktop-edge'
  | 'desktop-other';

// Detect the install scenario based on device and browser
function getInstallScenario(): InstallScenario {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  // Browser detection
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  const isCriOS = /CriOS/.test(ua); // Chrome on iOS
  const isFirefox = /Firefox/.test(ua);
  const isFxiOS = /FxiOS/.test(ua); // Firefox on iOS
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|Edg/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isSamsungBrowser = /SamsungBrowser/.test(ua);

  if (isIOS) {
    if (isSafari) return 'ios-safari';
    if (isCriOS) return 'ios-chrome';
    if (isFxiOS) return 'ios-firefox';
    return 'ios-other';
  }

  if (isAndroid) {
    if (isSamsungBrowser) return 'android-samsung';
    if (isFirefox) return 'android-firefox';
    if (isChrome) return 'android-chrome';
    return 'android-other';
  }

  // Desktop
  if (isSafari) return 'desktop-safari';
  if (isFirefox) return 'desktop-firefox';
  if (isEdge) return 'desktop-edge';
  if (isChrome) return 'desktop-chrome';
  return 'desktop-other';
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }
    return false;
  }, [installPrompt]);

  // Determine install availability
  const canNativeInstall = !!installPrompt && !isInstalled;

  // Always show install button unless already installed - let the modal explain how to install
  const canShowInstallButton = !isInstalled;

  return {
    canInstall: canNativeInstall,
    canShowInstallButton,
    isInstalled,
    installScenario: getInstallScenario(),
    promptInstall,
  };
}
