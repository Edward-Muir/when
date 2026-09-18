import { useState, useEffect, useCallback, useRef } from 'react';
import { APP_VERSION } from '../version';
import type { VersionManifest } from '../utils/releaseNotes';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface VersionCheck {
  updateAvailable: boolean;
  /** The version being offered, once one is. */
  newVersion: string | null;
  /** What changed in it, so the popup can say so. Empty when the build carried no notes. */
  notes: string[];
}

export function useVersionCheck(): VersionCheck {
  const [available, setAvailable] = useState<{ version: string; notes: string[] } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch('/version.json', {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = (await response.json()) as Partial<VersionManifest>;
      if (data.version && data.version !== APP_VERSION) {
        // scripts/inject-version.js writes the notes alongside the version, so this is the
        // whole payload the popup needs. Older builds wrote `{ version }` alone, hence the
        // fallback: a missing list is a popup without notes, never a broken one.
        setAvailable({
          version: data.version,
          notes: Array.isArray(data.notes) ? data.notes.filter((n) => typeof n === 'string') : [],
        });
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

  return {
    updateAvailable: available !== null,
    newVersion: available?.version ?? null,
    notes: available?.notes ?? [],
  };
}
