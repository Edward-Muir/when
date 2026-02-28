import { useState, useEffect, useCallback, useRef } from 'react';
import { APP_VERSION } from '../version';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch('/version.json', {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.version && data.version !== APP_VERSION) {
        setUpdateAvailable(true);
      }
    } catch {
      // Network error - silently ignore
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    checkVersion();
    intervalRef.current = setInterval(checkVersion, CHECK_INTERVAL_MS);
  }, [checkVersion]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startPolling();

    // Pause polling when app is backgrounded
    const handlePause = () => stopPolling();
    const handleResume = () => startPolling();
    const handleVisibility = () => {
      if (document.hidden) stopPolling();
      else startPolling();
    };

    window.addEventListener('appPause', handlePause);
    window.addEventListener('appResume', handleResume);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      window.removeEventListener('appPause', handlePause);
      window.removeEventListener('appResume', handleResume);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [startPolling, stopPolling]);

  return { updateAvailable };
}
