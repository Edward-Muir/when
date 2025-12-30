import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect if browser supports native PWA install prompt
function supportsNativeInstall(): boolean {
  // Chrome, Edge, Samsung Internet, Opera support beforeinstallprompt
  const ua = navigator.userAgent;
  const isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isSamsung = /SamsungBrowser/.test(ua);
  const isOpera = /OPR/.test(ua);
  return isChrome || isEdge || isSamsung || isOpera;
}

// Detect iOS Safari
function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isNotChrome = !/CriOS/.test(ua);
  return isIOS && isWebkit && isNotChrome;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

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
  const canShowInstallButton = !isInstalled && (canNativeInstall || isIOSSafari() || supportsNativeInstall());

  return {
    canInstall: canNativeInstall,
    canShowInstallButton,
    isInstalled,
    isIOSSafari: isIOSSafari(),
    promptInstall,
  };
}
