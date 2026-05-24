const requested = new Set<string>();

/**
 * Warm the browser cache for an image URL. Fire-and-forget and deduplicated, so
 * the same URL is only ever fetched once. No-op for falsy URLs or non-browser envs.
 */
export function preloadImage(url: string | undefined): void {
  if (!url || typeof window === 'undefined' || requested.has(url)) return;
  requested.add(url);
  const img = new Image();
  img.src = url;
}
