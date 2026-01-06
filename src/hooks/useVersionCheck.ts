import { useState, useEffect } from 'react';
import { APP_VERSION } from '../version';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
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
    };

    // Check immediately on mount
    checkVersion();

    // Then check periodically
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return { updateAvailable };
}
