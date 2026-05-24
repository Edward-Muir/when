import { useEffect } from 'react';
import { preloadImage } from '../utils/preloadImage';

/**
 * Preload an image URL into the browser cache during idle time, so a later view
 * (e.g. the detail popup) can render it instantly. Deferred via requestIdleCallback
 * so it never competes with the initial thumbnail loads; deduped by preloadImage.
 */
export function useImagePreload(url: string | undefined): void {
  useEffect(() => {
    if (!url) return undefined;

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(() => preloadImage(url));
      return () => window.cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(() => preloadImage(url), 200);
    return () => window.clearTimeout(handle);
  }, [url]);
}
